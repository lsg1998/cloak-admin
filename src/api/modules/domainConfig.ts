import http from "@/api";

export interface DomainConfig {
  id: number;
  name: string;
  domain: string;
  protocol: "http" | "https";
  is_active: number;
  is_wildcard: number;
  sort_order: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DomainConfigListParams {
  page?: number;
  size?: number;
  name?: string;
  domain?: string;
  is_active?: number;
}

export interface CreateDomainConfigParams {
  name: string;
  domain: string;
  protocol?: "http" | "https";
  is_active?: number;
  is_wildcard?: number;
  sort_order?: number;
  description?: string;
}

export interface UpdateDomainConfigParams extends CreateDomainConfigParams {
  id: number;
}

export interface SortDomainConfigParams {
  domains: { id: number }[];
}

// 获取启用的域名配置列表
export const getDomainConfigs = () => {
  return http.get<DomainConfig[]>("/admin/domain-configs");
};

// 获取所有域名配置列表（包括未启用的）
export const getAllDomainConfigs = (params?: DomainConfigListParams) => {
  return http.get<{
    data: DomainConfig[];
    total: number;
  }>("/admin/domain-configs/all", params);
};

// 创建域名配置
export const createDomainConfig = (data: CreateDomainConfigParams) => {
  return http.post<{ id: number }>("/admin/domain-configs", data);
};

// 更新域名配置
export const updateDomainConfig = (data: UpdateDomainConfigParams) => {
  return http.put(`/admin/domain-configs/${data.id}`, data);
};

// 删除域名配置
export const deleteDomainConfig = (id: number) => {
  return http.delete(`/admin/domain-configs/${id}`);
};

// 更新域名配置排序
export const updateDomainConfigSort = (data: SortDomainConfigParams) => {
  return http.put("/admin/domain-configs/sort", data);
};
