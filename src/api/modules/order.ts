import { http } from "@/api";

// 订单状态枚举
export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed", 
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}

// 订单状态标签映射
export const OrderStatusLabels = {
  [OrderStatus.PENDING]: "待确认",
  [OrderStatus.CONFIRMED]: "已确认",
  [OrderStatus.PROCESSING]: "处理中",
  [OrderStatus.SHIPPED]: "已发货",
  [OrderStatus.DELIVERED]: "已送达",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.REFUNDED]: "已退款"
};

// 订单状态颜色映射
export const OrderStatusColors = {
  [OrderStatus.PENDING]: "warning",
  [OrderStatus.CONFIRMED]: "primary",
  [OrderStatus.PROCESSING]: "info",
  [OrderStatus.SHIPPED]: "success",
  [OrderStatus.DELIVERED]: "success",
  [OrderStatus.CANCELLED]: "danger",
  [OrderStatus.REFUNDED]: "danger"
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
  return http.get<OrderListResponse>("/admin/orders", { params });
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
 * 导出订单数据
 */
export const exportOrdersApi = (params: OrderListParams = {}) => {
  return http.get("/admin/orders/export", { 
    params,
    responseType: "blob"
  });
};