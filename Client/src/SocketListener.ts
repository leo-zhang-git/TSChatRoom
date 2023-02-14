import net from 'net'
import { ReceiveMsg } from './SocketPackageIO'

let State: 'offline' | 'loby' | 'room' = 'offline'

interface Person{
type: 'none'
socket: net.Socket
uid: number
name: string
}
type User = Omit<Person, 'type'> & {type: 'user'}
type Admin = Omit<Person, 'type'> & {type: 'admin'}

let persons: Person[] = []
let findPerson = new Map<net.Socket, Person>()

export const OnConnect = (socket: net.Socket) => {
    socket.on('connect',()=>{
        console.log('建立连接成功')
    })
}

export const OnReceive = (socket: net.Socket) => {
    socket.on('data',(data)=>{
        console.log(`客户端收到来自服务端的：${data}`)
        let message = ReceiveMsg(socket, data)
        switch(message?.type)
        {
            case 'normal':
                console.log(message.text)
                break
            case 'signupRec':
            default:
                break
        }
    })
}

export const OnClose = (socket: net.Socket) => {
    socket.on('close',(data)=>{
        console.log('客户端：我要断开连接')
    })
}

export const OnError = (socket: net.Socket) => {
    socket.on('error', (err) => {
        throw Error('连接错误')
    })
}

export const OnTimeout = (socket: net.Socket) => {
    socket.on('timeout', () => {
        socket.end()
    })
}