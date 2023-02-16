import net from 'net'
import { clients, OnClose, OnError, OnReceive, OnTimeout } from './SocketListener'
import { Print } from './SocketPackageIO';
import {InitRedisConnect} from './redisConnection'

function InitServer(){
  let PORT = 8088;
  let HOST = '127.0.0.1';
  // tcp服务端
  let server = net.createServer((socket) =>{
    Print.Tips("new conect")
    socket.setTimeout(10 * 60 * 1000)

    // Recive message event
    OnReceive(socket)

    // Close event
    OnClose(socket)

    // Error event
    OnError(socket)
    

    // Timeout
    OnTimeout(socket)
  })
  server.listen(PORT, HOST, () => {console.log("server start")})

  process.on('SIGINT', () =>{
    console.log('server close')
    for(let i of clients){
      i.destroy()
    }
    server.close()
    process.exit()
  })
}
InitRedisConnect()
InitServer()
