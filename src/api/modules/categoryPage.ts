import http from "@/api";

// 分类落地页商品项
export interface CategoryPageItem {
  image: string;
  target_product_id: string;
  title?: string;
  price?: string;
  target_url?: string;
  sort?: number;
}

// 分类落地页
export interface CategoryPage {
  id?: number;
  name: string;
  slug: string;
  title?: string;
  home_redirect_url?: string;
  cloak_rule_id?: number | null;
  language?: string;
  items: CategoryPageItem[];
  status: string;
  item_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryPageListParams {
  page?: number;
  size?: number;
  keyword?: string;
}

// 列表
export const getCategoryPageListApi = (params: CategoryPageListParams) => {
  return http.get<{ list: CategoryPage[]; total: number }>(`/admin/category-pages`, params);
};

// 详情
export const getCategoryPageApi = (id: number | string) => {
  return http.get<CategoryPage>(`/admin/category-pages/${id}`);
};

// 新建
export const createCategoryPageApi = (data: Partial<CategoryPage>) => {
  return http.post(`/admin/category-pages`, data);
};

// 更新
export const updateCategoryPageApi = (id: number | string, data: Partial<CategoryPage>) => {
  return http.put(`/admin/category-pages/${id}`, data);
};

// 删除
export const deleteCategoryPageApi = (id: number | string) => {
  return http.delete(`/admin/category-pages/${id}`);
};
