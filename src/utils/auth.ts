import * as storeUtils from './storeUtils'

const TOKEN_KEY = 'token'

/* 获取token */
export function getToken(): string | null {
    return storeUtils.getLocalStorage(TOKEN_KEY)
}


/* 设置token */
export function setToken(token: string) {
    storeUtils.setLocalStorage(TOKEN_KEY, token)
}
