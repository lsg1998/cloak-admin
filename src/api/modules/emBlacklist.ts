import { http } from "@/api";

// EM 黑名单项
export interface EmBlacklistItem {
  id: number;
  em_param: string;
  reason?: string;
  created_at: string;
}

// EM 黑名单列表响应
export interface EmBlacklistResponse {
  list: EmBlacklistItem[];
  total: number;
  page: number;
  size: number;
}

// 查询参数
export interface EmBlacklistListParams {
  em?: string;
  page?: number;
  size?: number;
}

/**
 * 获取 EM 黑名单列表
 */
export const getEmBlacklistApi = (params: EmBlacklistListParams = {}) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  return http.get<EmBlacklistResponse>("/admin/em-blacklist/list", filteredParams);
};

/**
 * 添加 em 到黑名单
 */
export const addEmBlacklistApi = (data: { em_param: string; reason?: string }) => {
  return http.post("/admin/em-blacklist/add", data);
};

/**
 * 从黑名单移除 em
 */
export const removeEmBlacklistApi = (data: { em_param: string }) => {
  return http.post("/admin/em-blacklist/remove", data);
};
