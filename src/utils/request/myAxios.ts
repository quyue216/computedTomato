import axios from 'axios'
import { getToken } from '../auth'
import getErrorMessage from './errorCode'
import type { ErrCodeMessageType } from './errorCode.ts'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus';

const { HttpStatusCode } = axios;

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 10000,
    withCredentials: true,
})

// 请求拦截器
axiosInstance.interceptors.request.use(

    (config: InternalAxiosRequestConfig) => {
        //1. 请求自动携带token
        const token = getToken()

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // 2. get delete 请求参数拼接到url后面
        if (['get', 'delete'].includes(config.method as string) && Object.keys(config.params ?? {}).length) {


            const searchParams = new URLSearchParams(config.params);

            config.url = `${config.url}?${searchParams.toString()}`

            config.params = {}
        }

        // 在发送请求之前做些什么
        return config
    },
    (error: AxiosError) => {
        // 对请求错误做些什么
        return Promise.reject(error)
    }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
    // 2xx 范围内的状态码都会触发该函数。
    (res) => {

        const code: number = res.data.code ?? HttpStatusCode.Ok;


        // 二进制数据则直接返回
        if ( ['arraybuffer', 'blob'].includes(res.config.responseType as string)) {
            return res.data; // 直接返回数据
        }

        const message: string = getErrorMessage(code as ErrCodeMessageType);

        // 对响应数据做点什么
        if (code === HttpStatusCode.Unauthorized) {
            // 处理 401 错误
            // 确认弹框处理是否更友好
            /* 
                1. 清除本地存储的用户信息
                2. 跳转到登录页面，保存当前页面浏览路径
                3. 提示用户重新登录
                4. 
            */
        } else if (code === HttpStatusCode.InternalServerError) {

            ElMessage({ message, duration: 5 * 1000, type: 'error' });

            return Promise.reject(message);
            // 处理 500 错误
        } else if (code !== HttpStatusCode.Ok) {
            // 处理 400 错误
            ElMessage({ message, duration: 5 * 1000, type: 'error' });

            return Promise.reject(message);
        } else {
            return res.data as ResponseData<any>;
        }
    },
    (error: AxiosError) => {
        // 超出 2xx 范围的状态码都会触发该函数。
        // 对响应错误做点什么
        let { message } = error;

        if (message === 'Network Error') {
            message = '后端接口连接异常'
        } else if (message.includes('timeout')) {
            message = '系统接口请求超时'
        } else if (message.includes('Request failed with status code')) {
            message = '系统接口' + message.slice(message.length - 3) + '异常'
        }

        ElMessage({ message, duration: 5 * 1000, type: 'error' })

        return Promise.reject(error);
    }
)

export default axiosInstance;
