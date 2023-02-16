import { createClient } from "redis";
import { Print } from "./SocketPackageIO";

export const redisClient = createClient();
redisClient.on('ready', (err) =>{Print.print('redis ready')})


export async function InitRedisConnect() {
    process.on('SIGINT', () =>{
        redisClient.save()
        try{
            redisClient.quit()
        }catch{
            console.log('redis close exception')
        }
    })
    await redisClient.connect()   // 连接
    // /* 增 改 */
    // const status = await redisClient.set('key', 'value') // 设置值
    // console.log(status )

    // /* 查 */
    // const value = await redisClient.get('key') // 得到value 没有则为null
    // console.log(value )
    // redisClient.save()
    // /* 删 */
    // const num = await redisClient.del('key') // 0 没有key关键字 // 1删除成功
    // console.log(num )

    // await redisClient.quit()   // 关闭
}
