import store from 'store'


/**
 * 获取本地存储的值
 * @param key 键
 * @returns 存储的值
 */
export  function getLocalStorage(key: string) {
    if (!key) {
        return
    }
    return store.get(key);
}

/**
 * 设置本地存储的值
 * @param key 键
 * @param value 值
 */

export  function setLocalStorage(key: string, value: any) {
    if (!key || !value) {
        return
    }

   return store.set(key, value)    
}




/**
 * 删除本地存储的值
 * @param key 键
 */
export  function removeLocalStorage(key: string) {
    if (!key) {
        return
    }
    return store.remove(key)
}
