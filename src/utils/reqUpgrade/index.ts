import {getToken ,setToken,removeToken} from '../auth';
import Axios  from 'axios'
import type {AxiosResponse,InternalAxiosRequestConfig} from 'axios'
import { ElMessage } from 'element-plus'
 
interface Result{
    code: number,
    data: any,
    msg: string
}

// 返回结果处理
// 自定义约定接口返回{code: xxx, data: xxx, msg:'err message'}
const responseHandler = {
    200: (response: AxiosResponse<Result>) =>{
        return response.data.data
    },
    401: (response: AxiosResponse<Result>) => {
        ElMessage.error('登录失效，请重新登录')
        // 移除掉token
        removeToken();
        
        return Promise.reject(response)
    },
    default: (response: AxiosResponse<Result>) => {
        ElMessage.error(response.data.msg || '请求失败，请稍后重试')
        return Promise.reject(response)
    }
}

// axios实例创建
const axios = Axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 10000,
    withCredentials: true,
});

// 添加请求拦截器
axios.interceptors.request.use((config:InternalAxiosRequestConfig)=>{
    // 添加token认证
    const token = getToken();

    if(token){
       config.headers.Authorization = `Bearer ${token}`
    }
    
    // 参数处理  类型保护安全使用
    if( config.method &&['post','put'].includes(config.method.toLocaleLowerCase())){
        config.data = config.data;
    }else if(config.method && ['get','delete'].includes(config.method.toLocaleLowerCase())){
        config.params = config.data;
    }else{
        ElMessage.error('不允许的请求方式'+config.method)
    }

    return config;
},(err)=>{
    return Promise.reject(err);
})