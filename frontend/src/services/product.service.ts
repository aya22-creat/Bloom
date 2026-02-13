import { api } from '../lib/api';

export interface Product {
  id: number;
  vendor_id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  image_url?: string;
  verified: number;
  active: number;
  created_at: string;
  vendor_name: string;
}

export interface ProductFilters {
  category?: string;
  verified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
  total?: number;
  pages?: number;
}

export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

export const productService = {
  async getProducts(filters?: ProductFilters): Promise<ProductResponse> {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.verified) params.append('verified', String(filters.verified));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/marketplace/products?${params.toString()}`);
    const data = (response as any)?.data;
    return { success: true, data: Array.isArray(data) ? data : [] } as ProductResponse;
  },

  async getProductById(id: number): Promise<ProductDetailResponse> {
    const response = await api.get(`/marketplace/products/${id}`);
    return response as ProductDetailResponse;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get('/marketplace/categories');
    const data = (response as any)?.data;
    return Array.isArray(data) ? data : [];
  }
};
