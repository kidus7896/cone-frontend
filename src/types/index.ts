export type Condition = 'new' | 'like_new' | 'used_good' | 'used_fair' | 'refurbished' | 'used';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'waiting_for_review'
  | 'active'
  | 'paused'
  | 'sold'
  | 'rejected'
  | 'expired';

export interface CategoryFieldDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  required?: boolean;
  options?: string[];
  unit?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  itemCount: number;
  subcategories: string[];
  fields?: CategoryFieldDef[];
}

export interface Seller {
  id: string;
  name: string;
  phone_masked: string;
  phone_revealed?: string;
  telegram_username?: string;
  email?: string;
  joined_at: string;
  avatar_url?: string;
  rating?: number;
  total_listings?: number;
  verified: boolean;
}

export interface ListingImageItem {
  id: string;
  url: string;
  is_cover?: boolean;
}

export interface Listing {
  id: string;
  title: string;
  slug?: string;
  description: string;
  price: number;
  currency: 'ETB';
  is_negotiable: boolean;
  category_id: string;
  category_name: string;
  subcategory?: string;
  area: string;
  subcity?: string;
  landmark?: string;
  condition: Condition;
  images: string[];
  images_meta?: ListingImageItem[];
  attributes: Record<string, string | number | boolean>;
  status: ListingStatus;
  rejection_reason?: string;
  views_count: number;
  favorites_count: number;
  created_at: string;
  updated_at: string;
  seller: Seller;
  is_favorited?: boolean;
  show_phone?: boolean;
  contact?: {
    show_phone: boolean;
    telegram_username?: string;
    email?: string;
  };
}

export interface CreateDraftPayload {
  title: string;
  categoryId: string;
  areaId: string;
}

export interface UpdateListingPayload {
  title?: string;
  categoryId?: string;
  areaId?: string;
  price?: number;
  is_negotiable?: boolean;
  condition?: 'new' | 'used' | Condition;
  description?: string;
  attributes?: Record<string, any>;
  contact?: {
    show_phone?: boolean;
    telegram_username?: string;
    email?: string;
  };
}

export interface ListingsQuery {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  area?: string;
  condition?: Condition | '';
  min_price?: number;
  max_price?: number;
  is_negotiable?: boolean;
  q?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'user' | 'moderator' | 'super_admin';
  privacy_accepted: boolean;
  avatar_url?: string;
  created_at: string;
  email?: string;
  area_id?: string;
  area_name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface RevealPhoneResponse {
  phone: string;
  revealed_at: string;
}

export interface ReportPayload {
  reason: 'spam' | 'fraud' | 'inappropriate' | 'duplicate' | 'wrong_category' | 'sold' | 'other';
  details?: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
}
