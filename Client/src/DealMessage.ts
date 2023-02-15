import {socket} from '.'
import { LoginMsg, LoginRecMsg, Print, SendMsg } from './SocketPackageIO'

type State = 'offline' | 'loby' | 'room'
let state: State = 'offline'
export const GetState = () => state
export const SetState = (_state: State) => {state = _state}

export const SendLogin = (account: string, pwd: string) => {
    if(GetState() !== 'offline'){
        Print.Tips('您已经登录，若要登录其他账号请先退出当前账号')
        return
    }
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