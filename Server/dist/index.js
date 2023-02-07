"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
let PORT = 8088;
let HOST = '127.0.0.1';
// tcp服务端
console.log('hello world');
let server = net_1.default.createServer((socket) => {
});
server.listen(PORT, HOST, () => { console.log("server start"); });
