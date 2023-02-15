import {socket} from '.'
import { CmdMsg, LoginMsg, LoginRecMsg, Print, SendMsg, SignupMsg, SignupRecMsg } from './SocketPackageIO'

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

export const SendCommand = (message: CmdMsg) =>{
    SendMsg(socket, message)
}