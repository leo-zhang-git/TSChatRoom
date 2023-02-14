import net from 'net'
import { OnClose, OnError, OnReceive, OnTimeout } from './SocketListener'


function InitServer(){
  let PORT = 8088;
  let HOST = '127.0.0.1';
  // tcp服务端
  let server = net.createServer((socket) =>{
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
}

InitServer()
