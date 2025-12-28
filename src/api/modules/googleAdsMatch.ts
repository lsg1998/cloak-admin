import { http } from "@/api";

// Google Ads 种子名单数据类型
export interface GoogleAdsMatchItem {
  id: number;
  email: string;
  phone?: string;
  postal_code?: string;
  normalized_email?: string; // 标准化后的邮箱（Gmail去点）
  normalized_phone?: string; // E.164格式的手机号
  hashed_email: string;
  hashed_phone?: string;
  country_code: string;
  ad_user_data: "GRANTED" | "DENIED";
  ad_personalization: "GRANTED" | "DENIED";
  source: "manual" | "import" | "order";
  remark?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

// 国家代码数据类型
export interface CountryCode {
  code: string;
  name_en: string;
  name_zh: string;
  phone_prefix: string;
}

// 列表查询参数
export interface GoogleAdsMatchListParams {
  page?: number;
  size?: number;
  email?: string;
  phone?: string;
  country_code?: string;
  status?: number | string;
  source?: string;
}

// 列表响应数据
export interface GoogleAdsMatchListResponse {
  list: GoogleAdsMatchItem[];
  total: number;
  page: number;
  size: number;
}

// 创建/更新参数
export interface GoogleAdsMatchFormData {
  email: string;
  phone?: string;
  postal_code?: string;
  country_code: string;
  ad_user_data?: "GRANTED" | "DENIED";
  ad_personalization?: "GRANTED" | "DENIED";
  remark?: string;
  status?: number;
}

// 批量导入单条数据
export interface GoogleAdsMatchImportItem {
  email: string;
  phone?: string;
  postal_code?: string;
  country_code?: string;
}

// 统计数据
export interface GoogleAdsMatchStatistics {
  total: number;
  enabled: number;
  disabled: number;
  country_stats: Array<{ country_code: string; count: number }>;
  source_stats: Array<{ source: string; count: number }>;
}

/**
 * 获取种子名单列表
 */
export const getGoogleAdsMatchListApi = (params: GoogleAdsMatchListParams = {}) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  return http.get<GoogleAdsMatchListResponse>("/admin/google-ads-match", filteredParams);
};

/**
 * 获取统计数据
 */
export const getGoogleAdsMatchStatisticsApi = () => {
  return http.get<GoogleAdsMatchStatistics>("/admin/google-ads-match/statistics");
};

/**
 * 获取国家代码列表
 */
export const getCountryCodesApi = () => {
  return http.get<CountryCode[]>("/admin/google-ads-match/country-codes");
};

/**
 * 添加单条记录
 */
export const createGoogleAdsMatchApi = (data: GoogleAdsMatchFormData) => {
  return http.post("/admin/google-ads-match", data);
};

/**
 * 更新记录
 */
export const updateGoogleAdsMatchApi = (id: number, data: Partial<GoogleAdsMatchFormData>) => {
  return http.put(`/admin/google-ads-match/${id}`, data);
};

/**
 * 删除记录
 */
export const deleteGoogleAdsMatchApi = (id: number) => {
  return http.delete(`/admin/google-ads-match/${id}`);
};

/**
 * 批量删除
 */
export const batchDeleteGoogleAdsMatchApi = (ids: number[]) => {
  return http.post("/admin/google-ads-match/batch-delete", { ids });
};

/**
 * 批量导入
 */
export const batchImportGoogleAdsMatchApi = (items: GoogleAdsMatchImportItem[]) => {
  return http.post<{
    success_count: number;
    fail_count: number;
    failed_items: Array<{ index: number; email?: string; reason: string }>;
  }>("/admin/google-ads-match/batch-import", { items });
};

/**
 * 导出数据URL
 */
export const getExportGoogleAdsMatchUrl = (params: { country_code?: string; format?: "csv" | "json" } = {}) => {
  const baseURL = import.meta.env.VITE_API_URL || "";
  const queryParams = new URLSearchParams();
  if (params.country_code) queryParams.append("country_code", params.country_code);
  if (params.format) queryParams.append("format", params.format);
  const queryString = queryParams.toString();
  return `${baseURL}/admin/google-ads-match/export${queryString ? "?" + queryString : ""}`;
};

/**
 * 导出数据 (JSON格式，用于API调用)
 */
export const exportGoogleAdsMatchApi = (params: { country_code?: string; format?: "csv" | "json" } = {}) => {
  return http.get("/admin/google-ads-match/export", { ...params, format: "json" });
};

// 来源标签映射
export const SourceLabels: Record<string, string> = {
  manual: "手动添加",
  import: "批量导入",
  order: "订单同步"
};

// 状态标签映射
export const StatusLabels: Record<number, string> = {
  0: "禁用",
  1: "启用"
};
