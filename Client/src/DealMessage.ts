import { socket } from ".";
import { LoginMsg, SendMsg } from "./SocketPackageIO";

type State = 'offline' | 'loby' | 'room'
let state: State = 'offline'


const inputCommand:['create room', 'join', 'refresh', 'say', 'reply', 'roll', 'leave', 'logout', 'list', 'kick']
= ['create room', 'join', 'refresh', 'say', 'reply', 'roll', 'leave', 'logout', 'list', 'kick']

export const ConsoleListener = (line: string) =>{
    let input = line.trim()


    let command = MatchCommand(input)
}

function MatchCommand(input: string): (typeof inputCommand)[number] | undefined{
    for(let i of inputCommand){
        let reg = '^' + i + '\\s'
        if(input.match(reg)) return i
    }
    return undefined
}

export const GetState = () => state
export const SetState = (_state: State) => {state = _state}

