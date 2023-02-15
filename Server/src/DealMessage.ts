import {Socket} from 'net'
import {redisClient} from './redisConnection'
import { CmdMsg, JoinMsg, JoinRecMsg, JsonToObj, LoginMsg, LoginRecMsg, Print, RefreshRecMsg, SendMsg, ServerMsg, SignupMsg, SignupRecMsg, TcpMessage } from './SocketPackageIO'

const ACCOUNTMARK = 'uidCnt'
const MAXROOM = 1
const DEFAULTROOMNAME = '未设置房间名'
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

export const DealCmd = (socket: Socket, message: CmdMsg) =>{
    switch(message.cmd){
        case 'create room':
            DoCreateRoom(socket, message)
            break
        case 'refresh':
            DoRefresh(socket)
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
        members: []
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
        message.rooms.push({rid: i, rname: roomList[i].rname})
    }
    SendMsg(socket, message)
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

    personState.state = 'room'
    personState.room = roomList[rid]
    roomList[rid].members.push(personState.person)

    message.ret = true
    message.rname = personState.room.rname
    SendMsg(socket, message)
}

export const ForceLogout = (socket: Socket) => {
    if(ClientIsLogin(socket)){
        let personState = GetPersonState(socket)
        if(personState.room){
            RoomDelMember(personState.room, personState.person)
        }

        delete findClient[personState.person.account]
        findPerson.delete(socket)
    }
    socket.end()
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

function RoomDelMember(room: Room, member: Person){
    room.members.splice(room.members.indexOf(member), 1)
    if(room.members.length === 0) setTimeout(() =>{DelRoom(room.rid, false)}, 10 * 1000)
}
function DelRoom(rid: string, force: boolean){
    // TODO Force delete room
    if(force || roomList[rid].members.length === 0)
        delete roomList[rid]
}
