import { getToken, removeToken } from '../auth';
import Axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import againRequest  from './requestAgainSend'


// 返回结果处理
// 自定义约定接口返回{code: xxx, data: xxx, msg:'err message'}
const responseHandle = {
    200: (response: AxiosResponse<Result>) => {
        return response.data.data
    },
    401: (response: AxiosResponse<Result>) => {
        ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
        })
        // 移除掉token
        removeToken();

        location.href = `/login?redirect=${location.pathname}`

        // return Promise.reject(response) //HACK   页面将要刷新，没有必要抛出异常
    },
    default: (response: AxiosResponse<Result>) => {
        ElMessage.error(response.data.msg || '请求失败，请稍后重试')
        return Promise.reject(response)
    }
}
interface Result<T = any> {
    code: keyof (typeof responseHandle),
    data: T,
    msg: string
}
// axios实例创建
const axios = Axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 10000,
    withCredentials: true,
});

// 添加请求拦截器
axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // 添加token认证
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    // 参数处理  类型保护安全使用
    if (config.method && ['post', 'put'].includes(config.method.toLocaleLowerCase())) {
        config.data = config.data;
    } else if (config.method && ['get', 'delete'].includes(config.method.toLocaleLowerCase())) {
        config.params = config.data;
    } else {
        ElMessage.error('不允许的请求方式' + config.method)
    }

    return config;
}, (err) => {
    return Promise.reject(err);
})

// 响应拦截器
axios.interceptors.response.use((res: AxiosResponse<Result>) => {

    return responseHandle[res.data.code ?? 'default'](res);
}, (error: AxiosError) => {

    // 请求被手动取消时无需重新发送
    if(!Axios.isCancel(error)){
        // 请求重发
        return againRequest(error,axios); 
    }

    return Promise.reject(error)
})