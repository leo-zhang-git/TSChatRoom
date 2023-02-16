import {socket} from '.'
import { CmdMsg, JoinMsg, JoinRecMsg, ListRecMsg, LoginMsg, LoginRecMsg, Print, RefreshRecMsg, ReplyMsg, SayRecMsg, SendMsg, SignupMsg, SignupRecMsg } from './SocketPackageIO'

type State = 'offline' | 'loby' | 'room'
let state: State = 'offline'
export const GetState = () => state
export const SetState = (_state: State) => {state = _state}

interface RoomMessage{
    rownum: number
    senderName: string
    text: string
}
let messageList: RoomMessage[] = []

export const RecLogin = (message: LoginRecMsg) =>{
    if(!message.ret){
        Print.Tips(message.text)
        return
    }
    Print.Tips(message.text)
    SetState('loby')
}

export const RecSignup = (message: SignupRecMsg) =>{
    if(!message.ret){
        Print.Tips(message.text)
        return
    }
    Print.Tips(message.text)
    console.log('您的账号为：' + message.account)
}

export const RecJoin = (message: JoinRecMsg) =>{
    if(!message.ret){
        Print.Tips('加入房间失败，请检查房间id是否正确')
        return
    }

    SetState('room')
    Print.Tips('加入房间: ' + message.rid + " " + message.rname)
    messageList = []
}

export const RecRefresh = (message: RefreshRecMsg) =>{
    if(state !== 'loby') return
    console.log('\n\n当前房间列表:')
    console.log('房间id\t\t房间名\t\t在线人数')
    for(let i of message.rooms){
        console.log(i.rid + '\t\t' + i.rname + '\t\t' + i.memberCnt)
    }
}

export const RecList = (message: ListRecMsg) =>{
    if(state !== 'room') return
    console.log('\n\n当前房间在线用户列表:')
    console.log('用户名\t\t账号')
    for(let i of message.memberList){
        console.log(i.uname + '\t\t' + i.account)
    }
}

export const RecSay = (message: SayRecMsg) =>{
    let curMessage = {rownum: messageList.length + 1, senderName: message.senderName, text: message.text}
    let str = curMessage.rownum + '\t[' + curMessage.senderName + '] ' + curMessage.text
    if(message.mentionYou) str = "=========== " + str + " ==========="

    messageList.push(curMessage)
    console.log(str)
}

export const RecReply = (message: ReplyMsg) =>{
    let curMessage = {rownum: messageList.length + 1, senderName: message.senderName as string, text: message.text}
    let str = curMessage.rownum + ' [' + curMessage.senderName + '] ' + curMessage.text
    if(message.mentionYou) str = "=========== " + str + " ==========="
    str += '\n\t[回复] [' + message.recName + '] ' + message.recText

    messageList.push(curMessage)
    console.log(str)
}

export const SendCommand = (message: CmdMsg) =>{
    SendMsg(socket, message)
}

export const GetMessageList = () => messageList