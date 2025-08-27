import axios from 'axios'
import type { HttpStatusCode, AxiosInstance, AxiosInterceptorManager, AxiosResponse, InternalAxiosRequestConfig } from 'axios'


class Request {

    baseURL: string

    timeout: number = 10000

    withCredentials: boolean = true

    interceptorFunc: {
        request: AxiosInterceptorManager<InternalAxiosRequestConfig>[];
        response: AxiosInterceptorManager<AxiosResponse>[]
    } = {
            request: [],
            response: []
    }

    constructor(baseURL: string, ...args: any[]) {


        this.baseURL =baseURL ?? import.meta.env.VITE_API_URL as string


        Request.prototype = Object.create(axios.create({

            baseURL: baseURL,
            timeout: 10000,
            withCredentials: true,
            ...args
        }) as AxiosInstance)

        Request.prototype.constructor = Request;
        /* 
        1. Request实例想要具备axios的所有能力
            2. axios.create() 实例作为属性挂载道Request实例上
            3. extend方法
            4. Object.create() 继承
        */
    }

    // override
    requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
        this.interceptorFunc.request.push(config)
        return config
    }

    responseInterceptor(config: AxiosResponse): AxiosResponse {
        this.interceptorFunc.response.push(config)
        this.interceptors.use.push(config)
    }
}

const request = new Request();


