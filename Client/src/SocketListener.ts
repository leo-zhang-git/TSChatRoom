import net from 'net'
import { Print, ReceiveMsg } from './SocketPackageIO'
import { RecJoin, RecLogin, RecSignup, SetState } from './DealMessage'

export const OnConnect = (socket: net.Socket) => {
    socket.on('connect',()=>{
        SetState('offline')
        console.log('建立连接成功')
        Print.Tips('请登录或注册账号')
        Print.Tips('login [account]-[password]')
        Print.Tips('signup [name]-[password]')
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
            case 'server':
                Print.Tips(message.text)
                break
            case 'signupRec':
                RecSignup(message)
                break
            case 'loginRec':
                RecLogin(message)
                break
            case 'joinRec':
                RecJoin(message)
                break
            default:
                break
        }
    })
}

export const OnClose = (socket: net.Socket) => {
    socket.on('close',(data)=>{
        console.log('连接断开')
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