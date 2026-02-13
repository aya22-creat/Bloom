import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, DollarSign, Users, Play, Eye, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Course, CourseStatus } from '@/types/course.types';
import { supabase } from '@/lib/supabase';
import { LessonManagement } from './LessonManagement';

export const AdminCourses: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    instructor: '',
    duration: '',
    level: 'beginner',
    category: '',
    image: '',
    video_url: '',
    status: 'draft' as CourseStatus,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_fetch_courses'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('courses')
        .insert([{
          ...formData,
          instructor_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('course_created_successfully'),
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_create_course'),
        variant: "destructive",
      });
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCourse.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('course_updated_successfully'),
      });

      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_update_course'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(t('confirm_delete_course'))) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('course_deleted_successfully'),
      });

      fetchCourses();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_delete_course'),
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      instructor: '',
      duration: '',
      level: 'beginner',
      category: '',
      image: '',
      video_url: '',
      status: 'draft',
    });
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      instructor: course.instructor,
      duration: course.duration,
      level: course.level,
      category: course.category,
      image: course.image || '',
      video_url: course.video_url || '',
      status: course.status,
    });
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: CourseStatus) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('course_management')}</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('create_course')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('create_new_course')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('title')}</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('course_title')}
                  />
                </div>
                <div>
                  <Label>{t('price')}</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    placeholder={t('course_price')}
                  />
                </div>
              </div>
              
              <div>
                <Label>{t('description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('course_description')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('instructor')}</Label>
                  <Input
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder={t('instructor_name')}
                  />
                </div>
                <div>
                  <Label>{t('duration')}</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder={t('course_duration')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('level')}</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_level')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{t('beginner')}</SelectItem>
                      <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
                      <SelectItem value="advanced">{t('advanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('category')}</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder={t('course_category')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('image_url')}</Label>
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder={t('image_url')}
                  />
                </div>
                <div>
                  <Label>{t('status')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as CourseStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('draft')}</SelectItem>
                      <SelectItem value="published">{t('published')}</SelectItem>
                      <SelectItem value="archived">{t('archived')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleCreateCourse}>
                  {t('create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('courses')}</CardTitle>
          <CardDescription>{t('manage_your_courses')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder={t('search_courses')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('title')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('price')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-gray-500">{course.instructor}</div>
                      </div>
                    </TableCell>
                    <TableCell>{course.category}</TableCell>
                    <TableCell>${course.price}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(course.status)}>
                        {t(course.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(course.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCourseForLessons(course.id)}
                        >
                          <BookOpen className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('no_courses_found')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingCourse && (
        <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('edit_course')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Same form fields as create dialog */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('title')}</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('price')}</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              
              <div>
                <Label>{t('description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('instructor')}</Label>
                  <Input
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('duration')}</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('level')}</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{t('beginner')}</SelectItem>
                      <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
                      <SelectItem value="advanced">{t('advanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('category')}</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('image_url')}</Label>
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('status')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as CourseStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('draft')}</SelectItem>
                      <SelectItem value="published">{t('published')}</SelectItem>
                      <SelectItem value="archived">{t('archived')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingCourse(null)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleUpdateCourse}>
                  {t('update')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lesson Management */}
      {selectedCourseForLessons && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('lesson_management')}</h2>
            <Button
              variant="outline"
              onClick={() => setSelectedCourseForLessons(null)}
            >
              {t('back_to_courses')}
            </Button>
          </div>
          <LessonManagement courseId={selectedCourseForLessons} />
        </div>
      )}
    </div>
  );
};