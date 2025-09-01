// src/types/api.ts
/* ===== 登录接口类型 ===== */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  msg: string;
  error: boolean;
  token?: string;
  data: UserInfo;
}

export interface UserInfo {
  _id: string;
  nickName: string;
  trueName: string;
  motto: string;
  sex: '0' | '1' | '2'; // 0 未知 1 男 2 女
  birthday: string;     // ISO 8601
  address: string;
  email: string;
  avatar: string;
  access: 'user' | 'admin';
  createAt: string;     // ISO 8601
  updateAt: string;     // ISO 8601
  __v: number;
}

/* ===== 统一 ApiSchema（给泛型封装用） ===== */
export interface ApiSchema {
  'POST /login': {
    body: LoginRequest;
    resp: LoginResponse;
  };
  'GET /user': {
    resp: ResponseData<UserInfo>;
  }
}