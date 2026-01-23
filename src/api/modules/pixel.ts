import http from "@/api";

// 全局像素配置接口

/**
 * 获取全局像素配置
 */
export function getGlobalPixelConfigApi() {
  return http.get("/admin/pixel/global");
}

/**
 * 更新全局像素配置（Facebook、TikTok、自定义像素）
 */
export function updateGlobalPixelConfigApi(data: any) {
  return http.put("/admin/pixel/global", data);
}

/**
 * 添加单个 Google Ads 账户
 */
export function addGoogleAdsAccountApi(data: any) {
  return http.post("/admin/pixel/google-ads-account", data);
}

/**
 * 更新单个 Google Ads 账户
 */
export function updateGoogleAdsAccountApi(conversionId: string, data: any) {
  return http.put(`/admin/pixel/google-ads-account/${conversionId}`, data);
}

/**
 * 删除单个 Google Ads 账户
 */
export function deleteGoogleAdsAccountApi(conversionId: string) {
  return http.delete(`/admin/pixel/google-ads-account/${conversionId}`);
}
