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
  banner_text?: string;
  home_redirect_url?: string;
  cloak_rule_id?: number | null;
  language?: string;
  items: CategoryPageItem[];
  status: string;
  item_count?: number;
  created_at?: string;
  updated_at?: string;
  /**
   * 访问/点击统计（存于 Redis，由列表接口补齐；见后端 CategoryPageStatsService）
   * uv_click_rate 是按人数算的点击率，最能反映真实意向，列表主展示这个
   * pass_rate 是点击后真正看到正品的比例，剩下的是被斗篷打回首页的
   */
  stats?: {
    views: number;
    uv: number;
    clicks: number;
    click_uv: number;
    to_product: number;
    to_home: number;
    click_rate: number;
    uv_click_rate: number;
    pass_rate: number;
    days: number;
  } | null;
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

/**
 * 分类落地页 营销元素开关
 * 分类页对所有访客一致，广告审核员看到的就是这个页面。
 * 出问题时可一键关闭全部营销元素（或单独关掉某项），不用改代码。
 */
export interface MarketingSettings {
  enabled: number; // 总开关
  countdown: number; // 顶部倒计时
  toast: number; // 最近购买弹窗
  viewers: number; // 正在浏览人数
  hot_badge: number; // 热销角标
  scarcity: number; // 仅剩X件 / 今日已售
  rating: number; // 评分与评价数
  trust: number; // 货到付款 / 免费配送
}

export const getMarketingSettingsApi = () => {
  return http.get<MarketingSettings>(`/admin/category-pages-marketing`);
};

export const updateMarketingSettingsApi = (data: MarketingSettings) => {
  return http.put(`/admin/category-pages-marketing`, data);
};
