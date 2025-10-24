import http from "@/api";

// 角色管理接口
export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  status: number;
  created_at: string;
  updated_at: string;
}

export interface RoleListParams {
  page?: number;
  size?: number;
  name?: string;
  status?: number;
}

export interface RoleListResponse {
  list: Role[];
  total: number;
  page: number;
  size: number;
}

export interface CreateRoleParams {
  name: string;
  description: string;
  permissions: string[];
  status: number;
}

export interface UpdateRoleParams {
  name?: string;
  description?: string;
  permissions?: string[];
  status?: number;
}

// 获取角色列表
export const getRoleListApi = (params: RoleListParams) => {
  return http.get<RoleListResponse>("/admin/roles", params);
};

// 获取角色详情
export const getRoleApi = (id: number) => {
  return http.get<Role>(`/admin/roles/${id}`);
};

// 创建角色
export const createRoleApi = (data: CreateRoleParams) => {
  return http.post("/admin/roles", data);
};

// 更新角色
export const updateRoleApi = (id: number, data: UpdateRoleParams) => {
  return http.put(`/admin/roles/${id}`, data);
};

// 删除角色
export const deleteRoleApi = (id: number) => {
  return http.delete(`/admin/roles/${id}`);
};
