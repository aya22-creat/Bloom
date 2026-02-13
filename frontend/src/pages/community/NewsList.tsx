import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag, Filter, ChevronRight, Eye, Newspaper } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CommunityService } from '@/services/community.service';
import { News, Category } from '@/types/community.types';

const NewsList: React.FC = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newReadTime, setNewReadTime] = useState<number>(5);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadNews();
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadNews(true);
  }, [selectedCategory]);

  const loadNews = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await CommunityService.getNews({
        category: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
        page: currentPage,
        limit: 9
      });
      const customRaw = localStorage.getItem('hb_news_custom');
      const customItems: News[] = customRaw ? JSON.parse(customRaw) : [];
      const merged = reset ? [...customItems, ...response.data] : [...news, ...response.data];
      setNews(merged);
      const more = currentPage < (response.totalPages || 1) && (response.data || []).length > 0;
      setHasMore(more);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await CommunityService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">الأخبار والمقالات</h2>
        <p className="text-gray-600">آخر المستجدات والمعلومات حول سرطان الثدي</p>
        <div className="mt-4 flex justify-center">
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button variant="outline">أضف خبر</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة خبر جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="العنوان" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <Input placeholder="نبذة مختصرة" value={newExcerpt} onChange={(e) => setNewExcerpt(e.target.value)} />
                <Textarea rows={6} placeholder="المحتوى الكامل" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={1} placeholder="مدة القراءة بالدقائق" value={newReadTime} onChange={(e) => setNewReadTime(Number(e.target.value || 5))} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
                  <Button onClick={() => {
                    const now = new Date().toISOString();
                    const cat = categories.find((c) => c.slug === newCategory) || null as any;
                    const item: News = {
                      id: `custom-${Date.now()}`,
                      title: newTitle || 'عنوان الخبر',
                      content: newContent || 'المحتوى...',
                      excerpt: newExcerpt || null,
                      image_url: null,
                      category_id: cat?.id || 'custom',
                      author_id: 'custom',
                      tags: [],
                      read_time: Number(newReadTime) || 5,
                      published_at: now,
                      created_at: now,
                      category: cat || undefined,
                      author: { id: 'custom', name: 'المحرر', specialization: null, photo_url: null, created_at: now }
                    } as any;
                    const raw = localStorage.getItem('hb_news_custom');
                    const items = raw ? JSON.parse(raw) : [];
                    items.unshift(item);
                    localStorage.setItem('hb_news_custom', JSON.stringify(items));
                    setNews([item, ...news]);
                    setShowAdd(false);
                    setNewTitle(''); setNewExcerpt(''); setNewContent(''); setNewCategory(''); setNewReadTime(5);
                  }}>حفظ</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="h-5 w-5 text-pink-600" />
            <h3 className="font-semibold text-gray-900">تصفية الأخبار</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التصنيفات</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory('')}
                className="w-full"
              >
                مسح التصفية
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Grid */}
      {news.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أخبار حالياً</h3>
            <p className="text-gray-600">سيتم إضافة محتوى جديد قريباً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article) => (
            <Link key={article.id} to={`/community/news/${article.id}`} className="block">
            <Card
              className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
            >
              {/* Article Image */}
              {article.image_url && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: article.category?.color || '#FFB6C1', color: 'white' }}
                  >
                    {article.category?.name}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Eye className="h-3 w-3 ml-1" />
                    <span>{article.read_time} دقائق قراءة</span>
                  </div>
                </div>
                <CardTitle className="text-lg text-right leading-tight">{article.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm text-right leading-relaxed">
                  {article.excerpt || article.content.substring(0, 350) + '...'}
                </p>

                {expandedIds[String(article.id)] && (
                  <div className="text-gray-700 text-sm text-right leading-relaxed whitespace-pre-line">
                    {article.content}
                  </div>
                )}
                
                {/* Article Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 ml-1" />
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                  {article.author && (
                    <div className="flex items-center">
                      <span>{article.author.name}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 ml-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Read More Button */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button variant="ghost" className="w-full group">
                    قراءة المزيد
                    <ChevronRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExpandedIds((prev) => ({ ...prev, [String(article.id)]: !prev[String(article.id)] }));
                    }}
                  >
                    {expandedIds[String(article.id)] ? 'إخفاء هنا' : 'عرض هنا'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && news.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setLoadingMore(true);
                setPage((p) => p + 1);
                await loadNews(false);
              } finally {
                setLoadingMore(false);
              }
            }}
            disabled={loadingMore}
            className="min-w-[180px]"
          >
            {loadingMore ? 'جارِ التحميل...' : 'عرض المزيد'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsList;
