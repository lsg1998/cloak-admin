import { http } from "@/api";

// EM出单追踪项
export interface EmTrackItem {
  em_param: string;
  account_name: string | null;
  conversion_id: string | null;
  visitor_count: number;
  earliest_visit: string | null;
  latest_visit: string | null;
  countries: string[];
  has_order: boolean;
  order_count: number;
  total_amount: number;
  total_amount_eur: number;
  currencies: string[];
  order_numbers: string[];
  order_statuses: string[];
  order_ids: number[];
  first_order_time: string | null;
  last_order_time: string | null;
}

// 汇总统计
export interface EmTrackSummary {
  total_em_params: number;
  em_with_orders: number;
  em_without_orders: number;
  total_orders: number;
  total_visitors: number;
  order_rate: number;
}

// 列表响应
export interface EmTrackListResponse {
  list: EmTrackItem[];
  total: number;
  page: number;
  size: number;
  summary: EmTrackSummary;
}

// 查询参数
export interface EmTrackListParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  em_param?: string;
  has_order?: string; // 'yes' | 'no' | ''
  page?: number;
  size?: number;
}

// EM订单详情
export interface EmOrderDetail {
  em_param: string;
  orders: any[];
  visitors: any[];
  order_count: number;
  visitor_count: number;
}

/**
 * 获取EM出单追踪列表
 */
export const getEmTrackListApi = (params: EmTrackListParams = {}) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  return http.get<EmTrackListResponse>("/admin/em-track/list", filteredParams);
};

/**
 * 获取某个em参数的详细订单
 */
export const getEmOrdersApi = (params: { em_param: string; start_date?: string; end_date?: string }) => {
  return http.get<EmOrderDetail>("/admin/em-track/orders", params);
};
