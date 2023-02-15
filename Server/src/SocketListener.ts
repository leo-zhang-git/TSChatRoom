import net from 'net'
import { DealCmd, DoJoin, DoLogin, DoSignup, ForceLogout } from './DealMessage';
import {redisClient} from "./redisConnection"
import { CloseSocket, Print, ReceiveMsg } from './SocketPackageIO'

export const OnReceive = (socket: net.Socket) => {
    socket.on("data", (data) => {
        Print.print(`收到来自客户端的数据\n${data}`);
        let message = ReceiveMsg(socket, data)
        switch(message?.type){
            case 'signup':
                DoSignup(socket, message)
                break
            case 'login':
                DoLogin(socket, message)
                break
            case 'command':
                DealCmd(socket, message)
                break
            case 'join':
                DoJoin(socket, message.rid)
                break
            default:
                Print.Warn('不期望的消息格式：\n' + message)
                break
        }
    });
}

export const OnClose = (socket: net.Socket) => {
    socket.on("close", (handError) => {
        CloseSocket(socket)
        Print.print("服务端：客户端已经断开连接 handError: " + handError);
        ForceLogout(socket)
    });

}

export const OnError = (socket: net.Socket) => {
    socket.on('error', (err) => {
        Print.print("客户端错误： " + err)
    })
}

export const OnTimeout = (socket: net.Socket) => {
    socket.on('timeout', () => {
        socket.end()
    })
}