import http from "@/api";

// 商品SKU接口
export interface ProductSku {
  id: string;
  product_id: string;
  sku_code: string;
  sku_name: string;
  sell_price: number;
  origin_price: number;
  cost_price: number;
  discount_percent: number;
  stock_quantity: number;
  warning_stock: number;
  main_image: string;
  status: "active" | "inactive" | "out_of_stock";
  created_at: string;
  updated_at: string;
  attributes: SkuAttribute[];
}

export interface SkuAttribute {
  attribute_name: string;
  display_name: string;
  value: string;
  display_value: string;
  color_code?: string;
}

export interface CreateSkuParams {
  product_id: string;
  sku_code?: string;
  sku_name?: string;
  sell_price: number;
  origin_price?: number;
  cost_price?: number;
  discount_percent?: number;
  stock_quantity?: number;
  warning_stock?: number;
  main_image?: string;
  attributes: SkuAttributeValue[];
}

export interface UpdateSkuParams {
  sku_code?: string;
  sku_name?: string;
  sell_price?: number;
  origin_price?: number;
  cost_price?: number;
  discount_percent?: number;
  stock_quantity?: number;
  warning_stock?: number;
  main_image?: string;
  status?: "active" | "inactive" | "out_of_stock";
  attributes?: SkuAttributeValue[];
}

export interface SkuAttributeValue {
  attribute_id: number;
  attribute_value_id: number;
}

// 获取商品SKU列表
export const getProductSkusApi = (productId: string) => {
  return http.get<ProductSku[]>(`/admin/products/${productId}/skus`);
};

// 创建SKU
export const createSkuApi = (data: CreateSkuParams) => {
  return http.post("/admin/product-skus", data);
};

// 更新SKU
export const updateSkuApi = (id: string, data: UpdateSkuParams) => {
  return http.put(`/admin/product-skus/${id}`, data);
};

// 删除SKU
export const deleteSkuApi = (id: string) => {
  return http.delete(`/admin/product-skus/${id}`);
};
