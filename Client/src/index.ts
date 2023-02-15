import net from 'net'
import readline from 'readline'
import { ConsoleListener } from './DealCommand';
import { OnClose, OnConnect, OnError, OnReceive } from './SocketListener';
import { SendMsg, NormalMsg, LoginMsg } from './SocketPackageIO';

const PORT = 8088
const HOST = "127.0.0.1"
export const socket = net.createConnection(PORT, HOST, () =>{
    console.log('开始连接服务器')
});

function InitClient(){

    OnConnect(socket)

    OnReceive(socket)

    OnClose(socket)

    OnError(socket)

    // 创建接口实例
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    // 调用接口方法
    rl.on("line", ConsoleListener)

    // close事件监听
    rl.on("close", () => {})
}

InitClient()
