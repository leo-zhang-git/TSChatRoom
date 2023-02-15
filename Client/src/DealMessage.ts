import {socket} from '.'
import { CmdMsg, JoinMsg, JoinRecMsg, LoginMsg, LoginRecMsg, Print, RefreshRecMsg, SendMsg, SignupMsg, SignupRecMsg } from './SocketPackageIO'

type State = 'offline' | 'loby' | 'room'
let state: State = 'offline'
export const GetState = () => state
export const SetState = (_state: State) => {state = _state}

export const SendLogin = (account: string, pwd: string) => {
    let message:LoginMsg = {
        type: 'login',
        account: account,
        pwd: pwd
    }
    SendMsg(socket, message)
}

export const RecLogin = (message: LoginRecMsg) =>{
    if(!message.ret){
        Print.Tips(message.text)
        return
    }
    Print.Tips(message.text)
    SetState('loby')
}

export const SendSignup = (name:string, pwd: string) =>{
    let message:SignupMsg = {
        type: 'signup',
        name: name,
        pwd: pwd
    }
    SendMsg(socket, message)
}

export const RecSignup = (message: SignupRecMsg) =>{
    if(!message.ret){
        Print.Tips(message.text)
        return
    }
    Print.Tips(message.text)
    console.log('您的账号为：' + message.account)
}

export const SendJoin = (rid: string) =>{
    let message:JoinMsg = {
        type: 'join',
        rid: rid,
    }
    SendMsg(socket, message)
}

export const RecJoin = (message: JoinRecMsg) =>{
    if(!message.ret){
        Print.Tips('加入房间失败，请检查房间id是否正确')
        return
    }

    SetState('room')
    Print.Tips('加入房间: ' + message.rid + " " + message.rname)
}

export const RecRefresh = (message: RefreshRecMsg) =>{
    if(state !== 'loby') return
    console.log('\n\n当前房间列表:')
    console.log('rid\t\trname')
    for(let i of message.rooms){
        console.log(i.rid + '\t\t' + i.rname)
    }
}

export const SendCommand = (message: CmdMsg) =>{
    SendMsg(socket, message)
}