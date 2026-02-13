import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Award, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function PaymentSuccess() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [courseData, setCourseData] = useState<any>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (sessionId && user) {
      loadPaymentData(sessionId)
    } else {
      setLoading(false)
    }
  }, [searchParams, user])

  const loadPaymentData = async (sessionId: string) => {
    try {
      // Get payment data from orders/payments
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:order_id(*, course:course_id(*))
        `)
        .eq('stripe_payment_id', sessionId)
        .single()

      if (error || !payments) {
        throw new Error('Payment data not found')
      }

      setPaymentData(payments)
      setCourseData(payments.order?.course)
    } catch (error) {
      console.error('Error loading payment data:', error)
      toast.error(t('education.payment.loadError', 'فشل تحميل بيانات الدفع'))
    } finally {
      setLoading(false)
    }
  }

  const handleStartCourse = () => {
    if (courseData) {
      navigate(`/course/${courseData.id}/learn`)
    }
  }

  const handleBrowseCourses = () => {
    navigate('/courses')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl mb-2">
            {t('education.payment.success.title', 'تم الدفع بنجاح!')}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            {t('education.payment.success.subtitle', 'تهانينا! لقد تم تسجيلك في الكورس بنجاح')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  {t('education.payment.success.enrolled', 'تم التسجيل بنجاح')}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {t('education.payment.success.accessGranted', 'يمكنك الآن الوصول إلى جميع محتوى الكورس')}
                </p>
              </div>
            </div>
          </div>

          {/* Course Info */}
          {courseData && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">
                {t('education.payment.success.courseDetails', 'تفاصيل الكورس')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    {t('education.payment.success.courseName', 'اسم الكورس:')}
                  </span>
                  <span className="font-medium">{courseData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    {t('education.payment.success.instructor', 'المدرب:')}
                  </span>
                  <span className="font-medium">{courseData.instructor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    {t('education.payment.success.duration', 'المدة:')}
                  </span>
                  <span className="font-medium">{courseData.duration_hours} ساعة</span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                {t('education.payment.success.nextSteps', 'الخطوات التالية')}
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                {t('education.payment.success.startLearning', 'ابدأ في مشاهدة الدروس')}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                {t('education.payment.success.trackProgress', 'تابع تقدمك في الكورس')}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                {t('education.payment.success.earnCertificate', 'احصل على شهادة الإتمام')}
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={handleStartCourse}
              className="flex-1 gap-2"
            >
              {t('education.payment.success.startCourse', 'ابدأ الكورس')}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBrowseCourses}
              className="flex-1"
            >
              {t('education.payment.success.browseMore', 'تصفح المزيد')}
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              {t('education.payment.success.support', 'هل تحتاج إلى مساعدة؟ تواصل معنا عبر البريد الإلكتروني أو الدعم الفني')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}