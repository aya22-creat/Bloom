export interface Session {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  capacity: number;
  available_spots: number;
  booking_link: string | null;
  specialist_id: string;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  specialist?: Specialist;
}

export interface Specialist {
  id: string;
  name: string;
  photo_url: string | null;
  specialization: string;
  qualifications: string | null;
  experience: string | null;
  rating: number;
  is_verified: boolean;
  created_at: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  category_id: string;
  author_id: string;
  tags: string[];
  read_time: number;
  published_at: string;
  created_at: string;
  category?: Category;
  author?: Author;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface Author {
  id: string;
  name: string;
  specialization: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  session_id: string;
  user_id: string | null;
  user_email: string;
  user_phone: string | null;
  booking_time: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  notes: string | null;
  created_at: string;
}

export interface SessionFilters {
  location?: string;
  type?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export interface NewsFilters {
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}