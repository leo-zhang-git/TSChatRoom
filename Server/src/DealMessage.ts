import {Socket} from 'net'
import {redisClient} from './redisConnection'
import { LoginMsg, TcpMessage } from './SocketPackageIO'


type State = 'loby' | 'room'
interface Person{
type: 'none'
socket: Socket
uid: number
name: string
state: State
}

type User = Omit<Person, 'type'> & {type: 'user'}
type Admin = Omit<Person, 'type'> & {type: 'admin'}

let persons: Person[] = []
let findPerson = new Map<Socket, Person>()


export const DoLogin= (socket: Socket, message: LoginMsg) => {
    // Check state
    let person: Person
}