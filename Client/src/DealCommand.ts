import { socket } from ".";
import { GetMessageList, GetState, SendCommand } from "./DealMessage";
import {CmdMsg, JoinMsg, LoginMsg, Print, SendMsg, SignupMsg} from "./SocketPackageIO";



export const singleCmd:['help', 'exit', 'logout', 'create room', 'refresh', 'leave', 'list', 'roll'] = ['help', 'exit', 'logout', 'create room', 'refresh', 'leave', 'list', 'roll'] 
const argCmd:['login', 'signup', 'join', 'say', 'reply', 'kick']
= ['login', 'signup', 'join', 'say', 'reply', 'kick']

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
            LogoutCmd()
            break
        case 'create room':
            CreateRoomCmd(cmdArg)
            break
        case 'refresh':
            RefreshCmd()
            break
        case 'list':
            ListCmd()
            break
        case 'leave':
            LeaveCmd()
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
        case 'say':
            SayCmd(cmdArg)
            break
        case 'reply':
            ReplyCmd(cmdArg)
            break
        case 'kick':
            KickCmd(cmdArg)
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

function LogoutCmd(){
    if(GetState() === 'offline'){
        Print.Tips('当前状态不能退出登录')
        return
    }
    SendCommand({type: 'command', cmd: 'logout'})
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

function LeaveCmd(){
    if(GetState() !== 'room'){
        Print.Tips('当前状态不能退出房间')
        return
    }
    SendCommand({type: 'command', cmd: 'leave'})
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

    let message: LoginMsg = {
        type: 'login',
        account: args[0],
        pwd: args[1]
    }
    SendMsg(socket, message)
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

    let message: SignupMsg = {
        type: 'signup',
        name: args[0],
        pwd: args[1]
    }
    SendMsg(socket, message)
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
    
    let message: JoinMsg = {
        type: 'join',
        rid: str
    }
    SendMsg(socket, message)
}

function SayCmd(str: string){
    if(GetState() !== 'room'){
        Print.Tips('只有在房间中才能发言')
        return
    }
    SendMsg(socket, {type: 'say', text: str})
}

function ReplyCmd(str: string){
    if(GetState() !== 'room'){
        Print.Tips('只有在房间中才能发言')
        return
    }

    let line = (str.match(/^[1-9]*\s/)?.[0])?.trim() as string

    if(!IsNumber(line)){
        Print.Tips('命令格式错误')
        return
    }
     
    let text = str.replace(line as string, '').trim()
    if(Number(line) > GetMessageList().length){
        Print.Tips('找不到该消息')
        return
    }

    let targetMsg = GetMessageList()[Number(line) - 1]

    SendMsg(socket, {
        type: 'reply',
        recName: targetMsg.senderName,
        recText: targetMsg.text,
        text: text,
        mentionYou: false
    })
}

function KickCmd(str: string){
    if(GetState() !== 'room'){
        Print.Tips('只有在房间中才能使用踢出指令')
        return
    }
    if(!IsNumber(str)){
        Print.Tips('命令格式错误')
        return
    }
    SendMsg(socket, {type: 'kick', account: str})
}

function ListCmd(){
    SendCommand({type: 'command', cmd: 'list'})
}


function CmdIncorrect(){
    Print.Tips('命令格式错误')
}
function IsNumber(str: string | undefined){
    if(!str) return false
    let ret = str.match(/[0-9]*/)
    return ret && ret[0] === str
}



