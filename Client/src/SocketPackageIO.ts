import net from 'net'

const BUFFERMAXLEN = 65535
const MSGMXLEN = 12000
const HEADLEN = 4

let buffers = new Map<net.Socket, {buffer: Buffer, ptr: number}>()

export type TcpMessage = NormalMsg | LoginMsg | SignupMsg | SignupRecMsg | ServerMsg | LoginRecMsg
export interface NormalMsg {
    type: 'normal'
    text: string
}
export interface ServerMsg{
    type: 'server'
    text: string
}
export interface LoginMsg {
    type: 'login'
    account: string
    pwd: string
}
export interface LoginRecMsg{
    type: 'loginRec'
    text: string
    ret: boolean
}
export interface SignupMsg {
    type: 'signup'
    name: string
    pwd: string
}
export interface SignupRecMsg {
    type: 'signupRec'
    account: string
}

export const SendMsg = (socket: net.Socket, message: TcpMessage) => {
    let str = JSON.stringify(message)
    Print.Debug("json str: " + str)
    let body = Buffer.from(str)
    Print.Debug('buffer str: ' + body.toString())
    if(body.byteLength > MSGMXLEN){
        Print.Tips("Message is too long")
        return
    }
    let head = Buffer.alloc(HEADLEN)

    head.writeInt32BE(body.byteLength)
    socket.write(Buffer.concat([head, body]))

}

export const ReceiveMsg = (socket: net.Socket, data: Buffer): TcpMessage | undefined => {
    // copy to Buffer
    let target: {buffer: Buffer, ptr: number}
    if(!buffers.has(socket)){
        target = {buffer:Buffer.alloc(BUFFERMAXLEN, data), ptr: data.byteLength}
        buffers.set(socket, target)
    }
    else{
        target = buffers.get(socket) as {buffer: Buffer, ptr: number}
        if(target){
            data.copy(target?.buffer, target?.ptr, 0)
            target.ptr += data.byteLength
        }
    }

    if(target.ptr < HEADLEN) return

    // get body size
    let len = 0
    for(let i = 0; i < HEADLEN; i ++){
        len *= 256
        len += target.buffer[i]
    }
    if(len + HEADLEN > target.ptr) return

    let message = Buffer.alloc(len)
    target.buffer.copy(message, 0, HEADLEN, HEADLEN + len)
    target.buffer.copy(target.buffer, 0, HEADLEN + len, target.ptr)
    target.ptr = target.ptr - HEADLEN - len
    return JSON.parse(message.toString())
}

export const Print = {
    Tips: (str: string) => {
        console.log("****************< " + str + " >****************")
    },
    print: (str: string) => {
        console.log(str)
    },
    Error: (str: string) =>{
        console.log("!!!================================== ERROR\n" + str + "\nERROR==================================!!!")
        throw Error('')
    },
    Warn: (str:string) => {
        console.log("<<=============================== warn: \n\n" + str + "\n\nwarn ===============================>>")
    },
    Debug: (str:string) => {
        console.log("<<=============================== debug: \n\n" + str + "\n\ndebug ===============================>>")
    }
}

// ====================================== Client Unique ==========================================