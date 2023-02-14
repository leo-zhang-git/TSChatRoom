import net from 'net'
import {redisClient} from "./redisConnection"
import { CloseSocket, ReceiveMsg } from './SocketPackageIO'

export const OnReceive = (socket: net.Socket) => {
    socket.on("data", (data) => {
        console.log(`收到来自客户端的数据\n${data}`);
        let message = ReceiveMsg(socket, data)
        switch(message?.type){
            case 'login':
                
                break
            default:
                break
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