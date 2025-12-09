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
  user_agent?: string;
  product_type?: "original" | "replica"; // 商品类型：正品/仿品
  shipped_email_sent?: boolean; // 是否已发送发货邮件
  // 重复订单标识（基于全数据库统计）
  duplicate_phone_count?: number; // 相同手机号的其他订单数量
  duplicate_ip_count?: number; // 相同IP地址的其他订单数量
  is_duplicate_phone?: boolean; // 手机号是否重复
  is_duplicate_ip?: boolean; // IP地址是否重复
  // 关联商品信息
  product_title?: string;
  product_price?: number;
  product_images?: string[];
  product_description?: string;
}

// 订单列表查询参数
export interface OrderListParams {
  page?: number;
  size?: number;
  order_number?: string;
  product_id?: string;
  customer_name?: string;
  phone?: string;
  status?: OrderStatus;
  start_date?: string;
  end_date?: string;
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
  pending_orders: number;
  completed_orders: number;
  total_amount: number;
  today_amount: number;
  currency: string; // 主要货币类型

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
