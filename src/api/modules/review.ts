import http from "@/api";

export interface ProductReview {
  id?: number;
  product_id?: string;
  reviewer_name: string;
  reviewer_country: string;
  reviewer_country_flag: string;
  rating: number;
  review_content: string;
  review_images: string[];
  review_video: string | null;
  purchased_spec: string;
  review_date: string;
  is_verified: number;
  helpful_count: number;
  seller_reply: string | null;
  seller_reply_date: string | null;
  sort_order: number;
  status: "active" | "hidden";
  created_at?: string;
  updated_at?: string;
}

export const getProductReviewsApi = (productId: string) => {
  return http.get<ProductReview[]>(`/admin/products/${productId}/reviews`);
};

export const createProductReviewApi = (productId: string, data: Partial<ProductReview>) => {
  return http.post(`/admin/products/${productId}/reviews`, data);
};

export const updateProductReviewApi = (productId: string, reviewId: number, data: Partial<ProductReview>) => {
  return http.put(`/admin/products/${productId}/reviews/${reviewId}`, data);
};

export const deleteProductReviewApi = (productId: string, reviewId: number) => {
  return http.delete(`/admin/products/${productId}/reviews/${reviewId}`);
};

export const batchCreateReviewsApi = (productId: string, reviews: Partial<ProductReview>[]) => {
  return http.post(`/admin/products/${productId}/reviews/batch`, { reviews });
};

export const updateReviewSortApi = (productId: string, sortData: { id: number; sort_order: number }[]) => {
  return http.put(`/admin/products/${productId}/reviews/sort`, { sort_data: sortData });
};
