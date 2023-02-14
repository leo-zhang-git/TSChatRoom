import {Socket} from 'net'
import {redisClient} from './redisConnection'
import { JsonToObj, LoginMsg, SendMsg, ServerMsg, TcpMessage } from './SocketPackageIO'


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


export const DoLogin= async(socket: Socket, message: LoginMsg) => {
    console.debug('DoLogin')
    // Account not exist
    if(await redisClient.exists(message.account)  === 0){
        let serverMsg:ServerMsg = {
            type: 'server',
            text: '账号不存在'
        }
        SendMsg(socket, serverMsg)
        return
    }

    // Password incorrect
    let json = await redisClient.get(message.account) as string
    console.log('get account from redis: ', json)
    let person: Person = JsonToObj(json)
    if(person.pwd !== message.pwd){
        let serverMsg:ServerMsg = {
            type: 'server',
            text: '密码错误'
        }
        SendMsg(socket, serverMsg)
        return
    }

    // Multiple logins
    if(person.account in findClient){
        ForceLogout(findClient[person.account])
    }

    findClient[person.account] = socket
    findPerson.set(socket, {person: person, state: 'loby'})
    let serverMsg:ServerMsg = {
        type: 'server',
        text: '登录成功'
    }
    SendMsg(socket, serverMsg)
}

export const ForceLogout = (socket: Socket) => {
    findPerson.delete(socket)
    socket.end()
}