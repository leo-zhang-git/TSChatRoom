import net from 'net'
import redis from 'redis'
import { CloseSocket, ReceiveMsg } from './SocketPackageIO'

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


export const OnReceive = (socket: net.Socket) => {
    socket.on("data", (data) => {
        console.log(`收到来自客户端的数据\n${data}`);
        let message = ReceiveMsg(socket, data)
        if(message?.type === 'normal'){
            console.log(message.text)
        }
    });
}

export const OnClose = (socket: net.Socket) => {
    socket.on("close", (handError) => {
        CloseSocket(socket)
        console.log("服务端：客户端已经断开连接 handError: " + handError);
    });

}

export const OnError = (socket: net.Socket) => {
    socket.on('error', (err) => {
        console.log("客户端错误： " + err)
    })
}

export const OnTimeout = (socket: net.Socket) => {
    socket.on('timeout', () => {
        socket.end()
    })
}