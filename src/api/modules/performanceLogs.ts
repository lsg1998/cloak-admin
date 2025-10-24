import { http } from "@/api";

// 性能日志接口数据类型
export interface PerformanceLog {
  id: number;
  pd_val: string;
  session_id: string;
  page_url: string;
  referrer: string;
  language_code: string;
  enter_time: number;
  dns_time: string;
  tcp_time: string;
  ssl_time: string;
  ttfb: string;
  dom_load_time: string;
  page_load_time: string;
  total_load_time: string;
  onload_time: string;
  fcp: string;
  lcp: string;
  fid: string;
  cls: string;
  ip_address: string;
  user_agent: string;
  screen_resolution: string;
  viewport_size: string;
  device_type: string;
  created_at: string;
}

// 性能日志列表查询参数
export interface PerformanceLogListParams {
  page?: number;
  limit?: number;
  search?: string;
  device_type?: string;
  start_date?: string;
  end_date?: string;
}

// 性能日志列表响应数据
export interface PerformanceLogListResponse {
  list: PerformanceLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 性能统计数据
export interface PerformanceStats {
  basic_stats: {
    total_requests: number;
    avg_fcp: string;
    avg_lcp: string;
    avg_fid: string;
    avg_cls: string;
    avg_page_load_time: string;
    avg_ttfb: string;
  };
  device_stats: Array<{
    device_type: string;
    count: number;
  }>;
  date_range: {
    start_date: string;
    end_date: string;
  };
}

/**
 * 获取性能日志列表
 */
export const getPerformanceLogsApi = (params: PerformanceLogListParams = {}) => {
  // 过滤掉undefined的参数
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  return http.get<PerformanceLogListResponse>("/admin/performance-logs", filteredParams);
};

/**
 * 获取性能日志详情
 */
export const getPerformanceLogDetailApi = (id: number) => {
  return http.get<PerformanceLog>(`/admin/performance-logs/${id}`);
};

/**
 * 获取性能统计数据
 */
export const getPerformanceStatsApi = (params: { start_date?: string; end_date?: string } = {}) => {
  return http.get<PerformanceStats>("/admin/performance-logs-stats", params);
};

/**
 * 删除性能日志
 */
export const deletePerformanceLogApi = (id: number) => {
  return http.delete(`/admin/performance-logs/${id}`);
};

/**
 * 批量删除性能日志
 */
export const batchDeletePerformanceLogsApi = (ids: number[]) => {
  return http.post("/admin/performance-logs/batch-delete", { ids });
};
