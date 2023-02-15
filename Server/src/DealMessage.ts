import {Socket} from 'net'
import {redisClient} from './redisConnection'
import { JsonToObj, LoginMsg, LoginRecMsg, Print, SendMsg, ServerMsg, SignupMsg, SignupRecMsg, TcpMessage } from './SocketPackageIO'

const ACCOUNTMARK = 'uidCnt'
type State = 'loby' | 'room'
interface Person{
    type: 'user' | 'admin'
    account: string
    name: string
    pwd: string
}

let findPerson = new Map<Socket, {person: Person, state: State}>()
let findClient :{
    [K: string]: Socket
} = {}

export const DoSignup = async(socket: Socket, message: SignupMsg) =>{
    console.log('DoSignup')

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
    console.debug('DoLogin')

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
    console.log('get account from redis: ', json)
    let person: Person = JsonToObj(json)
    if(person.pwd !== message.pwd){
        recMsg.text = '密码错误'
        SendMsg(socket, recMsg)
        return
    }

    // Multiple logins
    if(person.account in findClient){
        ForceLogout(findClient[person.account])
    }

    findClient[person.account] = socket
    findPerson.set(socket, {person: person, state: 'loby'})
    recMsg.ret = true
    recMsg.text = '登录成功'
    SendMsg(socket, recMsg)
}

export const ForceLogout = (socket: Socket) => {
    if(findPerson.has(socket)){
        let account = findPerson.get(socket)?.person.account as string
        delete findClient[account]
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