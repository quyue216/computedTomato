import type { AxiosRequestConfig } from 'axios'

export function generateReqKey(config: AxiosRequestConfig) {

    if (config && config.data && isJsonStr(config.data)) { //[ ]  config.data此时为json字符串
        config.data = JSON.parse(config.data)
    }
    const { method, url, params, data } = config;

    return [method, url, paramsToQueryStr(params), paramsToQueryStr(data)].join('&');
}


// 判断是否为json字符串
export function isJsonStr(str: string): boolean {

    if (typeof str === 'string') {

        try {
            let obj = JSON.parse(str);
            if (typeof obj === 'object' && obj) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }

    }
    return false;
}


// 参数转换为查询字符串
export function paramsToQueryStr(params: {}): string {

    return new URLSearchParams(params as Record<string, string>).toString();
}