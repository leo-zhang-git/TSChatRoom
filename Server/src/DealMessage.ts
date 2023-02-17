import {Socket} from 'net'
import {redisClient} from './redisConnection'
import { CmdMsg, JoinRecMsg, JsonToObj, KickMsg, ListRecMsg, LoginMsg, LoginRecMsg, Print, RefreshRecMsg, ReplyMsg, SayMsg, SayRecMsg, SendMsg, ServerMsg, SignupMsg, SignupRecMsg } from './SocketPackageIO'

const ACCOUNTMARK = 'uidCnt'
const MAXROOM = 10
const DEFAULTROOMNAME = '未设置房间名'
const ROOMDELTIME = 10 * 1000
let nexRoom = 0

type State = 'loby' | 'room'
interface Person{
    type: 'user' | 'admin'
    account: string
    name: string
    pwd: string
}
interface Room{
    rid: string
    rname: string
    members: Person[]
    lastEmptyTime?: Date
}
interface PersonState{
    person: Person
    state: State 
    room?: Room
}

let findPerson = new Map<Socket, PersonState>()
let findClient :{
    [K: string]: Socket
} = {}

let roomList: {[rid: string]: Room} = {}
let gameRoom:{[rid: string]: {round: number, rid: string, state: 'standy' | 'countdown' | 'starting', lastplayerTime: Date, winner: {account: string, name: string, score: number, only: boolean}, playerList: string[]}} = {}

export const DealCmd = (socket: Socket, message: CmdMsg) =>{
    switch(message.cmd){
        case 'create room':
            DoCreateRoom(socket, message)
            break
        case 'refresh':
            DoRefresh(socket)
            break
        case 'list':
            DoList(socket)
            break
        case 'logout':
            DoLogout(socket)
            break
        case 'leave':
            DoLeave(socket)
            break
        case 'roll':
            DoRoll(socket)
            break
        default:
            break
    }
}

export const DoSignup = async(socket: Socket, message: SignupMsg) =>{
    Print.print('DoSignup')

    let recMsg:SignupRecMsg = {
        type: 'signupRec',
        text: '',
        account: '',
        ret: false
    }
    // Invaild password or name
    if(!IsCorrectPwd(message.pwd) || !IsCorrectName(message.name)){
        recMsg.text = "名字或密码不合法(密码长度至少为6)"
        SendMsg(socket, recMsg)
        return
    }

    let person: Person = {
        type: 'user',
        account: (await redisClient.incr(ACCOUNTMARK)).toString(),
        name: message.name,
        pwd: message.pwd
    }
    Print.print('signup set redis: ' + JSON.stringify(person))
    redisClient.set(person.account, JSON.stringify(person))
    
    recMsg.ret = true
    recMsg.text = '注册账号成功'
    recMsg.account = person.account
    SendMsg(socket, recMsg)

}
 
export const DoLogin = async(socket: Socket, message: LoginMsg) => {
    Print.print('DoLogin')

    let recMsg:LoginRecMsg = {
        type: 'loginRec',
        text: '',
        ret: false
    }

    // Account not exist
    if(await redisClient.exists(message.account)  === 0){
        recMsg.text = '账号不存在'
        SendMsg(socket, recMsg)
        return
    }

    // Password incorrect
    let json = await redisClient.get(message.account) as string
    Print.print('get account from redis: ' + json)
    let person: Person = JsonToObj(json)
    if(person.pwd !== message.pwd){
        recMsg.text = '密码错误'
        SendMsg(socket, recMsg)
        return
    }

    OnlinePerson(socket, person)
    recMsg.ret = true
    recMsg.text = '登录成功'
    SendMsg(socket, recMsg)
}

const DoCreateRoom = (socket: Socket, message: CmdMsg) =>{
    Print.print('DoCreateRoom')
    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to create room offline')
        return
    }
    let personState = GetPersonState(socket)
    if(personState.state !== 'loby'){
        Print.Warn('has invaild client to create room not in loby')
        return
    }
    if(Object.keys(roomList).length === MAXROOM){
        SendMsg(socket, {type: 'server', text: '当前房间数已达上限'})
        return
    }
    let room: Room = {
        rid : (nexRoom++).toString(),
        rname: message.arg ?? DEFAULTROOMNAME,
        members: [],
    }
    roomList[room.rid] = room
    DoJoin(socket, room.rid)
}

const DoRefresh = (socket: Socket) =>{
    Print.print('DoRefresh')
    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to refresh offline')
        return
    }
    let personState = GetPersonState(socket)
    if(personState.state !== 'loby'){
        Print.Warn('has invaild client to refresh not in loby')
        return
    }
    let message: RefreshRecMsg = {
        type: 'refreshRec',
        rooms: []
    }
    // eslint-disable-next-line guard-for-in
    for(let i in roomList){
        message.rooms.push({rid: i, rname: roomList[i].rname, memberCnt: roomList[i].members.length})
    }
    SendMsg(socket, message)
}

const DoList = (socket: Socket) =>{
    Print.print('DoList')
    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to get list offline')
        return
    }
    let personState = GetPersonState(socket)
    if(!personState.room){
        Print.Warn('has invaild client to get list not in loby')
        return
    }

    let members = personState.room.members
    let message: ListRecMsg = {
        type : 'listRec',
        memberList: members.map((e) => {return {uname: e.name, account: e.account}})
    }
    SendMsg(socket, message)
}

const DoLogout = (socket: Socket) =>{
    Print.print('DoLogout')
    if(!ClientIsLogin(socket)) return
    let personState = GetPersonState(socket)
    if(personState.state === 'room') DoLeave(socket)

    Print.print(personState.person.account + ' 退出登录')
    delete findClient[personState.person.account]
    findPerson.delete(socket)
    SendMsg(socket, {type: 'command', cmd: 'logout'})
}

const DoLeave = (socket: Socket) =>{
    Print.print('DoLeave')
    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to leave room offline')
        return
    }
    let personState = GetPersonState(socket)
    if(!personState.room){
        Print.Warn('has invaild client to leave room not in room')
        return
    }
    if(personState.room.rid in gameRoom){
        SendMsg(socket, {type: 'server', text: '游戏结束前无法退出房间'})
        return
    }
    RoomDelMember(personState.room as Room, personState.person)
    personState.state = 'loby'
    personState.room = undefined
    SendMsg(socket, {type: 'command', cmd: 'leave'})
}

const DoRoll = (socket: Socket) =>{
    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to start roll offline')
        return
    }
    let personState = GetPersonState(socket)
    if(!personState.room){
        Print.Warn('has invaild client to start roll not in room')
        return
    }

    let rid = personState.room.rid

    let play = (idx: number, playerList: string[], room: typeof gameRoom[string]) =>{
        if(room.state !== 'starting' || !(rid in roomList)) return
        // eslint-disable-next-line no-param-reassign
        while(idx < playerList.length && !(playerList[idx] in findClient)) idx ++;
        if(idx < playerList.length){
            let score = Math.round(Math.random() * 100)
            // let score = 10
            let uname = GetPersonState(findClient[playerList[idx]]).person.name
            if(score > room.winner.score){
                room.winner.score = score
                room.winner.account = playerList[idx]
                room.winner.name = uname
                room.winner.only = true
            }
            else if(score === room.winner.score){
                room.winner.only = false
            }
            for(let i of roomList[rid].members){
                if(i.account in findClient)
                    SendMsg(findClient[i.account], {type: 'server', text: `玩家 ${playerList[idx]}[${uname}] 的得分为 ${score}`})
            }
        }
        if(idx >= playerList.length){
            let message: ServerMsg = {type: 'server', text: ''}
            if(room.winner.only){
                message.text = `玩家 ${room.winner.account}[${room.winner.name}]的得分为 ${room.winner.score}  得分最高 `
                for(let i of roomList[rid].members){
                    if(i.account in findClient) SendMsg(findClient[i.account], message)
                }
                delete gameRoom[room.rid]
            }
            else{
                if(room.round >= 5) message.text = '不存在最高分， 回合数达到上限，游戏平局\n\n'
                else message.text = '不存在最高分， 倒计时后重新开始游戏\n\n'
                for(let i of roomList[rid].members){
                    if(i.account in findClient)
                        SendMsg(findClient[i.account], message)
                }

                if(room.round < 5){
                    room.round++
                    restartCountdown(5, playerList, room)
                }
            }
            return
        }
        setTimeout(() =>{play(idx + 1, playerList, room)}, 1 * 1000)
    }

    let countdown = (second: number, playerList: string[], room: typeof gameRoom[string]) =>{
        if(room.state !== 'countdown' || !(rid in roomList)) return
        for(let i of roomList[rid].members){
            if(i.account in findClient)
                SendMsg(findClient[i.account], {type: 'server', text: '倒计时: ' + second})
        }
        if(second > 0) setTimeout(() => {countdown(second - 1, playerList, room)}, 1 * 1000)
        if(second === 0 && (new Date()).getTime() - gameRoom[rid].lastplayerTime.getTime() >= 5 * 1000){
            room.state = 'starting'
            for(let i of roomList[rid].members){
                if(i.account in findClient)
                    SendMsg(findClient[i.account], {type: 'server', text: '游戏开始\n\n'})
            }
            play(0, playerList, room)
        }
    }

    let restartCountdown = (second: number, playerList: string[], room: typeof gameRoom[string]) =>{
        if(room.state !== 'starting' || !(rid in roomList)) return
        for(let i of roomList[rid].members){
            if(i.account in findClient)
                SendMsg(findClient[i.account], {type: 'server', text: '倒计时: ' + second})
        }
        if(second > 0) setTimeout(() => {restartCountdown(second - 1, playerList, room)}, 1 * 1000)
        if(second === 0){
            room.state = 'starting'
            for(let i of roomList[rid].members){
                if(i.account in findClient)
                    SendMsg(findClient[i.account], {type: 'server', text: '重新开始\n\n'})
            }
            play(0, playerList, room)
        }
    }

    if(rid in gameRoom){
        if(gameRoom[rid].playerList.indexOf(personState.person.account) !== -1){
            SendMsg(findClient[personState.person.account], {type: 'server', text: '您已经在游戏中！'})
            return
        }
        if(gameRoom[rid].state === 'starting'){
            SendMsg(findClient[personState.person.account], {type: 'server', text: '游戏已经开始，请等待下一轮'})
            return
        }
        gameRoom[rid].playerList.push(personState.person.account)
        gameRoom[rid].lastplayerTime = new Date()
        gameRoom[rid].state = 'standy'
        setTimeout(() =>{
            if(gameRoom[rid].state === 'standy' && (new Date()).getTime() - gameRoom[rid].lastplayerTime.getTime() >= 5 * 1000) {
                gameRoom[rid].state = 'countdown'
                countdown(5, gameRoom[rid].playerList, gameRoom[rid]) 
            }
            }, 5 * 1000)
    }
    else{
        gameRoom[rid] = {
            round: 1,
            rid: rid,
            state: 'standy',
            lastplayerTime: new Date(),
            winner: {account: '', name: '', only: false, score: 0},
            playerList: [personState.person.account]
        }
        for(let i of personState.room.members){
            SendMsg(findClient[i.account], {type: 'server', text: '开始roll点游戏'})
        }

        setTimeout(() =>{
            if(gameRoom[rid].state === 'standy' && (new Date()).getTime() - gameRoom[rid].lastplayerTime.getTime() >= 5 * 1000) {
                gameRoom[rid].state = 'countdown'
                countdown(5, gameRoom[rid].playerList, gameRoom[rid]) 
            }
            }, 5 * 1000)
    }
    for(let i of personState.room.members){
        SendMsg(findClient[i.account], {type: 'server', text: `玩家 ${personState.person.account}[${personState.person.name}] 加入游戏`})
    }
}

export const DoJoin = (socket: Socket, rid: string) =>{
    Print.print('DoJoin')

    let message: JoinRecMsg = {
        type: 'joinRec',
        rid: rid,
        ret: false,
        rname: ''
    }

    if(!(rid in roomList)){
        SendMsg(socket, message)
        return
    }

    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to join room offline')
        SendMsg(socket, message)
        return
    }

    let personState = GetPersonState(socket)
    if(personState.state !== 'loby'){
        Print.Warn('has invaild client to join room not in loby')
        SendMsg(socket, message)
        return
    }

    
    RoomAddMember(roomList[rid], personState)

    message.ret = true
    message.rname = personState.room?.rname as string
    SendMsg(socket, message)
}

export const DoSay = (socket: Socket, message: SayMsg) =>{
    Print.print('DoSay')
    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to say offline')
        return
    }
    let personState = GetPersonState(socket)
    if(!personState.room){
        Print.Warn('has invaild client to say not in room')
        return
    }

    let recMsg: SayRecMsg = {
        type : 'sayRec',
        text : message.text,
        mentionYou: false,
        senderName: personState.person.name,
    }
    for(let i of personState.room.members){
        recMsg.mentionYou = recMsg.text.match('@' + i.name) !== null
        SendMsg(findClient[i.account], recMsg)
    }
}

export const DoReply = (socket: Socket, message: ReplyMsg) =>{
    Print.print('DoSay')
    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to reply offline')
        return
    }
    let personState = GetPersonState(socket)
    if(!personState.room){
        Print.Warn('has invaild client to reply not in room')
        return
    }

    for(let i of personState.room.members){
        message.mentionYou = message.text.match('@' + i.name) !== null
        message.senderName = personState.person.name
        SendMsg(findClient[i.account], message)
    }
}

export const DoKick = (socket: Socket, message: KickMsg) =>{
    Print.print('DoKick')
    if(!ClientIsLogin(socket)){
        Print.Warn('has invaild client to kick offline')
        return
    }
    let personState = GetPersonState(socket)
    if(!personState.room){
        Print.Warn('has invaild client to kick not in room')
        return
    }
    
    let recMsg: ServerMsg = {
        type: 'server',
        text: ''
    }
    
    if(personState.person.type === 'admin'){
        if(!(personState.room.members.some( e => e.account === message.account))){
            recMsg.text = '房间中不存在该用户'
        }
        else{
            let user = findClient[message.account]
            SendMsg(user, {type: 'server', text: '您已被管理员踢出房间'})
            DoLeave(user)
            recMsg.text = '成功踢出该用户'
        }
    }
    else{
        recMsg.text = '您没有管理员权限'
    }
    SendMsg(socket, recMsg)
}

export const ForceLogout = (socket: Socket) => {
    DoLogout(socket)
    if(!socket.closed) socket.end()
}

function IsCorrectPwd(pwd: string): boolean {
    let ret = pwd.match(/[A-Za-z0-9]{6,}/)
    return ret !== null && ret[0] === pwd
}
function IsCorrectName(name: string): boolean {
    return name.length > 0
}

function IsOnline(person: Person){
    return person.account in findClient
}
function ClientIsLogin(socket: Socket){
    return findPerson.has(socket)
}
function GetPersonState(socket: Socket){
    return findPerson.get(socket) as PersonState
}
function OnlinePerson(socket: Socket, person: Person){
    // Multiple logins
    if(person.account in findClient){
        ForceLogout(findClient[person.account])
    }
    findClient[person.account] = socket
    findPerson.set(socket, {person: person, state: 'loby'})
}

function RoomAddMember(room: Room, personState: PersonState){
    personState.state = 'room'
    personState.room = room
    room.members.push(personState.person)
    room.lastEmptyTime = undefined
}

function RoomDelMember(room: Room, member: Person){
    room.members.splice(room.members.indexOf(member), 1)
    if(room.members.length === 0){
        room.lastEmptyTime = new Date()
        setTimeout(() =>{DelRoom(room.rid, false)}, ROOMDELTIME)
    }
}
function DelRoom(rid: string, force: boolean){
    // TODO Force delete room
    if(force || (roomList[rid].lastEmptyTime && 
        new Date().getTime() - (roomList[rid].lastEmptyTime?.getTime() as number) > ROOMDELTIME))
        delete roomList[rid]
}