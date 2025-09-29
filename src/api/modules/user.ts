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

// 导出用户信息
export const exportUserInfo = (params: UserListParams) => {
  return http.get("/admin/users/export", { params });
};

// 批量添加用户
export const BatchAddUser = (data: CreateUserParams[]) => {
  return http.post("/admin/users/batch", data);
};

// 获取用户部门
export const getUserDepartment = () => {
  return http.get("/admin/users/departments");
};

// 获取用户状态
export const getUserStatus = () => {
  return http.get("/admin/users/status");
};

// 获取用户性别
export const getUserGender = () => {
  return http.get("/admin/users/gender");
};

// 获取用户角色
export const getUserRole = () => {
  return http.get("/admin/users/roles");
};

// 获取用户树形列表
export const getUserTreeList = (params: UserListParams) => {
  return http.get("/admin/users/tree", { params });
};

// 编辑用户
export const editUser = (id: number, data: UpdateUserParams) => {
  return http.put(`/admin/users/${id}`, data);
};

// 添加用户
export const addUser = (data: CreateUserParams) => {
  return http.post("/admin/users", data);
};

// 重置用户密码
export const resetUserPassWord = (id: number) => {
  return http.post(`/admin/users/${id}/reset-password`);
};

// 修改用户状态
export const changeUserStatus = (id: number, status: number) => {
  return http.put(`/admin/users/${id}/status`, { status });
};

// 兼容性别名
export const getUserList = getUserListApi;
export const deleteUser = deleteUserApi;
