import http from "@/api";

// 商品属性接口
export interface ProductAttribute {
  id: number;
  name: string;
  display_name: string;
  input_type: "select" | "radio" | "checkbox" | "text";
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
}

export interface ProductAttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  display_value: string;
  color_code?: string;
  image_url?: string;
  sort_order: number;
  status: "active" | "inactive";
}

export interface CreateAttributeParams {
  name: string;
  display_name: string;
  input_type?: "select" | "radio" | "checkbox" | "text";
  sort_order?: number;
}

export interface CreateAttributeValueParams {
  attribute_id: number;
  value: string;
  display_value: string;
  color_code?: string;
  image_url?: string;
  sort_order?: number;
}

// 获取属性列表
export const getAttributesApi = () => {
  return http.get<ProductAttribute[]>("/admin/product-attributes");
};

// 获取属性值列表
export const getAttributeValuesApi = (attributeId: number) => {
  return http.get<ProductAttributeValue[]>(`/admin/product-attributes/${attributeId}/values`);
};

// 创建属性
export const createAttributeApi = (data: CreateAttributeParams) => {
  return http.post("/admin/product-attributes", data);
};

// 创建属性值
export const createAttributeValueApi = (data: CreateAttributeValueParams) => {
  return http.post("/admin/product-attribute-values", data);
};
