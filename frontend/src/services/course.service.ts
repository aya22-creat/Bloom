import { supabase } from '@/lib/supabase'
import { Course, CourseFilter, Enrollment, Order, Lesson } from '@/types/course.types'

export class CourseService {
  static async getCourses(filter?: CourseFilter): Promise<Course[]> {
    let query = supabase
      .from('courses')
      .select(`
        *,
        instructor:instructor_id(*)
      `)
      .eq('status', 'published')

    if (filter?.category) {
      query = query.eq('category', filter.category)
    }

    if (filter?.level) {
      query = query.eq('level', filter.level)
    }

    if (filter?.price_min !== undefined) {
      query = query.gte('price', filter.price_min)
    }

    if (filter?.price_max !== undefined) {
      query = query.lte('price', filter.price_max)
    }

    if (filter?.search) {
      query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`)
    }

    return data || []
  }

  static async getCourseById(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:instructor_id(*),
        lessons:lessons(*)
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error) {
      throw new Error(`Failed to fetch course: ${error.message}`)
    }

    return data
  }

  static async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:course_id(*)
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch enrollments: ${error.message}`)
    }

    return data || []
  }

  static async checkEnrollment(userId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check enrollment: ${error.message}`)
    }

    return !!data
  }

  static async createOrder(userId: string, courseId: string, amount: number): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        course_id: courseId,
        amount,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`)
    }

    return data
  }

  static async updateEnrollmentProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    progressPercentage: number
  ): Promise<void> {
    // First check if enrollment exists
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('completed_lessons')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (!existingEnrollment) {
      throw new Error('Enrollment not found')
    }

    const completedLessons = existingEnrollment.completed_lessons || []
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
    }

    const { error } = await supabase
      .from('enrollments')
      .update({
        progress_percentage: progressPercentage,
        completed_lessons: completedLessons,
        completed_at: progressPercentage === 100 ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('course_id', courseId)

    if (error) {
      throw new Error(`Failed to update progress: ${error.message}`)
    }
  }

  static async getLessonsByCourseId(courseId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch lessons: ${error.message}`)
    }

    return data || []
  }
}
