export interface Instructor {
  id: string
  name: string
  bio: string
  avatar_url: string
  social_links: Record<string, string>
  rating: number
  total_students: number
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string
  price: number
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  instructor_id: string
  instructor?: Instructor
  duration_hours: number
  metadata: Record<string, any>
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  enrollments_count?: number
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  content: string
  video_url: string
  order_index: number
  duration_minutes: number
  resources: Array<{
    type: string
    url: string
    name: string
  }>
  created_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at?: string
  progress_percentage: number
  completed_lessons: string[]
  course?: Course
}

export interface Order {
  id: string
  user_id: string
  course_id: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  payment_method?: string
  created_at: string
  updated_at: string
  course?: Course
}

export interface Payment {
  id: string
  order_id: string
  stripe_payment_id: string
  amount: number
  currency: string
  status: string
  stripe_data: Record<string, any>
  created_at: string
  order?: Order
}

export interface CourseFilter {
  category?: string
  level?: string
  price_min?: number
  price_max?: number
  search?: string
}

export interface CourseProgress {
  course_id: string
  progress_percentage: number
  completed_lessons: string[]
  current_lesson_id?: string
}