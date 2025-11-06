import http from "@/api";

// 访客IP接口类型定义
export interface VisitorIp {
  id: number;
  ip_address: string;
  product_id?: string;
  access_address?: string;
  product_type?: "original" | "fake";
  hostname?: string;
  city?: string;
  region?: string;
  region_code?: string;
  country?: string;
  country_name?: string;
  country_code?: string;
  continent?: string;
  continent_code?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  organization?: string;
  asn?: string;
  as_name?: string;
  as_domain?: string;
  as_type?: string;
  asn_route?: string;
  company_name?: string;
  company_domain?: string;
  company_type?: string;
  postal_code?: string;
  timezone?: string;
  is_anonymous?: boolean;
  is_anycast?: boolean;
  is_hosting?: boolean;
  is_mobile?: boolean;
  is_satellite?: boolean;
  privacy_vpn?: boolean;
  privacy_proxy?: boolean;
  privacy_tor?: boolean;
  privacy_relay?: boolean;
  privacy_hosting?: boolean;
  privacy_service?: string;
  abuse_address?: string;
  abuse_country?: string;
  abuse_email?: string;
  abuse_name?: string;
  abuse_network?: string;
  abuse_phone?: string;
  carrier_name?: string;
  carrier_mcc?: string;
  carrier_mnc?: string;
  domains_total?: number;
  user_agent?: string;
  referer?: string;
  visit_count: number;
  first_visit: string;
  last_visit: string;
  created_at: string;
  updated_at: string;
}

export interface VisitorIpListParams {
  page?: number;
  size?: number;
  ip?: string;
  timeRange?: string;
  visitorType?: string;
  productId?: string;
}

export interface IpStatistics {
  totalIps: number;
  todayIps: number;
  totalCountries: number;
  totalCities: number;
  genuineCount: number;
  fakeCount: number;
  countryStats: Array<{
    country: string;
    count: number;
  }>;
  cityStats: Array<{
    city: string;
    country: string;
    count: number;
  }>;
  productTypeStats: Array<{
    product_type: string;
    count: number;
    percentage: number;
  }>;
  sourceStats: Array<{
    source: string;
    count: number;
  }>;
}

// 访客IP API
export const visitorIpApi = {
  // 获取访客IP列表
  getVisitorIps: (params: VisitorIpListParams) => {
    return http.get("/admin/statistics/visitor-ips", params);
  },

  // 获取单个访客IP详情
  getVisitorIp: (ip: string) => {
    return http.get("/admin/statistics/visitor-ips/detail", { ip });
  },

  // 获取IP统计信息
  getIpStatistics: (params?: { timeRange?: string }) => {
    return http.get("/admin/statistics/visitor-ips-stats", params);
  },

  // 删除访客IP记录
  deleteVisitorIp: (ip: string) => {
    return http.delete("/admin/statistics/visitor-ips/delete", { ip });
  },

  // 同步用户行为数据
  syncBehaviorData: () => {
    return http.post("/admin/statistics/sync-behavior-data");
  },

  // 清空所有IP缓存
  clearAllIpCache: () => {
    return http.post("/admin/statistics/visitor-ips/clear-cache");
  },

  // 重新识别单个IP
  refreshIpInfo: (ip: string) => {
    return http.post("/admin/statistics/visitor-ips/refresh", { ip });
  }
};
