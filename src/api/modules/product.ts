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
  created_at: string;
  updated_at: string;
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

// 更新仿品的关联正品
export const updateFakeProductLinkApi = (fakeProductId: string, originalProductId: string) => {
  return http.put(`/admin/products/${fakeProductId}`, {
    product_type: "fake",
    b_page_product_id: originalProductId
  });
};
