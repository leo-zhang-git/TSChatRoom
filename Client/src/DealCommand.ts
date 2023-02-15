import { socket } from ".";
import { GetState, SendCommand, SendJoin, SendLogin, SendSignup } from "./DealMessage";
import {CmdMsg, JoinMsg, Print} from "./SocketPackageIO";



export const singleCmd:['help', 'exit', 'logout', 'create room', 'refresh', 'leave', 'roll'] = ['help', 'exit', 'logout', 'create room', 'refresh', 'leave', 'roll'] 
const argCmd:['login', 'signup', 'join', 'say', 'reply', 'list', 'kick']
= ['login', 'signup', 'join', 'say', 'reply', 'list', 'kick']

type inputCommand = typeof singleCmd | typeof argCmd

export const ConsoleListener = (line: string) =>{
    let input = line.trim()
    let command = MatchCommand(input)
    let cmdArg = ''
    if(typeof command === 'string')
        cmdArg = input.replace(command, '').trim()
    switch(command){
        case 'help':
            HelpCmd()
            break
        case 'exit':
            ExitCmd()
            break
        case 'logout':
            // TODO
            break
        case 'create room':
            CreateRoomCmd(cmdArg)
            break
        case 'refresh':
            RefreshCmd()
            break
        case 'leave':
            // TODO
            break
        case 'roll':
            // TODO
            break
        case 'login':
            LoginCmd(cmdArg)
            break
        case 'signup':
            SignupCmd(cmdArg)
            break
        case 'join':
            JoinCmd(cmdArg)
            break
        default :
            Print.Tips('找不到指令')
            break
    }

}

function MatchCommand(input: string): inputCommand[number] | undefined{
    let reg: string
    for(let i of singleCmd){
        reg = '^' + i
        if(input.match(reg)) return i
    }
    for(let i of argCmd){
        reg = '^' + i + '\\s'
        if(input.match(reg)) return i
    }
    return undefined
}

function HelpCmd(){
    console.log([argCmd, singleCmd])
}

function ExitCmd(){
    socket.end(() => {process.exit(0)})
}

function CreateRoomCmd(str: string){
    if(GetState() !== 'loby'){
        Print.Tips('只有在大厅才能创建房间')
        return
    }
    let message:CmdMsg = {
        type: 'command',
        cmd: 'create room',
    }
    if(str.length > 0) message.arg = str
    SendCommand(message)
}

function RefreshCmd(){
    if(GetState() !== 'loby'){
        Print.Tips('只有在大厅才能更新房间列表')
        return
    }

    let message:CmdMsg = {
        type: 'command',
        cmd: 'refresh',
    }
    SendCommand(message)
}

function LoginCmd(str: string){
    if(GetState() !== 'offline'){
        Print.Tips('您已经登录，若要登录其他账号请先退出当前账号')
        return
    }
    let args = str.split('-', 2)
    if(args.length !== 2){
        CmdIncorrect()
        return
    }
    SendLogin(args[0], args[1])
}

function SignupCmd(str: string){
    if(GetState() !== 'offline'){
        Print.Tips('您已经登录，若要注册请先退出当前账号')
        return
    }
    let args = str.split('-', 2)
    if(args.length !== 2){
        CmdIncorrect()
        return
    }
    SendSignup(args[0], args[1])
}

function JoinCmd(str: string){
    if(GetState() !== 'loby'){
        Print.Tips('只有在大厅才能加入房间')
        return
    }
    if(str.length <= 0 || !IsNumber(str)){
        CmdIncorrect()
        return
    }
    
    SendJoin(str)
}





function CmdIncorrect(){
    Print.Tips('命令格式错误')
}
function IsNumber(str: string){
    let ret = str.match(/[0-9]*/)
    return ret && ret[0] === str
}



