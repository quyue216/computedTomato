import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from "axios";


type Result<T = {}> = {
    code: number,
    message: string,
    data: T
}

// 导出Request类
export class Request {

    instance: AxiosInstance;

    baseConfig: AxiosRequestConfig = { baseURL: "/api", timeout: 60000 };
    //TODO 拦截器作为重要的功能，在构造器中进行初始化合情合理 
    constructor(config: AxiosRequestConfig) {

        this.instance = axios.create(Object.assign(this.baseConfig, config))

        this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {

            const token = (localStorage.getItem("token") ?? "") as string

            if (token) {
                config.headers!.Authorization = token
            }

            return config;
        }, (err: any) => {
            // 请求错误，这里可以用全局提示框进行提示
            return Promise.reject(err)
        })

        this.instance.interceptors.response.use((res: AxiosResponse<Result>): any => {

            // 从请求体中取出结果
            return res.data.data;
        }, (err: AxiosError) => {
            let message = "";

            switch (err.response!.status) {
                case 400:
                    message = "请求错误(400)"
                    break;
                case 401:
                    message = "未授权，请重新登录(401)";
                    // 这里可以做清空storage并跳转到登录页的操作
                    break;
                case 403:
                    message = "拒绝访问(403)";
                    break;
                case 404:
                    message = "请求出错(404)";
                    break;
                case 408:
                    message = "请求超时(408)";
                    break;
                case 500:
                    message = "服务器错误(500)";
                    break;
                case 501:
                    message = "服务未实现(501)";
                    break;
                case 502:
                    message = "网络错误(502)";
                    break;
                case 503:
                    message = "服务不可用(503)";
                    break;
                case 504:
                    message = "网络超时(504)";
                    break;
                case 505:
                    message = "HTTP版本不受支持(505)";
                    break;
                default:
                    message = `连接出错(${err.response!.status})!`;
            }


            return Promise.reject(err.response)
        })
    }
    //TODO 我尝试用类封装axios, request.xx直接调用，我想到的是熟悉copy反而弄复杂了
    public request<T={}>(config:AxiosRequestConfig):Promise<AxiosResponse<T>>{
        return this.instance.request(config);
    }

    public get<T ={}>(url:string, config?:AxiosRequestConfig):Promise<AxiosResponse<T>>{
        return this.instance.get(url,config)
    }

     public post<T ={}>(url:string, data?:any, config?:AxiosRequestConfig):Promise<AxiosResponse<T>>{
        return this.instance.post(url,config)
    }

     public put<T ={}>(url:string,data?:any, config?:AxiosRequestConfig):Promise<AxiosResponse<T>>{
        return this.instance.put(url,data,config)
    }
     public delete<T ={}>(url:string, config?:AxiosRequestConfig):Promise<AxiosResponse<T>>{
        return this.instance.delete(url,config)
    }

};


export default new Request({});