import { http } from "@/api";

// 客户统计数据接口
export interface CustomerStatistics {
  // 基础统计
  total_customers: number; // 总客户数
  new_customers: number; // 新客户数
  repeat_customers: number; // 回头客数量

  // 客户地区分布
  region_distribution: Array<{
    province: string;
    customer_count: number;
    order_count: number;
    percentage: number;
  }>;

  // 客户城市分布
  city_distribution: Array<{
    location: string;
    province: string;
    city: string;
    customer_count: number;
    order_count: number;
  }>;

  // 客户购买趋势
  customer_trend: Array<{
    date: string;
    new_customer_count: number;
  }>;

  // 客户订单频次分布
  purchase_frequency: Array<{
    frequency_range: string;
    customer_count: number;
    percentage: number;
  }>;
}

// 获取客户统计数据
export const getCustomerStatisticsApi = (params?: { start_date?: string; end_date?: string }) => {
  return http.get<CustomerStatistics>("/admin/statistics/users", params);
};

// 仪表盘统计数据类型
export interface DashboardStatistics {
  total_users: number;
  total_orders: number;
  total_products: number;
  total_sales: number;
  today_orders: number;
  today_sales: number;
}

// 获取仪表盘统计数据
export const getDashboardStatisticsApi = () => {
  return http.get<DashboardStatistics>("/admin/statistics/dashboard");
};

// 销售统计数据类型
export interface SalesStatistics {
  total_sales: number;
  today_sales: number;
  monthly_sales: number;
  yearly_sales: number;
  sales_trend: {
    dates: string[];
    amounts: number[];
  };
  top_products: {
    product_name: string;
    sales_amount: number;
    sales_count: number;
  }[];
}

// 获取销售统计数据
export const getSalesStatisticsApi = (params: { start_date?: string; end_date?: string } = {}) => {
  return http.get<SalesStatistics>("/admin/statistics/sales", params);
};
