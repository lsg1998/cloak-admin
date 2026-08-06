import { http } from "@/api";

// 订单状态枚举
export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  DELETED = "deleted",
  DUPLICATE = "duplicate"
}

// 订单状态标签映射
export const OrderStatusLabels = {
  [OrderStatus.PENDING]: "待确认",
  [OrderStatus.CONFIRMED]: "已确认",
  [OrderStatus.PROCESSING]: "处理中",
  [OrderStatus.SHIPPED]: "已发货",
  [OrderStatus.DELIVERED]: "已送达",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.REFUNDED]: "已退款",
  [OrderStatus.DELETED]: "已删除",
  [OrderStatus.DUPLICATE]: "已重复"
};

// 订单状态颜色映射
export const OrderStatusColors = {
  [OrderStatus.PENDING]: "warning",
  [OrderStatus.CONFIRMED]: "primary",
  [OrderStatus.PROCESSING]: "info",
  [OrderStatus.SHIPPED]: "success",
  [OrderStatus.DELIVERED]: "success",
  [OrderStatus.CANCELLED]: "danger",
  [OrderStatus.REFUNDED]: "danger",
  [OrderStatus.DELETED]: "info",
  [OrderStatus.DUPLICATE]: "warning"
};

// 订单接口数据类型
export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  email?: string;
  province: string;
  city: string;
  district?: string;
  address: string;
  postal_code?: string;
  payment_method: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  /** 物流签收状态，由物流数据导入回写；与 status(业务状态) 相互独立 */
  delivery_status?: string | null;
  comments?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  // 新增字段
  pd_val?: string;
  from_url?: string;
  language_code?: string;
  ip_address?: string;
  ip_visit_count?: number; // 该IP的历史访问次数（来自 visitor_ips）
  ip_first_visit?: string; // 该IP的首次访问时间（来自 visitor_ips）
  fingerprint?: string;
  user_agent?: string;
  product_type?: "original" | "replica"; // 商品类型：正品/仿品
  shipped_email_sent?: boolean; // 是否已发送发货邮件
  sms_sent?: boolean; // 是否已发送短信
  sms_sent_count?: number; // 已发送短信数量
  last_sms_type?: string; // 最后发送的短信类型
  // 重复订单标识（基于全数据库统计）
  duplicate_phone_count?: number; // 相同手机号的其他订单数量
  duplicate_ip_count?: number; // 相同IP地址的其他订单数量
  duplicate_fingerprint_count?: number; // 相同指纹的其他订单数量
  duplicate_email_count?: number; // 相同邮箱的其他订单数量
  is_duplicate_phone?: boolean; // 手机号是否重复
  is_duplicate_ip?: boolean; // IP地址是否重复
  is_duplicate_fingerprint?: boolean; // 指纹是否重复
  is_duplicate_email?: boolean; // 邮箱是否重复
  // 关联商品信息
  product_title?: string;
  product_price?: number;
  product_images?: string[];
  product_description?: string;
  product_country?: string; // 商品国家
  product_template?: string; // 商品模版
  // 抽奖用户信息
  gender?: string; // 性别：male/female/other
  age?: number; // 年龄
}

// 订单列表查询参数
export interface OrderListParams {
  /** 物流签收状态筛选；传 __none__ 表示筛「尚无物流数据」的订单 */
  delivery_status?: string;
  page?: number;
  size?: number;
  order_number?: string;
  product_id?: string;
  customer_name?: string;
  phone?: string;
  status?: OrderStatus;
  start_date?: string;
  end_date?: string;
  country?: string;
  ip?: string; // 按IP地址筛选
  fingerprint?: string; // 按指纹筛选
}

// 订单列表响应数据
export interface OrderListResponse {
  list: Order[];
  total: number;
  page: number;
  size: number;
}

// 更新订单状态参数
export interface UpdateOrderStatusParams {
  status: OrderStatus;
}

/**
 * 获取订单列表
 */
export const getOrderListApi = (params: OrderListParams = {}) => {
  // 过滤掉undefined的参数
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  return http.get<OrderListResponse>("/admin/orders", filteredParams);
};

/**
 * 查询某个标识对应的历史订单（IP/指纹/手机号）
 */
export interface OrderHistoryParams {
  type: "ip" | "fingerprint" | "phone";
  value: string;
  exclude_order_id?: number;
  limit?: number;
}

export interface OrderHistoryResponse {
  type: "ip" | "fingerprint" | "phone";
  value: string;
  total: number;
  list: Order[];
}

export const getOrderHistoryApi = (params: OrderHistoryParams) => {
  return http.get<OrderHistoryResponse>("/admin/orders/history", params);
};

/**
 * 获取订单详情
 */
export const getOrderDetailApi = (id: number) => {
  return http.get<Order>(`/admin/orders/${id}`);
};

/**
 * 更新订单状态
 */
export const updateOrderStatusApi = (id: number, data: UpdateOrderStatusParams) => {
  return http.put(`/admin/orders/${id}/status`, data);
};

/**
 * 批量更新订单状态
 */
export interface BatchUpdateOrderStatusParams {
  ids: number[];
  status: OrderStatus;
}
export const batchUpdateOrderStatusApi = (data: BatchUpdateOrderStatusParams) => {
  return http.post("/admin/orders/batch-update-status", data);
};

/**
 * 删除订单
 */
export const deleteOrderApi = (id: number) => {
  return http.delete(`/admin/orders/${id}`);
};

/**
 * 批量删除订单
 */
export const batchDeleteOrdersApi = (ids: number[]) => {
  return http.delete("/admin/orders/batch", { data: { ids } });
};

/**
 * 发送拣货通知邮件
 */
export const sendPickingNotificationEmailApi = (id: number) => {
  return http.post(`/admin/orders/${id}/email/picking-notification`);
};

/**
 * 发送发货通知邮件
 */
export const sendShippedNotificationEmailApi = (id: number) => {
  return http.post(`/admin/orders/${id}/email/shipped-notification`);
};

// 订单统计数据类型
export interface OrderStatistics {
  // 基础统计
  total_orders: number;
  today_orders: number;
  month_orders: number; // 本月订单数
  pending_orders: number;
  completed_orders: number;
  total_amount: number;
  today_amount: number;
  currency: string; // 主要货币类型
  // 环比昨日同时刻
  today_orders_same_time: number;
  yesterday_orders_same_time: number;
  order_change_trend: "increase" | "decrease"; // 环比趋势：增加/减少
  order_change_diff: number; // 环比差值（绝对值）
  order_change_percent: number; // 环比百分比

  // 趋势数据
  trend_data: {
    dates: string[];
    order_counts: number[];
    amounts: number[];
  };

  // 状态分布
  status_distribution: {
    name: string;
    value: number;
    status: string;
  }[];

  // 最近订单
  recent_orders: Order[];
}

// 订单统计查询参数
export interface OrderStatisticsParams {
  start_date?: string;
  end_date?: string;
  limit?: number; // 最近订单数量限制
}

/**
 * 获取订单统计数据
 */
export const getOrderStatisticsApi = (params: OrderStatisticsParams = {}) => {
  return http.get<OrderStatistics>("/admin/orders/statistics", params);
};

/**
 * 获取IP详细信息
 */
export const getIPInfoApi = (ip: string) => {
  return http.get<any>("/admin/orders/ip-info", { ip });
};

/**
 * 导出所有订单IP（按国家分组）
 * 直接下载文件，返回文件下载URL
 */
export const exportOrderIPsUrl = () => {
  // 获取API基础URL
  const baseURL = import.meta.env.VITE_API_URL || "";
  return `${baseURL}/admin/orders/export-ips`;
};

/**
 * 订单国家统计接口
 */
export interface OrderCountryStats {
  stats: { country: string; count: number }[];
  total: number;
}

export const getOrderCountryStatsApi = () => {
  return http.get<OrderCountryStats>("/admin/orders/country-stats");
};

// ==================== IP黑名单管理 ====================

/**
 * IP黑名单信息
 */
export interface IPBlacklistItem {
  id: number;
  ip_address: string;
  reason?: string;
  order_id?: number;
  created_at: string;
  order_number?: string;
  customer_name?: string;
  phone?: string;
}

/**
 * IP黑名单列表响应
 */
export interface IPBlacklistResponse {
  list: IPBlacklistItem[];
  total: number;
  page: number;
  size: number;
}

/**
 * 拉黑IP
 */
export const blacklistIPApi = (data: { ip_address: string; reason?: string; order_id?: number }) => {
  return http.post("/admin/orders/blacklist-ip", data);
};

/**
 * 取消拉黑IP
 */
export const unblacklistIPApi = (data: { ip_address: string }) => {
  return http.post("/admin/orders/unblacklist-ip", data);
};

/**
 * 检查IP是否在黑名单中
 */
export const checkIPBlacklistApi = (ip: string) => {
  return http.get<{ ip_address: string; is_blacklisted: boolean; blacklist_info: IPBlacklistItem | null }>(
    "/admin/orders/check-blacklist",
    { ip }
  );
};

/**
 * 获取IP黑名单列表
 */
export const getIPBlacklistApi = (params: { page?: number; size?: number } = {}) => {
  return http.get<IPBlacklistResponse>("/admin/orders/ip-blacklist", params);
};

/**
 * 批量拉黑IP
 */
export const batchBlacklistIPsApi = (data: { ip_addresses: string[]; reason?: string }) => {
  return http.post("/admin/orders/batch-blacklist-ips", data);
};

/**
 * 导出Google Customer Match受众CSV
 * 直接下载文件
 */
export const exportCustomerMatchUrl = (params?: {
  start_date?: string;
  end_date?: string;
  country?: string;
  status?: string;
}) => {
  const baseURL = import.meta.env.VITE_API_URL || "";
  const queryParams = new URLSearchParams();

  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  if (params?.country) queryParams.append("country", params.country);
  if (params?.status) queryParams.append("status", params.status);

  const queryString = queryParams.toString();
  return `${baseURL}/admin/orders/export-customer-match${queryString ? "?" + queryString : ""}`;
};

// ==================== 物流签收状态 ====================
// 数据来自物流商导出的订单清单，用「参考单号」对应 order_number。
// xlsx/csv 在浏览器端用 SheetJS 解析，只把映射好的字段分批提交给后端。

/** 物流签收状态。与 orders.status(业务状态) 相互独立 */
export const DeliveryStatusLabels: Record<string, string> = {
  delivered: "签收成功",
  returned: "已退件",
  returning: "退件中",
  exception: "派送异常",
  delivering: "派送中",
  in_transit: "运输中",
  shipped: "已出库",
  pending: "待分拣",
  unknown: "未知"
};

export const DeliveryStatusColors: Record<string, "success" | "warning" | "info" | "primary" | "danger"> = {
  delivered: "success",
  returned: "danger",
  returning: "warning",
  exception: "warning",
  delivering: "primary",
  in_transit: "primary",
  shipped: "info",
  pending: "info",
  unknown: "info"
};

/** 提交给后端的单行。字段名与后端 OrderLogisticsService::normalizeRow 对应 */
export interface LogisticsRow {
  order_number: string;
  track_status_raw: string;
  return_detail?: string;
  country?: string;
  province?: string;
  postal_code?: string;
  carrier?: string;
  cod_amount?: string | number;
  cod_currency?: string;
  order_type?: string;
  product_name?: string;
  weight?: string | number;
  ship_out_at?: string;
  last_track_at?: string;
  sign_days?: string | number;
  return_reason?: string;
  tracking_no?: string;
}

export interface LogisticsImportResult {
  total: number;
  matched: number;
  unmatched: number;
  updated: number;
  invalid: number;
  unmatched_list: string[];
}

export const importLogisticsApi = (rows: LogisticsRow[]) => {
  return http.post<LogisticsImportResult>(`/admin/orders/logistics/import`, { rows });
};

/** 分析看板：各维度的签收率 */
export interface LogisticsGroup {
  name: string;
  total: number;
  delivered: number;
  returned: number;
  rate: number;
}

export interface LogisticsAnalytics {
  summary: { total: number; delivered: number; returned: number; rate: number; pending: number };
  by_transit: LogisticsGroup[];
  by_country: LogisticsGroup[];
  by_carrier: LogisticsGroup[];
  by_reship: LogisticsGroup[];
  by_cod: LogisticsGroup[];
  by_province: LogisticsGroup[];
  /** 按出库星期。周五出库要多压一个周末，可用来指导排单 */
  by_weekday: LogisticsGroup[];
  /** 买家填写信息 × 签收率。需关联 orders 表，joined 是可用样本数 */
  by_buyer_info: {
    joined: number;
    groups: { key: string; title: string; rows: LogisticsGroup[] }[];
  };
  /** 重复下单 × 签收率。按手机号分组，分母含被标为重复而删除的订单 */
  by_repeat: { joined: number; rows: LogisticsGroup[] };
  countries: string[];
  last_import: string | null;
}

export const getLogisticsAnalyticsApi = (country?: string) => {
  return http.get<LogisticsAnalytics>(`/admin/orders/logistics/analytics`, country ? { country } : {});
};
