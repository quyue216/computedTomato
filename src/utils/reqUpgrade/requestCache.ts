import Axios from 'axios'
import type {AxiosResponse, InternalAxiosRequestConfig,AxiosInstance} from 'axios'
import type {InternalAxiosRequestConfigWithMyAxios}  from './index'
import { generateReqKey } from './commonFuns'

interface Storage {
    storeExpire: number,
    data: any
}

// 配置信息
const options = {
    storage: true,
    storageKey: 'apiCache', //缓存key
    storage_expire: 600000, // localStorage 数据存储时间10min（刷新页面判断是否清除）
    expire: 20000
};

/* interface InternalAxiosRequestConfigWithCache extends InternalAxiosRequestConfig{
    cache:boolean,
    setExpireTime:number
} */

//TODO  初始化
(() => {

    let cache = window.localStorage.getItem(options.storageKey)

    if (cache) {
        let { storeExpire } = JSON.parse(cache);
        // 判断是否过期
        if (storeExpire && getNowTime() - storeExpire < options.storage_expire) {
            return
        }
    }
    window.localStorage.setItem(options.storageKey, JSON.stringify({ data: {}, storeExpire: getNowTime() }))
})();


// 获取缓存
function getCacheItem(key: PropertyKey) {
    // 判断缓存是否存在
    let cache = (window.localStorage.getItem(options.storageKey) || '{}');

    let { data } = JSON.parse(cache) as Storage;

    return (data && data[key]) || null;
}

// 设置缓存
function setCacheItem(key: PropertyKey, value: any) {

    let cache = (window.localStorage.getItem(options.storageKey) || '{}')

    let { data, storeExpire } = JSON.parse(cache) as Storage;

    data[key] = value;

    window.localStorage.setItem(options.storageKey, JSON.stringify({ data, storeExpire }))
}

let _CACHES: {
    [key: PropertyKey]: any
} = {};

//TODO 使用Proxy代理 包裹一层很棒
let CACHES = new Proxy(_CACHES, {
    get: function (target, key) {

        let value = target[key];
        
        console.log(`${key as string} 被读取`, value);
        // 读取缓存
        if (options.storage && !value) {
            value = getCacheItem(key)
        }
        return value;
    },
    set: function (target, key, value) {
        console.log(`${key as string} 被设置为 ${value}`);

        target[key] = value;
        // 缓存设置
        if (options.storage) {
           setCacheItem(key,value)
        }

        return true;
    }
});


// 请求拦截器
export function requestInterceptor(config:InternalAxiosRequestConfigWithMyAxios,axios:AxiosInstance){

    // 开启缓存则保存请求结果和cancel函数
    if(config.cache){

     let  data = CACHES[`${generateReqKey(config)}`];

     let setExpireTime = config.setExpireTime ?? options.expire; 
     //当前时间减去数据存储的时间 判断
     if(data && getNowTime() - data.expire < setExpireTime){

        config.cancelToken = new Axios.CancelToken(cancel=>{
            //TODO cancel函数的参数会作为promise的error被捕获
            cancel(data)
            console.log("请求缓存",config)
        })
     }

    }
}


export function responseInterceptor(res:AxiosResponse){
    //TODO 类型在此处设置合适嘛
    const config = res.config  as InternalAxiosRequestConfigWithMyAxios;
    
    if(config?.cache === true){

        let data = {
            expire: getNowTime(),
            data:res //TODO 在这里居然将整个res返回
        }

        CACHES[`${generateReqKey(res.config)}`] = data;
    }
}




// 获取当前时间搓
function getNowTime() {
    return new Date().getTime();
}