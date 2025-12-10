import { http } from "@/api";

// ==================== 短信模板接口类型定义 ====================

// 短信模板
export interface SmsTemplate {
  id: number;
  template_code: string;
  country_code: string;
  template_name: string;
  content: string;
  content_length?: number;
  variables?: string[];
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 短信模板列表查询参数
export interface SmsTemplateListParams {
  page?: number;
  page_size?: number;
  template_code?: string;
  country_code?: string;
  is_active?: number;
  keyword?: string;
}

// 短信模板列表响应
export interface SmsTemplateListResponse {
  list: SmsTemplate[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

// 创建/更新短信模板参数
export interface SmsTemplateFormData {
  id?: number;
  template_code: string;
  country_code: string;
  template_name: string;
  content: string;
  variables?: string[];
  description?: string;
  is_active?: number | boolean;
  sort_order?: number;
}

// 模板代码选项
export interface TemplateCodeOption {
  template_code: string;
  description: string;
}

// 国家代码选项
export interface CountryCodeOption {
  code: string;
  name: string;
}

// ==================== 短信日志接口类型定义 ====================

// 短信发送日志
export interface SmsLog {
  id: number;
  order_id: number;
  order_number?: string;
  customer_name?: string;
  phone: string;
  sms_type: string;
  template_id?: number;
  country_code?: string;
  content: string;
  status: "success" | "failed" | "pending";
  message_id?: string;
  response_code?: string;
  response_message?: string;
  cost?: number;
  created_at: string;
}

// 短信日志查询参数
export interface SmsLogListParams {
  page?: number;
  page_size?: number;
  order_id?: string;
  phone?: string;
  sms_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

// 短信日志列表响应
export interface SmsLogListResponse {
  list: SmsLog[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

// 短信统计数据
export interface SmsStats {
  overall: {
    total: number;
    success_count: number;
    failed_count: number;
  };
  by_type: Array<{
    sms_type: string;
    count: number;
    success_count: number;
  }>;
  daily_trend: Array<{
    date: string;
    total: number;
    success_count: number;
    failed_count: number;
  }>;
}

// 短信配置
export interface SmsConfig {
  enabled: boolean;
  provider: string;
  access_key_configured: boolean;
  app_key_configured: boolean;
  test_mode: boolean;
  templates: string[];
}

// 自定义短信参数
export interface CustomSmsParams {
  order_id?: number;
  phone: string;
  content: string;
}

// 批量发送短信参数
export interface BatchSmsParams {
  order_ids: number[];
  sms_type: "picking" | "shipped" | "arrival" | "reshipment" | "custom";
  content?: string; // 仅当 sms_type 为 custom 时需要
}

// 短信发送结果
export interface SmsSendResult {
  messageid?: string;
  test_mode?: boolean;
  phone?: string;
}

// 批量发送结果
export interface BatchSmsResult {
  success: number;
  failed: number;
  details: Array<{
    order_id: number;
    success: boolean;
    messageid?: string;
    error?: string;
  }>;
}

// ==================== 短信API接口 ====================

/**
 * 获取短信配置
 */
export const getSmsConfigApi = () => {
  return http.get<SmsConfig>("/admin/sms/config");
};

/**
 * 获取短信发送记录列表
 */
export const getSmsLogsApi = (params: SmsLogListParams = {}) => {
  return http.get<SmsLogListResponse>("/admin/sms/logs", params);
};

/**
 * 获取短信统计数据
 */
export const getSmsStatsApi = () => {
  return http.get<SmsStats>("/admin/sms/stats");
};

/**
 * 发送拣货通知短信
 */
export const sendPickingSmsApi = (orderId: number) => {
  return http.post<SmsSendResult>(`/admin/orders/${orderId}/send-picking-sms`);
};

/**
 * 发送发货通知短信
 */
export const sendShippedSmsApi = (orderId: number) => {
  return http.post<SmsSendResult>(`/admin/orders/${orderId}/send-shipped-sms`);
};

/**
 * 发送到达提醒短信
 */
export const sendArrivalSmsApi = (orderId: number) => {
  return http.post<SmsSendResult>(`/admin/orders/${orderId}/send-arrival-sms`);
};

/**
 * 发送补发通知短信
 */
export const sendReshipmentSmsApi = (orderId: number) => {
  return http.post<SmsSendResult>(`/admin/orders/${orderId}/send-reshipment-sms`);
};

/**
 * 发送自定义短信
 */
export const sendCustomSmsApi = (data: CustomSmsParams) => {
  return http.post<SmsSendResult>("/admin/sms/send-custom", data);
};

/**
 * 批量发送短信
 */
export const batchSendSmsApi = (data: BatchSmsParams) => {
  return http.post<BatchSmsResult>("/admin/sms/batch-send", data);
};

// 短信类型选项（用于下拉框）
export const smsTypeOptions = [
  { label: "拣货通知", value: "picking" },
  { label: "发货通知", value: "shipped" },
  { label: "到达提醒", value: "arrival" },
  { label: "补发通知", value: "reshipment" },
  { label: "自定义", value: "custom" }
];

// 短信状态选项（用于下拉框）
export const smsStatusOptions = [
  { label: "发送成功", value: "success" },
  { label: "发送失败", value: "failed" },
  { label: "发送中", value: "pending" }
];

// 短信类型标签映射
export const smsTypeLabels: Record<string, string> = {
  picking: "拣货通知",
  shipped: "发货通知",
  arrival: "到达提醒",
  reshipment: "补发通知",
  custom: "自定义"
};

// ==================== 短信模板API ====================

/**
 * 获取短信模板列表
 */
export const getSmsTemplatesApi = (params: SmsTemplateListParams = {}) => {
  return http.get<SmsTemplateListResponse>("/admin/sms-templates", params);
};

/**
 * 获取单个短信模板详情
 */
export const getSmsTemplateApi = (id: number) => {
  return http.get<SmsTemplate>(`/admin/sms-templates/${id}`);
};

/**
 * 创建短信模板
 */
export const createSmsTemplateApi = (data: SmsTemplateFormData) => {
  return http.post("/admin/sms-templates", data);
};

/**
 * 更新短信模板
 */
export const updateSmsTemplateApi = (id: number, data: SmsTemplateFormData) => {
  return http.put(`/admin/sms-templates/${id}`, data);
};

/**
 * 删除短信模板
 */
export const deleteSmsTemplateApi = (id: number) => {
  return http.delete(`/admin/sms-templates/${id}`);
};

/**
 * 获取模板代码列表（下拉选项）
 */
export const getSmsTemplateCodesApi = () => {
  return http.get<TemplateCodeOption[]>("/admin/sms-template-codes");
};

/**
 * 获取国家代码列表（下拉选项）
 */
export const getSmsCountryCodesApi = () => {
  return http.get<CountryCodeOption[]>("/admin/sms-country-codes");
};

/**
 * 初始化默认短信模板
 */
export const initDefaultSmsTemplatesApi = () => {
  return http.post("/admin/sms-templates/init-defaults");
};
