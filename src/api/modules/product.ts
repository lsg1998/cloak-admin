import http from "@/api";

// 商品管理接口
export interface Product {
  id: string;
  spu_id: string;
  title: string;
  sell_price?: number;
  origin_price?: number;
  discount?: number;
  image_urls?: string[];
  rich_text_content?: string;
  specification_list?: any[];
  variants?: any[];
  status: "active" | "inactive" | "draft" | "deleted";
  product_type?: "original" | "fake";
  b_page_product_id?: string; // 保留兼容性（旧格式）
  linked_original_ids?: string[]; // 新增：关联的正品ID数组
  country?: string;
  cloak_rule_id?: number;
  cloak_rule_name?: string;
  cloak_rule_mode?: string;
  pixel_config?: PixelConfig;
  pixel_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PixelConfig {
  google_ads?: {
    conversion_id: string;
    conversion_label: string;
    enabled: boolean;
  };
  facebook?: {
    pixel_id: string;
    enabled: boolean;
  };
  tiktok?: {
    pixel_id: string;
    enabled: boolean;
  };
  custom?: {
    name: string;
    code: string;
    enabled: boolean;
  }[];
}

export interface ProductListParams {
  page?: number;
  size?: number;
  title?: string;
  product_id?: string;
  status?: string;
  product_type?: string;
  category_id?: string;
  country?: string;
}

export interface ProductListResponse {
  list: Product[];
  total: number;
  page: number;
  size: number;
}

export interface CreateProductParams {
  spu_id?: string;
  title: string;
  sell_price?: number;
  origin_price?: number;
  discount?: number;
  image_urls?: string[];
  rich_text_content?: string;
  specification_list?: any[];
  variants?: any[];
  status?: string;
  product_type?: "original" | "fake";
  b_page_product_id?: string;
  country?: string;
  cloak_rule_id?: number;
  pixel_config?: PixelConfig;
  pixel_enabled?: boolean;
}

export interface UpdateProductParams {
  spu_id?: string;
  title?: string;
  sell_price?: number;
  origin_price?: number;
  discount?: number;
  image_urls?: string[];
  rich_text_content?: string;
  specification_list?: any[];
  variants?: any[];
  status?: string;
  product_type?: "original" | "fake";
  b_page_product_id?: string;
  country?: string;
  cloak_rule_id?: number;
  pixel_config?: PixelConfig;
  pixel_enabled?: boolean;
}

// 获取商品列表
export const getProductListApi = (params: ProductListParams) => {
  // 手动构建查询字符串，确保参数正确传递
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append("page", params.page.toString());
  if (params.size) searchParams.append("size", params.size.toString());
  if (params.title) searchParams.append("title", params.title);
  if (params.product_id) searchParams.append("product_id", params.product_id);
  if (params.status) searchParams.append("status", params.status);
  if (params.product_type) searchParams.append("product_type", params.product_type);
  if (params.category_id) searchParams.append("category_id", params.category_id);
  if (params.country) searchParams.append("country", params.country);

  const queryString = searchParams.toString();
  const url = queryString ? `/admin/products?${queryString}` : "/admin/products";

  return http.get<ProductListResponse>(url);
};

// 获取商品详情
export const getProductApi = (id: string) => {
  return http.get<Product>(`/admin/products/${id}`);
};

// 创建商品
export const createProductApi = (data: CreateProductParams) => {
  return http.post("/admin/products", data);
};

// 更新商品
export const updateProductApi = (id: string, data: UpdateProductParams) => {
  return http.put(`/admin/products/${id}`, data);
};

// 删除商品
export const deleteProductApi = (id: string) => {
  return http.delete(`/admin/products/${id}`);
};

// 复制商品
export const copyProductApi = (id: string) => {
  return http.post(`/admin/products/${id}/copy`);
};

// 获取正品商品列表（供仿品选择）
export const getOriginalProductsApi = (search?: string) => {
  const params = search ? { search } : {};
  return http.get<Product[]>("/admin/products/original/list", params);
};

// 更新商品像素配置
export const updateProductPixelConfigApi = (id: string, pixelConfig: PixelConfig, pixelEnabled: boolean) => {
  return http.put(`/admin/products/${id}/pixel`, {
    pixel_config: pixelConfig,
    pixel_enabled: pixelEnabled
  });
};

// 只更新商品斗篷规则
export const updateProductCloakRuleApi = (id: string, cloakRuleId: string | null) => {
  const data = {
    cloak_rule_id: cloakRuleId
  };
  console.log("发送斗篷规则更新请求:", { id, data });
  return http.put(`/admin/products/${id}/cloak-rule`, data);
};

// 只更新商品仿品关联（支持多个正品）
export const updateProductFakeLinkApi = (id: string, originalProductIds: string[] | string | null) => {
  // 兼容旧格式和新格式
  let data: any;

  if (originalProductIds === null || originalProductIds === undefined) {
    // 取消关联
    data = { original_product_ids: [] };
  } else if (Array.isArray(originalProductIds)) {
    // 新格式：数组
    data = { original_product_ids: originalProductIds };
  } else {
    // 旧格式：单个ID，转换为数组
    data = { original_product_ids: [originalProductIds] };
  }

  console.log("发送仿品关联更新请求:", { id, data });
  return http.put(`/admin/products/${id}/fake-link`, data);
};

// 获取商品像素配置
export const getProductPixelConfigApi = (id: string) => {
  return http.get<{ pixel_config: PixelConfig; pixel_enabled: boolean }>(`/admin/products/${id}/pixel`);
};

// 获取商品国家统计
export interface CountryStats {
  stats: { country: string; count: number }[];
  total: number;
}

export const getProductCountryStatsApi = () => {
  return http.get<CountryStats>("/admin/products/country-stats");
};
