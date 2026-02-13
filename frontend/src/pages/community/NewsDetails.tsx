import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Tag, Clock, ArrowRight, Eye, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CommunityService } from '@/services/community.service';
import { News } from '@/types/community.types';
import { toast } from '@/components/ui/use-toast';

const NewsDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const articleData = await CommunityService.getNewsById(id!);
      setArticle(articleData);
    } catch (error) {
      console.error('Failed to load article:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المقال',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt || article?.title,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ رابط المقال إلى الحافظة',
        variant: 'default'
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-t-lg"></div>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <Card>
          <CardContent className="p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">المقال غير متاح</h2>
            <p className="text-gray-600 mb-6">عذراً، لم نتمكن من العثور على هذا المقال أو أنه غير متاح حالياً.</p>
            <Link to="/community/news">
              <Button>العودة إلى قائمة الأخبار</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/community" className="hover:text-pink-600">المجتمع</Link>
        <ArrowRight className="h-4 w-4" />
        <Link to="/community/news" className="hover:text-pink-600">الأخبار</Link>
        <ArrowRight className="h-4 w-4" />
        <span className="text-gray-900">{article.title}</span>
      </div>

      {/* Article Header */}
      <Card className="bg-white/80 backdrop-blur-sm">
        {/* Article Image */}
        {article.image_url && (
          <div className="h-64 md:h-96 bg-gray-200 overflow-hidden rounded-t-lg">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader>
          <div className="space-y-4">
            {/* Category and Meta */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge 
                variant="secondary" 
                className="text-sm"
                style={{ backgroundColor: article.category?.color || '#FFB6C1', color: 'white' }}
              >
                {article.category?.name}
              </Badge>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 ml-1" />
                  <span>{article.read_time} دقائق قراءة</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 ml-1" />
                  <span>{formatDate(article.published_at)}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-right leading-tight">
              {article.title}
            </h1>

            {/* Author Info */}
            {article.author && (
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{article.author.name}</p>
                  {article.author.specialization && (
                    <p className="text-sm text-gray-600">{article.author.specialization}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Article Content */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="prose prose-lg max-w-none text-right">
          <div 
            className="text-gray-700 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="h-4 w-4 text-pink-600" />
              <h3 className="font-semibold text-gray-900">الوسوم</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleShare}
          className="flex items-center space-x-2"
        >
          <Share2 className="h-4 w-4" />
          <span>مشاركة</span>
        </Button>
        
        <Link to="/community/news">
          <Button className="flex items-center space-x-2">
            <span>العودة إلى الأخبار</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Related Articles */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <h3 className="text-xl font-bold text-gray-900">مقالات ذات صلة</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* روابط لمقالات ذات صلة */}
            <Link to="/community/news/sample-1" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">نصائح للتعامل مع العلاج الكيميائي</h4>
              <p className="text-sm text-gray-600 mb-2">
                دليل شامل للتعامل مع الآثار الجانبية للعلاج الكيميائي...
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 ml-1" />
                <span>5 دقائق قراءة</span>
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="group">
                  قراءة المقال
                  <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Link>

            <Link to="/community/news/sample-2" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">الدعم النفسي أثناء الرحلة العلاجية</h4>
              <p className="text-sm text-gray-600 mb-2">
                أهمية الدعم النفسي والاجتماعي لمرضى سرطان الثدي...
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 ml-1" />
                <span>7 دقائق قراءة</span>
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="group">
                  قراءة المقال
                  <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsDetails;
