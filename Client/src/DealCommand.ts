import { socket } from ".";
import { SendLogin } from "./DealMessage";
import {Print} from "./SocketPackageIO";



const singleCmd:['help', 'exit', 'logout', 'create room', 'leave', 'roll'] = ['help', 'exit', 'logout', 'create room', 'leave', 'roll'] 
const argCmd:['login', 'signup', 'join', 'refresh', 'say', 'reply', 'list', 'kick']
= ['login', 'signup', 'join', 'refresh', 'say', 'reply', 'list', 'kick']

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
            // TODO
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

function LoginCmd(str: string){
    let args = str.split('-', 2)
    if(args.length !== 2){
        CmdIncorrect()
        return
    }
    SendLogin(args[0], args[1])
}

function CmdIncorrect(){
    Print.Tips('命令格式错误')
}




