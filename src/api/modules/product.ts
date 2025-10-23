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
  b_page_product_id?: string;
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
  status?: string;
  product_type?: string;
  category_id?: string;
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
  if (params.status) searchParams.append("status", params.status);
  if (params.product_type) searchParams.append("product_type", params.product_type);
  if (params.category_id) searchParams.append("category_id", params.category_id);

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

// 获取正品商品列表（供仿品选择）
export const getOriginalProductsApi = (search?: string) => {
  const params = search ? { search } : {};
  return http.get<Product[]>("/admin/products/original/list", { params });
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

// 只更新商品仿品关联
export const updateProductFakeLinkApi = (id: string, originalProductId: string | null) => {
  const data = {
    b_page_product_id: originalProductId
  };
  console.log("发送仿品关联更新请求:", { id, data });
  return http.put(`/admin/products/${id}/fake-link`, data);
};

// 获取商品像素配置
export const getProductPixelConfigApi = (id: string) => {
  return http.get<{ pixel_config: PixelConfig; pixel_enabled: boolean }>(`/admin/products/${id}/pixel`);
};
