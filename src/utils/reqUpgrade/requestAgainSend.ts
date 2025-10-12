import { isJsonStr } from './commonFuns'
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

// 扩展AxiosRequestConfig接口，添加自定义重试相关属性
export interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
  __retryCount?: number;
}

/* 
 * 
 * @param {失败信息} err
 * @param {实例化的单例} axios
 * 
*/

export default function againRequest(err: AxiosError, axios: AxiosInstance) {
    const config = err.config as AxiosRequestConfigWithRetry;

    // 如果没有配置或配置中没有设置retry，则不重试
    if (!config || !config.retry) return Promise.reject(err);

    // 初始化重试计数
    config.__retryCount = config.__retryCount ?? 0;

    // 如果已经达到最大重试次数，则拒绝请求
    if (config.__retryCount >= config.retry) {
        return Promise.reject(err);
    }

    // 增加重试计数
    config.__retryCount += 1;

    // 创建延迟Promise
    const backoff = new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, config.retryDelay ?? 1000);
    });

    return backoff.then(() => {
        // 判断是否是JSON字符串
        // TODO: 未确认config.data再重发时变为字符串的原因
        if (config.data && typeof config.data === 'string' && isJsonStr(config.data)) {
            config.data = JSON.parse(config.data);
        }
        return axios(config);
    });
}