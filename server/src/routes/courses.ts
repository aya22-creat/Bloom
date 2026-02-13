import { Router } from 'express'
import { authMiddleware as authenticateToken } from '../middleware/auth.middleware'
import { supabase } from '../lib/database'

const router = Router()

// Get all published courses
router.get('/', async (req, res) => {
  try {
    const { category, level, price_min, price_max, search, page = 1, limit = 12 } = req.query

    let query = supabase
      .from('courses')
      .select(`
        *,
        instructor:instructor_id(*)
      `)
      .eq('status', 'published')

    // Apply filters
    if (category && category !== 'الكل') {
      query = query.eq('category', category)
    }

    if (level && level !== 'الكل') {
      query = query.eq('level', level)
    }

    if (price_min) {
      query = query.gte('price', Number(price_min))
    }

    if (price_max) {
      query = query.lte('price', Number(price_max))
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Pagination
    const start = (Number(page) - 1) * Number(limit)
    const end = start + Number(limit) - 1

    query = query.range(start, end).order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    res.json({
      courses: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ 
      error: 'Failed to fetch courses',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:instructor_id(*),
        lessons:lesson(*)
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return res.status(404).json({ error: 'Course not found' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching course:', error)
    res.status(500).json({ 
      error: 'Failed to fetch course',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get user's enrolled courses
router.get('/my/enrollments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:course_id(*)
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching user enrollments:', error)
    res.status(500).json({ 
      error: 'Failed to fetch enrollments',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Check if user is enrolled in a course
router.get('/:id/enrollment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const { data, error } = await supabase
      .from('enrollments')
      .select('id, progress_percentage, completed_lessons')
      .eq('user_id', userId)
      .eq('course_id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    res.json({ enrolled: !!data, enrollment: data })
  } catch (error) {
    console.error('Error checking enrollment:', error)
    res.status(500).json({ 
      error: 'Failed to check enrollment',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create order for course purchase
router.post('/:id/order', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // First, check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', id)
      .single()

    if (existingEnrollment) {
      return res.status(400).json({ error: 'User already enrolled in this course' })
    }

    // Get course details
    const { data: course } = await supabase
      .from('courses')
      .select('price')
      .eq('id', id)
      .single()

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        course_id: id,
        amount: course.price,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    res.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update enrollment progress
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { lessonId, progressPercentage } = req.body

    if (!lessonId || progressPercentage === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: lessonId, progressPercentage' 
      })
    }

    // First, check if user is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('completed_lessons')
      .eq('user_id', userId)
      .eq('course_id', id)
      .single()

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' })
    }

    // Update completed lessons
    const completedLessons = enrollment.completed_lessons || []
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
    }

    // Update enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        progress_percentage: progressPercentage,
        completed_lessons: completedLessons,
        completed_at: progressPercentage === 100 ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('course_id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating progress:', error)
    res.status(500).json({ 
      error: 'Failed to update progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
