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
import { Plus, Edit, Trash2, Search, Play, Eye, MoveUp, MoveDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Lesson } from '@/types/course.types';
import { supabase } from '@/lib/supabase';

interface LessonManagementProps {
  courseId: string;
}

export const LessonManagement: React.FC<LessonManagementProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    duration: 0,
    order_index: 0,
    is_free: false,
  });

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_fetch_lessons'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const maxOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) : -1;

      const { error } = await supabase
        .from('lessons')
        .insert([{
          ...formData,
          course_id: courseId,
          order_index: maxOrderIndex + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('lesson_created_successfully'),
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchLessons();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_create_lesson'),
        variant: "destructive",
      });
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingLesson.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('lesson_updated_successfully'),
      });

      setEditingLesson(null);
      resetForm();
      fetchLessons();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_update_lesson'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm(t('confirm_delete_lesson'))) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('lesson_deleted_successfully'),
      });

      fetchLessons();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_delete_lesson'),
        variant: "destructive",
      });
    }
  };

  const moveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const targetLesson = lessons[targetIndex];

    try {
      // Update both lessons' order_index in a transaction-like manner
      await Promise.all([
        supabase
          .from('lessons')
          .update({ order_index: targetLesson.order_index })
          .eq('id', lessonId),
        supabase
          .from('lessons')
          .update({ order_index: lesson.order_index })
          .eq('id', targetLesson.id)
      ]);

      fetchLessons();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_reorder_lesson'),
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      duration: 0,
      order_index: 0,
      is_free: false,
    });
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      video_url: lesson.video_url || '',
      duration: lesson.duration,
      order_index: lesson.order_index,
      is_free: lesson.is_free,
    });
  };

  const filteredLessons = lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('lesson_management')}</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('create_lesson')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('create_new_lesson')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('title')}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('lesson_title')}
                />
              </div>
              
              <div>
                <Label>{t('description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('lesson_description')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('video_url')}</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder={t('video_url_placeholder')}
                  />
                </div>
                <div>
                  <Label>{t('duration_minutes')}</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    placeholder={t('duration_placeholder')}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                />
                <Label htmlFor="is_free">{t('free_lesson')}</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleCreateLesson}>
                  {t('create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('lessons')}</CardTitle>
          <CardDescription>{t('manage_course_lessons')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder={t('search_lessons')}
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
                  <TableHead>{t('order')}</TableHead>
                  <TableHead>{t('title')}</TableHead>
                  <TableHead>{t('duration')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson, index) => (
                  <TableRow key={lesson.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{lesson.order_index + 1}</span>
                        <div className="flex flex-col space-y-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveLesson(lesson.id, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveLesson(lesson.id, 'down')}
                            disabled={index === filteredLessons.length - 1}
                          >
                            <MoveDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{lesson.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{lesson.duration} {t('minutes')}</TableCell>
                    <TableCell>
                      <Badge variant={lesson.is_free ? 'secondary' : 'default'}>
                        {lesson.is_free ? t('free') : t('paid')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(lesson.video_url, '_blank')}
                          disabled={!lesson.video_url}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(lesson)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLesson(lesson.id)}
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

          {filteredLessons.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('no_lessons_found')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingLesson && (
        <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('edit_lesson')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('title')}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
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
                  <Label>{t('video_url')}</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('duration_minutes')}</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_free"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                />
                <Label htmlFor="edit_is_free">{t('free_lesson')}</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingLesson(null)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleUpdateLesson}>
                  {t('update')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};