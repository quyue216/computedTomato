import store from 'store'


/**
 * 获取本地存储的值
 * @param key 键
 * @returns 存储的值
 */
export function getLocalStorage(key: string) {
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

export function setLocalStorage(key: string, value: any) {
    if (!key || !value) {
        return
    }

    return store.set(key, value)
}

/**
 * 删除本地存储的值
 * @param key 键
 */
export function removeLocalStorage(key: string) {
    if (!key) {
        return
    }
    return store.remove(key)
}

/**
 * 更新本地存储值内部的某个键
 * @param key 键
 * @param path 内部键 'a.b.c'
 * @param newValue 新值
 */
export function updateLocalStorageItem(key: string, path: string, newValue: any): unknown {
    if (!key || !path) {
        return
    }
   
    const keys = path.split('.');

    const cancelObj = getLocalStorage(key);
    // 没有缓存,结束执行
    if (!cancelObj) {
        return
    }
    if (keys.length === 1) {
        cancelObj[path] = newValue;
    } else {
        // 处理中间路径
        let middlePathSegments = keys.slice(0, -1).join(".");

        let lastKey = keys.pop();
        // 存储对象
        const targetObj = getValueByPath(cancelObj, middlePathSegments);

        targetObj && (targetObj[lastKey!] = newValue);
    }
    setLocalStorage(key, cancelObj);
    return cancelObj
}


/**
 * 获取本地存储值内部的某个键
 * @param key 键
 * @param innerKey 内部键 "a.b.c"
 * @returns 存储的值
 */

export function getLocalStorageItem(key: string, innerKey: string) {
    if (!key || !innerKey) {
        return
    }
    const oldValue = getLocalStorage(key);
    if (oldValue) {
        return getValueByPath(oldValue, innerKey)
    }
}



/**
 * 根据路径字符串获取对象中的嵌套值
 * @param obj 要查询的对象
 * @param path 路径字符串，支持点分隔符（如 'a.b.c'）
 * @param defaultValue 可选的默认值，当路径不存在时返回
 * @returns 路径对应的值或默认值
 */
function getValueByPath<T = any>(obj: Record<string, any>, path: string, defaultValue?: T): T | undefined {
    if (!path) return defaultValue;

    // 将路径分割为键数组
    const keys = path.split('.');

    let result: any = obj;

    for (const key of keys) {
        // 检查当前结果是否为对象且包含当前键
        if (typeof result !== 'object' || result === null || !(key in result)) {
            return defaultValue;
        }
        result = result[key];
    }

    return result as T;
}