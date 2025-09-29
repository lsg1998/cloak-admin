import http from "@/api";

// 用户管理接口
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserListParams {
  page?: number;
  size?: number;
  username?: string;
  email?: string;
  status?: number;
}

export interface UserListResponse {
  list: User[];
  total: number;
  page: number;
  size: number;
}

export interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  role: string;
  status: number;
}

export interface UpdateUserParams {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: number;
}

// 获取用户列表
export const getUserListApi = (params: UserListParams) => {
  return http.get<UserListResponse>("/admin/users", { params });
};

// 获取用户详情
export const getUserApi = (id: number) => {
  return http.get<User>(`/admin/users/${id}`);
};

// 创建用户
export const createUserApi = (data: CreateUserParams) => {
  return http.post("/admin/users", data);
};

// 更新用户
export const updateUserApi = (id: number, data: UpdateUserParams) => {
  return http.put(`/admin/users/${id}`, data);
};

// 删除用户
export const deleteUserApi = (id: number) => {
  return http.delete(`/admin/users/${id}`);
};
