import net from 'net'

let PORT = 8088;
let HOST = '127.0.0.1';
 
// tcp服务端
console.log('hello world')
let server = net.createServer((socket) =>{

})
server.listen(PORT, HOST, () => {console.log("server start")})