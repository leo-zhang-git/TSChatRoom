import net from 'net'
import readline from 'readline'
import { OnClose, OnError, OnReceive } from './SocketListener';
import { SendMsg, NormalMsg, LoginMsg } from './SocketPackageIO';


function InitClient(){
    const PORT = 8088
    const HOST = "127.0.0.1"
    const socket = net.createConnection(PORT, HOST, () =>{
        console.log('开始连接服务器')
    });

    OnReceive(socket)

    OnClose(socket)

    OnError(socket)

    // 创建接口实例
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    // 调用接口方法
    rl.on("line", (line) => {OnInput(socket, line)})

    // close事件监听
    rl.on("close", () => {
        console.log("再见");
        // process.exit(0);
    })
}

let OnInput = (socket: net.Socket,line: string) => {
    let message:LoginMsg = {
        type: 'login',
        account: '1000002',
        pwd: '1234ab'
    }
    SendMsg(socket, message)
}

InitClient()
