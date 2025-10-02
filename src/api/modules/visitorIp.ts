import http from "@/api";

// 访客IP接口类型定义
export interface VisitorIp {
  id: number;
  ip_address: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  location?: string;
  organization?: string;
  postal_code?: string;
  timezone?: string;
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
  country?: string;
  city?: string;
}

export interface IpStatistics {
  totalIps: number;
  todayIps: number;
  countryStats: Array<{
    country: string;
    count: number;
  }>;
  cityStats: Array<{
    city: string;
    country: string;
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
    return http.get(`/admin/statistics/visitor-ips/${ip}`);
  },

  // 获取IP统计信息
  getIpStatistics: () => {
    return http.get("/admin/statistics/visitor-ips-stats");
  },

  // 删除访客IP记录
  deleteVisitorIp: (ip: string) => {
    return http.delete(`/admin/statistics/visitor-ips/${ip}`);
  }
};
