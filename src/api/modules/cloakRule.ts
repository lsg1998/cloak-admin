import http from "@/api";

// 斗篷规则接口类型定义
export interface CloakRule {
  id: number;
  name: string;
  target_regions: string[];
  mode: "cloak" | "green" | "open" | "audit";
  spider_whitelist: string[];
  block_pc: number;
  block_proxy: number;
  blocked_keywords: string[];
  allowed_countries: string[];
  blocked_countries: string[];
  allowed_organizations: string[];
  blocked_organizations: string[];
  description?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CloakRuleListParams {
  page?: number;
  size?: number;
  name?: string;
  mode?: string;
  is_active?: number;
}

export interface CloakRuleFormData {
  name: string;
  target_regions: string[];
  mode: "cloak" | "green" | "open" | "audit";
  spider_whitelist: string[];
  block_pc: number;
  block_proxy: number;
  blocked_keywords: string[];
  allowed_countries: string[];
  blocked_countries: string[];
  allowed_organizations: string[];
  blocked_organizations: string[];
  description?: string;
  is_active: number;
}

// 斗篷规则API
export const cloakRuleApi = {
  // 获取斗篷规则列表
  getCloakRules: (params: CloakRuleListParams) => {
    return http.get("/admin/cloak-rules", params);
  },

  // 获取单个斗篷规则
  getCloakRule: (id: number) => {
    return http.get(`/admin/cloak-rules/${id}`);
  },

  // 创建斗篷规则
  createCloakRule: (data: CloakRuleFormData) => {
    return http.post("/admin/cloak-rules", data);
  },

  // 更新斗篷规则
  updateCloakRule: (id: number, data: CloakRuleFormData) => {
    return http.put(`/admin/cloak-rules/${id}`, data);
  },

  // 删除斗篷规则
  deleteCloakRule: (id: number) => {
    return http.delete(`/admin/cloak-rules/${id}`);
  },

  // 获取商品关联的斗篷规则
  getProductCloakRule: (productId: string) => {
    return http.get(`/admin/products/${productId}/cloak-rule`);
  },

  // 设置商品斗篷规则
  setProductCloakRule: (data: { product_id: string; cloak_rule_id: number }) => {
    return http.post("/admin/products/cloak-rule", data);
  }
};
