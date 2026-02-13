import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Clock, Users, Search, Filter } from 'lucide-react'
import { CourseService } from '@/services/course.service'
import { Course, CourseFilter } from '@/types/course.types'
import { useAuth } from '@/contexts/AuthContext'

export function CourseCatalog() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CourseFilter>({})
  const [userEnrollments, setUserEnrollments] = useState<string[]>([])

  const categories = [
    'الكل',
    'التشخيص والعلاج',
    'التغذية والصحة',
    'العناية والمتابعة',
    'الدعم النفسي'
  ]

  const levels = [
    'الكل',
    'beginner',
    'intermediate',
    'advanced'
  ]

  useEffect(() => {
    loadCourses()
    if (user) {
      loadUserEnrollments()
    }
  }, [user])

  useEffect(() => {
    loadCourses()
  }, [filter])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await CourseService.getCourses(filter)
      setCourses(data)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserEnrollments = async () => {
    try {
      const enrollments = await CourseService.getUserEnrollments(user.id)
      setUserEnrollments(enrollments.map(e => e.course_id))
    } catch (error) {
      console.error('Error loading enrollments:', error)
    }
  }

  const handleFilterChange = (key: keyof CourseFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value === 'الكل' ? undefined : value
    }))
  }

  const getLevelLabel = (level: string) => {
    const labels = {
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم'
    }
    return labels[level as keyof typeof labels] || level
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('education.catalog.title', 'كتالوج الكورسات')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('education.catalog.subtitle', 'اكتسب المعرفة والمهارات اللازمة للتعامل مع أورام الثدي')}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('education.catalog.search', 'ابحث عن كورس...')}
              value={filter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pr-10"
            />
          </div>
          
          <Select
            value={filter.category || 'الكل'}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {t(`education.categories.${category}`, category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filter.level || 'الكل'}
            onValueChange={(value) => handleFilterChange('level', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {levels.map(level => (
                <SelectItem key={level} value={level}>
                  {level === 'الكل' ? t('common.all', 'الكل') : getLevelLabel(level)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={t('education.catalog.priceMin', 'الحد الأدنى')}
              value={filter.price_min || ''}
              onChange={(e) => handleFilterChange('price_min', e.target.value ? Number(e.target.value) : undefined)}
            />
            <span className="text-gray-500">-</span>
            <Input
              type="number"
              placeholder={t('education.catalog.priceMax', 'الحد الأقصى')}
              value={filter.price_max || ''}
              onChange={(e) => handleFilterChange('price_max', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={course.thumbnail_url || 'https://via.placeholder.com/400x225'}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <Badge className="absolute top-4 right-4">
                {getLevelLabel(course.level)}
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration_hours} ساعة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.instructor?.total_students || 0} طالب</span>
                </div>
              </div>

              {course.instructor && (
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={course.instructor.avatar_url || 'https://via.placeholder.com/32'}
                    alt={course.instructor.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium">{course.instructor.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500">
                        {course.instructor.rating}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(course.price)}
                </span>
                
                {userEnrollments.includes(course.id) ? (
                  <Link to={`/course/${course.id}/learn`}>
                    <Button variant="outline" size="sm">
                      {t('education.catalog.continue', 'استمر')}
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/courses/${course.id}`}>
                    <Button size="sm">
                      {t('education.catalog.viewDetails', 'عرض التفاصيل')}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            {t('education.catalog.noCourses', 'لا توجد كورسات متاحة حالياً')}
          </div>
        </div>
      )}
    </div>
  )
}