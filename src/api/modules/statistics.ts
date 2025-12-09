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

// 流量统计数据类型
export interface TrafficStatistics {
  total_visits: number; // 总访问量
  source_stats: Array<{
    source: string;
    count: number;
  }>; // 流量来源统计
  hourly_stats: Array<{
    hour: number;
    count: number;
    label: string;
  }>; // 按小时统计（24小时）
  daily_stats: Array<{
    date: string;
    count: number;
  }>; // 按日期统计
  peak_hour: number; // 流量最多的小时（0-23）
  peak_count: number; // 峰值访问量
  low_hour: number | null; // 流量最少的小时
  low_count: number; // 最低访问量
}

// 获取流量统计数据
export const getTrafficStatisticsApi = (params?: {
  timeRange?: string;
  start_date?: string;
  end_date?: string;
  timezone?: string;
}) => {
  return http.get<TrafficStatistics>("/admin/statistics/traffic", params);
};

// 流量详细分析数据类型
export interface TrafficAnalysis {
  total_visits: number; // 总访问量
  source_count: number; // 来源数量
  peak_hour: number; // 峰值小时
  peak_count: number; // 峰值访问量
  avg_visits_per_hour: number; // 平均每小时访问量
  source_stats: Array<{
    source: string;
    count: number;
  }>; // 来源统计
  hourly_stats: Array<{
    hour: number;
    count: number;
    label: string;
  }>; // 按小时统计
  daily_stats: Array<{
    date: string;
    count: number;
  }>; // 按日期统计
}

// 获取流量详细分析数据
export const getTrafficAnalysisApi = (params?: { timeRange?: string; source?: string; timezone?: string }) => {
  return http.get<TrafficAnalysis>("/admin/statistics/traffic/analysis", params);
};

// 设备统计数据类型
export interface DeviceStatistics {
  total_visits: number; // 总访问量
  device_count: number; // 设备类型数量
  peak_hour: number; // 峰值小时
  peak_count: number; // 峰值访问量
  avg_visits_per_hour: number; // 平均每小时访问量
  device_stats: Array<{
    device: string;
    count: number;
  }>; // 设备类型统计
  hourly_stats: Array<{
    hour: number;
    count: number;
    label: string;
  }>; // 按小时统计
  daily_stats: Array<{
    date: string;
    count: number;
  }>; // 按日期统计
}

// 获取设备统计数据
export const getDeviceStatisticsApi = (params?: { timeRange?: string; device?: string; timezone?: string }) => {
  return http.get<DeviceStatistics>("/admin/statistics/device", params);
};

// 转化统计数据类型
export interface ConversionStatistics {
  total_visitors: number; // 总访客数
  total_order_users: number; // 下单用户数（去重）
  total_orders: number; // 总订单数
  overall_conversion_rate: number; // 总体转化率
  product_count: number; // 商品数量
  conversion_data: Array<{
    product_id: string;
    product_title: string;
    product_image: string | null;
    visitor_count: number;
    order_count: number;
    total_orders: number;
    conversion_rate: number;
  }>; // 各商品转化数据
}

// 获取转化统计数据
export const getConversionStatisticsApi = (params?: { timeRange?: string; product_id?: string; timezone?: string }) => {
  return http.get<ConversionStatistics>("/admin/statistics/conversion", params);
};
