import { http } from "@/api";

// 邮件模板接口数据类型
export interface EmailTemplate {
  id: number;
  template_code: string;
  country_code: string;
  template_name: string;
  subject: string;
  html_content: string;
  content_length?: number;
  variables?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 邮件模板列表查询参数
export interface EmailTemplateListParams {
  page?: number;
  page_size?: number;
  template_code?: string;
  country_code?: string;
  is_active?: number;
  keyword?: string;
}

// 邮件模板列表响应数据
export interface EmailTemplateListResponse {
  list: EmailTemplate[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

// 创建/更新邮件模板参数
export interface EmailTemplateFormData {
  id?: number;
  template_code: string;
  country_code: string;
  template_name: string;
  subject: string;
  html_content: string;
  variables?: string[];
  is_active?: number | boolean;
}

// 邮件发送日志接口数据类型
export interface EmailLog {
  id: number;
  order_id: number;
  order_number?: string;
  customer_name?: string;
  email_to: string;
  email_type: string;
  template_code?: string;
  country_code?: string;
  subject?: string;
  html_content?: string;
  content_length?: number;
  status: "success" | "failed" | "sending";
  error_message?: string;
  task_id?: number;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
}

// 邮件日志列表查询参数
export interface EmailLogListParams {
  page?: number;
  page_size?: number;
  order_id?: string;
  email_to?: string;
  email_type?: string;
  template_code?: string;
  country_code?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

// 邮件日志列表响应数据
export interface EmailLogListResponse {
  list: EmailLog[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

// 邮件统计数据类型
export interface EmailStats {
  overall: {
    total: number;
    success_count: number;
    failed_count: number;
    sending_count: number;
  };
  by_type: Array<{
    email_type: string;
    template_code: string;
    count: number;
    success_count: number;
  }>;
  by_country: Array<{
    country_code: string;
    count: number;
    success_count: number;
  }>;
  daily_trend: Array<{
    date: string;
    total: number;
    success_count: number;
    failed_count: number;
  }>;
  date_range: {
    start_date: string;
    end_date: string;
  };
}

// 邮件统计查询参数
export interface EmailStatsParams {
  start_date?: string;
  end_date?: string;
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

/**
 * 获取邮件模板列表
 */
export const getEmailTemplatesApi = (params: EmailTemplateListParams = {}) => {
  return http.get<EmailTemplateListResponse>("/admin/email-templates", params);
};

/**
 * 获取单个邮件模板详情
 */
export const getEmailTemplateApi = (id: number) => {
  return http.get<EmailTemplate>(`/admin/email-templates/${id}`);
};

/**
 * 创建邮件模板
 */
export const createEmailTemplateApi = (data: EmailTemplateFormData) => {
  return http.post("/admin/email-templates", data);
};

/**
 * 更新邮件模板
 */
export const updateEmailTemplateApi = (id: number, data: EmailTemplateFormData) => {
  return http.put(`/admin/email-templates/${id}`, data);
};

/**
 * 删除邮件模板
 */
export const deleteEmailTemplateApi = (id: number) => {
  return http.delete(`/admin/email-templates/${id}`);
};

/**
 * 获取模板代码列表（下拉选项）
 */
export const getTemplateCodesApi = () => {
  return http.get<TemplateCodeOption[]>("/admin/email-template-codes");
};

/**
 * 获取国家代码列表（下拉选项）
 */
export const getCountryCodesApi = () => {
  return http.get<CountryCodeOption[]>("/admin/email-country-codes");
};

/**
 * 获取邮件发送记录列表
 */
export const getEmailLogsApi = (params: EmailLogListParams = {}) => {
  return http.get<EmailLogListResponse>("/admin/email-logs", params);
};

/**
 * 获取单个邮件发送记录详情
 */
export const getEmailLogApi = (id: number) => {
  return http.get<EmailLog>(`/admin/email-logs/${id}`);
};

/**
 * 获取邮件统计数据
 */
export const getEmailStatsApi = (params: EmailStatsParams = {}) => {
  return http.get<EmailStats>("/admin/email-stats", params);
};

/**
 * 发送拣货通知邮件
 */
export const sendPickingEmailApi = (orderId: number) => {
  return http.post(`/admin/orders/${orderId}/send-picking-email`);
};

/**
 * 发送发货通知邮件
 */
export const sendShippedEmailApi = (orderId: number) => {
  return http.post(`/admin/orders/${orderId}/send-shipped-email`);
};

/**
 * 发送到达提醒邮件
 */
export const sendArrivalReminderApi = (orderId: number) => {
  return http.post(`/admin/orders/${orderId}/send-arrival-reminder`);
};

/**
 * 发送补发通知邮件
 */
export const sendReshipmentNoticeApi = (orderId: number) => {
  return http.post(`/admin/orders/${orderId}/send-reshipment-notice`);
};

// 手动发送邮件参数
export interface ManualEmailParams {
  email_to: string;
  template_code: string;
  country_code: string;
  variables?: {
    order_number?: string;
    customer_name?: string;
    product_title?: string;
    quantity?: string;
    total_amount?: string;
    currency?: string;
    address?: string;
    city?: string;
    country?: string;
    product_image?: string;
  };
}

/**
 * 手动发送邮件（使用数据库模板）
 */
export const sendManualEmailApi = (data: ManualEmailParams) => {
  return http.post("/admin/email-send", data);
};

// 自定义邮件发送参数
export interface CustomEmailParams {
  order_id: number;
  email_to: string;
  subject: string;
  html_content: string;
}

/**
 * 发送自定义邮件
 */
export const sendCustomEmailApi = (data: CustomEmailParams) => {
  return http.post("/admin/orders/send-custom-email", data);
};
