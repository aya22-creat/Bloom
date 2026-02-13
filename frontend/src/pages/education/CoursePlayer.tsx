import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, CheckCircle, Lock, ArrowLeft, ArrowRight } from 'lucide-react'
import { CourseService } from '@/services/course.service'
import { Course, Lesson } from '@/types/course.types'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function CoursePlayer() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  useEffect(() => {
    if (id && user) {
      loadCourseData()
    }
  }, [id, user])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      
      // Load course details
      const courseData = await CourseService.getCourseById(id!)
      if (!courseData) {
        toast.error(t('education.player.courseNotFound', 'الكورس غير موجود'))
        navigate('/my-courses')
        return
      }
      setCourse(courseData)

      // Load lessons
      const lessonsData = await CourseService.getLessonsByCourseId(id!)
      setLessons(lessonsData)

      // Load enrollment data
      const enrollment = await CourseService.getUserEnrollments(user.id as any)
      const courseEnrollment = enrollment.find(e => e.course_id === id)
      
      if (courseEnrollment) {
        setProgress(courseEnrollment.progress_percentage)
        setCompletedLessons(courseEnrollment.completed_lessons || [])
        
        // Set current lesson to first uncompleted lesson or last completed one
        const firstUncompleted = lessonsData.find(lesson => 
          !courseEnrollment.completed_lessons?.includes(lesson.id)
        )
        setCurrentLesson(firstUncompleted || lessonsData[lessonsData.length - 1] || null)
      } else {
        // User not enrolled, redirect to course details
        navigate(`/courses/${id}`)
      }
    } catch (error) {
      console.error('Error loading course data:', error)
      toast.error(t('education.player.loadError', 'فشل تحميل بيانات الكورس'))
    } finally {
      setLoading(false)
    }
  }

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson)
  }

  const handleLessonComplete = async () => {
    if (!currentLesson || !course) return

    try {
      const newCompletedLessons = [...completedLessons, currentLesson.id]
      const newProgress = Math.round((newCompletedLessons.length / lessons.length) * 100)

      await CourseService.updateEnrollmentProgress(
        user.id,
        course.id,
        currentLesson.id,
        newProgress
      )

      setCompletedLessons(newCompletedLessons)
      setProgress(newProgress)

      // Auto advance to next lesson
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)
      const nextLesson = lessons[currentIndex + 1]
      
      if (nextLesson) {
        setCurrentLesson(nextLesson)
      } else {
        toast.success(t('education.player.courseCompleted', 'مبروك! لقد أكملت الكورس'))
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error)
      toast.error(t('education.player.progressError', 'فشل تحديث التقدم'))
    }
  }

  const handlePreviousLesson = () => {
    if (!currentLesson) return
    
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)
    const previousLesson = lessons[currentIndex - 1]
    
    if (previousLesson) {
      setCurrentLesson(previousLesson)
    }
  }

  const handleNextLesson = () => {
    if (!currentLesson) return
    
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)
    const nextLesson = lessons[currentIndex + 1]
    
    if (nextLesson) {
      setCurrentLesson(nextLesson)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('education.player.notFound', 'الكورس غير موجود')}
        </h1>
        <Button onClick={() => navigate('/my-courses')}>
          {t('common.back', 'الرجوع')}
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Lessons List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">
                {t('education.player.lessons', 'الدروس')} ({lessons.length})
              </CardTitle>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">
                {completedLessons.length} / {lessons.length} {t('education.player.completed', 'مكتمل')}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.includes(lesson.id)
                  const isCurrent = currentLesson.id === lesson.id
                  const isLocked = index > 0 && !completedLessons.includes(lessons[index - 1].id)

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && handleLessonSelect(lesson)}
                      disabled={isLocked}
                      className={`w-full text-right p-3 border-b last:border-b-0 flex items-center gap-3 transition-colors ${
                        isCurrent 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      } ${
                        isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : isLocked ? (
                          <Lock className="h-5 w-5 text-gray-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <h4 className="text-sm font-medium line-clamp-2">{lesson.title}</h4>
                        <p className="text-xs text-gray-500">{lesson.duration_minutes} دقيقة</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/my-courses')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('common.back', 'الرجوع')}
                </Button>
                <Badge variant="outline">
                  {t('education.player.lesson')} {lessons.findIndex(l => l.id === currentLesson.id) + 1} / {lessons.length}
                </Badge>
              </div>
              
              <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                {currentLesson.video_url ? (
                  currentLesson.video_url.includes('youtube.com') || currentLesson.video_url.includes('youtu.be') ? (
                    <iframe
                      src={currentLesson.video_url}
                      title={currentLesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                      allowFullScreen
                    />
                  ) : (
                    <video src={currentLesson.video_url} controls className="w-full h-full" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>{t('education.player.noVideo', 'لا يوجد فيديو لهذا الدرس')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lesson Content */}
              <div className="prose dark:prose-invert max-w-none mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  {t('education.player.lessonContent', 'محتوى الدرس')}
                </h3>
                <div className="text-gray-700 dark:text-gray-300">
                  {currentLesson.content || t('education.player.noContent', 'لا يوجد محتوى لهذا الدرس')}
                </div>
              </div>

              {/* Resources */}
              {currentLesson.resources && currentLesson.resources.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    {t('education.player.resources', 'الموارد')}
                  </h3>
                  <div className="space-y-2">
                    {currentLesson.resources.map((resource, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{resource.name}</span>
                        <span className="text-xs text-gray-500">({resource.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePreviousLesson}
                  disabled={lessons.findIndex(l => l.id === currentLesson.id) === 0}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  {t('education.player.previous', 'السابق')}
                </Button>

                <Button
                  onClick={handleLessonComplete}
                  disabled={completedLessons.includes(currentLesson.id)}
                  className="gap-2"
                >
                  {completedLessons.includes(currentLesson.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t('education.player.completed', 'مكتمل')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t('education.player.markComplete', 'وضع علامة مكتمل')}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleNextLesson}
                  disabled={lessons.findIndex(l => l.id === currentLesson.id) === lessons.length - 1}
                  className="gap-2"
                >
                  {t('education.player.next', 'التالي')}
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
