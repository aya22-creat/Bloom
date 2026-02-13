import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Clock, Award, Play } from 'lucide-react'
import { CourseService } from '@/services/course.service'
import { Enrollment } from '@/types/course.types'
import { useAuth } from '@/contexts/AuthContext'

export function MyCourses() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadEnrollments()
    }
  }, [user])

  const loadEnrollments = async () => {
    try {
      setLoading(true)
      const data = await CourseService.getUserEnrollments(user.id)
      setEnrollments(data)
    } catch (error) {
      console.error('Error loading enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelLabel = (level: string) => {
    const labels = {
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم'
    }
    return labels[level as keyof typeof labels] || level
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('education.myCourses.title', 'كورساتي')}
        </h1>
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
          {t('education.myCourses.title', 'كورساتي')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('education.myCourses.subtitle', 'تابع تقدمك في الكورسات التي سجلت بها')}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t('education.myCourses.noCourses', 'لم تسجل في أي كورس بعد')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('education.myCourses.exploreCourses', 'استكشف كورساتنا وابدأ رحلتك التعليمية')}
            </p>
            <Link to="/courses">
              <Button>
                {t('education.myCourses.browseCourses', 'تصفح الكورسات')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={enrollment.course?.thumbnail_url || 'https://via.placeholder.com/400x225'}
                  alt={enrollment.course?.title}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-4 right-4">
                  {getLevelLabel(enrollment.course?.level || '')}
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">
                  {enrollment.course?.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {enrollment.course?.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('education.myCourses.progress', 'التقدم')}</span>
                      <span>{enrollment.progress_percentage}%</span>
                    </div>
                    <Progress value={enrollment.progress_percentage} />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{enrollment.course?.duration_hours} ساعة</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>
                        {enrollment.completed_at 
                          ? t('education.myCourses.completed', 'مكتمل')
                          : t('education.myCourses.inProgress', 'قيد التقدم')
                        }
                      </span>
                    </div>
                  </div>

                  {/* Enrollment Date */}
                  <div className="text-xs text-gray-500">
                    {t('education.myCourses.enrolledOn', 'مسجل منذ')} {formatDate(enrollment.enrolled_at)}
                  </div>

                  {/* Action Button */}
                  <Link to={`/course/${enrollment.course_id}/learn`}>
                    <Button className="w-full">
                      <Play className="h-4 w-4 ml-2" />
                      {enrollment.progress_percentage === 0 
                        ? t('education.myCourses.start', 'ابدأ')
                        : t('education.myCourses.continue', 'استمر')
                      }
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}