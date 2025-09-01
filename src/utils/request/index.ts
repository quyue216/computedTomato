import myAxios from './myAxios'
import type { AxiosResponse ,AxiosRequestConfig} from 'axios';

import type { ApiSchema } from '@/api/user/userSchema';

/* ---------- 工具类型 ---------- */
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type PathParams<P extends string> =
  P extends `${infer L}/:${infer R}/${infer Rest}`
    ? { [K in R]: string } & PathParams<`/${Rest}`>
  : P extends `${string}/:${infer R}`
    ? { [K in R]: string }
    : {};

// 从ApiSchema自动推断请求/响应类型
type ApiDefinition<M extends Method, P extends string> = 
  `${M} ${P}` extends keyof ApiSchema
    ? ApiSchema[`${M} ${P}`]
    : never;

/* ---------- 请求函数 ---------- */
export default async function api<M extends Method, P extends string>(
  method: M,
  path: P,
  params?: PathParams<P>,
  data?: ApiDefinition<M, P> extends { body: infer B } ? B : never,
  config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'params'>
): Promise<AxiosResponse<
    ApiDefinition<M, P> extends { resp: infer R } ? R : ResponseData<{}>,
    ApiDefinition<M, P> extends { body: infer R } ? R : {}
  >['data']>
{
  // 路径参数替换
  let url = path as string;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url = url.replace(`:${k}`, encodeURIComponent(String(v)));
    });
  }
  // 自动推断响应类型
  const res = await myAxios({
    method,
    url,
    [method === 'GET' ? 'params' : 'data']: data,
    ...config
  }) as AxiosResponse<
    ApiDefinition<M, P> extends { resp: infer R } ? R : ResponseData<{}>,
    ApiDefinition<M, P> extends { body: infer R } ? R : {}
  >['data']

  return res;
}
