import net from 'net'
import { Print, ReceiveMsg } from './SocketPackageIO'
import { RecJoin, RecLogin, RecRefresh, RecSignup, SetState } from './DealMessage'

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
        console.log(`收到来自服务端的数据：${data}`)
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
            case 'refreshRec':
                RecRefresh(message)
                break
            case 'command':
                switch(message.cmd){
                    case 'leave':
                        SetState('loby')
                        Print.Tips('退出房间')
                        break
                    case 'logout':
                        SetState('offline')
                        Print.Tips('退出账号')
                        break
                    default:
                        break
                }
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