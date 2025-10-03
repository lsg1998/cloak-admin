import http from "@/api";

// 全局像素配置接口

/**
 * 获取全局像素配置
 */
export function getGlobalPixelConfigApi() {
  return http.get("/admin/pixel/global");
}

/**
 * 更新全局像素配置
 */
export function updateGlobalPixelConfigApi(data: any) {
  return http.put("/admin/pixel/global", data);
}
