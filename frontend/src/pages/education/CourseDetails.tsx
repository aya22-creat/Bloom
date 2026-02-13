import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Clock, Users, PlayCircle, CheckCircle, Lock } from 'lucide-react'
import { CourseService } from '@/services/course.service'
import { StripeService } from '@/services/stripe.service'
import { Course } from '@/types/course.types'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function CourseDetails() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    if (id) {
      loadCourse()
      if (user) {
        checkEnrollment()
      }
    }
  }, [id, user])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const data = await CourseService.getCourseById(id!)
      setCourse(data)
    } catch (error) {
      console.error('Error loading course:', error)
      toast.error(t('education.details.loadError', 'فشل تحميل بيانات الكورس'))
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollment = async () => {
    if (!user || !id) return
    
    try {
      const enrolled = await CourseService.checkEnrollment(user.id, id)
      setIsEnrolled(enrolled)
    } catch (error) {
      console.error('Error checking enrollment:', error)
    }
  }

  const handlePurchase = async () => {
    if (!user || !course) {
      toast.error(t('auth.loginRequired', 'يرجى تسجيل الدخول أولاً'))
      navigate('/login', { state: { from: `/courses/${id}` } })
      return
    }

    try {
      setPurchasing(true)
      
      await StripeService.createCheckoutSession(undefined as any, course.id, course.price, course.title, course.thumbnail_url)
    } catch (error) {
      console.error('Error creating purchase:', error)
      const platformUrl = (course.metadata && (course.metadata as any).platform_url) as string | undefined
      if (platformUrl) {
        toast.error(t('education.details.purchaseError', 'فشل إنشاء عملية الشراء'))
        window.open(platformUrl, '_blank')
      } else {
        toast.error(t('education.details.purchaseError', 'فشل إنشاء عملية الشراء'))
      }
    } finally {
      setPurchasing(false)
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg mb-6" />
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div>
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('education.details.notFound', 'الكورس غير موجود')}
        </h1>
        <Button onClick={() => navigate('/education')}>
          {t('common.back', 'الرجوع')}
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Course Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
            <img
              src={course.thumbnail_url || 'https://via.placeholder.com/800x450'}
              alt={course.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge>{getLevelLabel(course.level)}</Badge>
                <Badge variant="outline">{course.category}</Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {course.title}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {course.description}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration_hours} ساعة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.instructor?.total_students || 0} طالب</span>
                </div>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('education.details.overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="curriculum">{t('education.details.curriculum', 'المحتوى')}</TabsTrigger>
              <TabsTrigger value="instructor">{t('education.details.instructor', 'المدرب')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('education.details.whatLearn', 'ماذا ستتعلم؟')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.metadata?.learning_outcomes?.map((outcome: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    )) || (
                      <li className="text-gray-500">
                        {t('education.details.noOutcomes', 'لم يتم تحديد نتائج التعلم')}
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="curriculum" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('education.details.curriculum', 'المحتوى')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.lessons?.map((lesson, index) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          <p className="text-sm text-gray-500">{lesson.duration_minutes} دقيقة</p>
                        </div>
                      </div>
                      {isEnrolled ? (
                        <PlayCircle className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  )) || (
                    <p className="text-gray-500">
                      {t('education.details.noLessons', 'لم يتم إضافة دروس بعد')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="instructor" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <img
                      src={course.instructor?.avatar_url || 'https://via.placeholder.com/64'}
                      alt={course.instructor?.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <CardTitle>{course.instructor?.name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{course.instructor?.rating}</span>
                        <span className="text-sm text-gray-500">
                          ({course.instructor?.total_students} طالب)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {course.instructor?.bio}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-2xl">
                {formatPrice(course.price)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEnrolled ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('education.details.progress', 'التقدم')}</span>
                      <span>0%</span>
                    </div>
                    <Progress value={0} />
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/course/${course.id}/learn`)}
                  >
                    {t('education.details.continueLearning', 'استمر في التعلم')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    className="w-full"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      t('education.details.processing', 'جاري المعالجة...')
                    ) : (
                      t('education.details.enrollNow', 'سجل الآن')
                    )}
                  </Button>

          {course.metadata && (course.metadata as any).platform_url && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open((course.metadata as any).platform_url, '_blank')}
            >
              {t('education.details.buyOnOriginal', 'شراء على الموقع الأصلي')}
            </Button>
          )}
                  
                  <div className="text-center text-sm text-gray-500">
                    {t('education.details.lifetimeAccess', 'وصول مدى الحياة')}
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">
                      {t('education.details.includes', 'يشمل:')}
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {course.duration_hours} ساعة من المحتوى
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        وصول مدى الحياة
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        شهادة إتمام
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
