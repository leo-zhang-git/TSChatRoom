import net from 'net'

const BUFFERMAXLEN = 65535
const MSGMXLEN = 12000
const HEADLEN = 4
const DEBUG: true = true

let buffers = new Map<net.Socket, {buffer: Buffer, ptr: number}>()

const singleCmd:['help', 'exit', 'logout', 'create room', 'refresh', 'leave', 'list', 'roll'] = ['help', 'exit', 'logout', 'create room', 'refresh', 'leave', 'list', 'roll'] 

export type TcpMessage = NormalMsg | LoginMsg | SignupMsg | SignupRecMsg | ServerMsg | LoginRecMsg | CmdMsg | JoinMsg | JoinRecMsg | RefreshRecMsg | ListRecMsg | SayMsg | SayRecMsg
export interface NormalMsg {
    type: 'normal'
    text: string
    sender: string
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
    text: string
    ret: boolean
}
export interface CmdMsg{
    type: 'command'
    cmd: (typeof singleCmd)[number]
    arg?: string
}
export interface JoinMsg{
    type: 'join'
    rid: string
}
export interface JoinRecMsg{
    type: 'joinRec'
    ret: boolean
    rid: string
    rname: string
}
export interface RefreshRecMsg{
    type: 'refreshRec'
    rooms: {rid: string, rname: string, memberCnt: number}[]
}
export interface ListRecMsg{
    type: 'listRec'
    memberList: {uname: string, account: string}[]
}
export interface SayMsg{
    type: 'say'
    text: string
}
export interface SayRecMsg{
    type: 'sayRec'
    text: string
    senderName: string
    mentionYou: boolean
}

export const SendMsg = (socket: net.Socket, message: TcpMessage) => {
    let str = JSON.stringify(message)
    let body = Buffer.from(str)
    if(body.byteLength > MSGMXLEN){
        Print.Tips("Message is too long")
        return
    }
    let head = Buffer.alloc(HEADLEN)

    head.writeInt32BE(body.byteLength)
    socket.write(Buffer.concat([head, body]))

}

export const ReceiveMsg = (socket: net.Socket, data: Buffer = Buffer.from('')): TcpMessage | undefined => {
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
        if(!DEBUG) return
        console.log(str)
    },
    Error: (str: string) =>{
        console.log("!!!================================== ERROR\n" + str + "\nERROR==================================!!!")
        throw Error('')
    },
    Warn: (str:string) => {
        if(!DEBUG) return
        console.log("<<=============================== warn: \n\n" + str + "\n\nwarn ===============================>>")
    },
    Debug: (str:string) => {
        if(!DEBUG) return
        console.log("<<=============================== debug: \n\n" + str + "\n\ndebug ===============================>>")
    }
}

// ====================================== Server Unique ==========================================

export const CloseSocket = (socket: net.Socket) => {
    buffers.delete(socket)
}

export const JsonToObj = (str: string) => {
    try{
        return JSON.parse(str)
    }
    catch{
        Print.Error('Json parse error')
    }
}