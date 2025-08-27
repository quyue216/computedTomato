enum ErrCodeMessage {
    '400'= '请求参数错误',
    '401'= '未授权，请重新登录',
    '403'= '拒绝访问',
    '404'= '请求地址出错',
    '408'= '请求超时',
    '500'= '服务器内部错误',
    '501'= '服务未实现',
    '502'= '网关错误',
    '503'= '服务不可用',
    '504'= '网关超时',
    '505'= 'HTTP版本不受支持',
    'default'= '网络异常，请稍后再试！'
}

export default function getErrorMessage(code: keyof typeof errorMessage): string {
    return errorMessage[code] || '未知错误，请联系管理员'
}


