import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, User, Star, Phone, Mail, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CommunityService } from '@/services/community.service';
import { Session } from '@/types/community.types';
import { toast } from '@/components/ui/use-toast';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionData = await CommunityService.getSessionById(id!);
      setSession(sessionData);
    } catch (error) {
      console.error('Failed to load session:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل تفاصيل الجلسة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!bookingEmail.trim()) {
      toast({
        title: 'تنبيه',
        description: 'يرجى إدخال البريد الإلكتروني للحجز',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsBooking(true);
      await CommunityService.createBooking(
        session!.id,
        bookingEmail.trim(),
        bookingPhone.trim() || undefined,
        bookingNotes.trim() || undefined
      );
      
      toast({
        title: 'نجاح',
        description: 'تم تأكيد حجزك بنجاح! سيتم التواصل معك قريباً',
        variant: 'default'
      });
      
      // Reset form
      setBookingEmail('');
      setBookingPhone('');
      setBookingNotes('');
      
      // Reload session to update available spots
      await loadSession();
    } catch (error) {
      console.error('Booking failed:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إتمام الحجز. يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setIsBooking(false);
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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
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

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <Card>
          <CardContent className="p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">الجلسة غير متاحة</h2>
            <p className="text-gray-600 mb-6">عذراً، لم نتمكن من العثور على هذه الجلسة أو أنها غير متاحة حالياً.</p>
            <Link to="/community/sessions">
              <Button>العودة إلى قائمة الجلسات</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/community" className="hover:text-pink-600">المجتمع</Link>
        <ArrowRight className="h-4 w-4" />
        <Link to="/community/sessions" className="hover:text-pink-600">الجلسات</Link>
        <ArrowRight className="h-4 w-4" />
        <span className="text-gray-900">{session.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Details */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-right mb-2">{session.title}</CardTitle>
                  <CardDescription className="text-right">
                    مع {session.specialist?.name} - {session.specialist?.specialization}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                  {session.available_spots} مقاعد متاحة
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-lg max-w-none text-right">
                <p className="text-gray-700 leading-relaxed">{session.description}</p>
              </div>

              <Separator />

              {/* Session Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="font-medium text-gray-900">التاريخ</p>
                    <p className="text-gray-600">{formatDate(session.session_date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="font-medium text-gray-900">الوقت</p>
                    <p className="text-gray-600">
                      {formatTime(session.session_time)} - {session.duration_minutes} دقيقة
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="font-medium text-gray-900">الموقع</p>
                    <p className="text-gray-600">{session.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="font-medium text-gray-900">سعة الجلسة</p>
                    <p className="text-gray-600">{session.capacity} أشخاص</p>
                  </div>
                </div>
              </div>

              {session.booking_link && (
                <>
                  <Separator />
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={() => window.open(session.booking_link, '_blank')}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      احجز الآن عبر الرابط الخارجي
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Booking Form */}
          {!session.booking_link && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>حجز الجلسة</CardTitle>
                <CardDescription>
                  املأ النموذج التالي لتأكيد حضورك في الجلسة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={bookingEmail}
                        onChange={(e) => setBookingEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف (اختياري)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات (اختياري)
                    </label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="أي ملاحظات أو أسئلة لديك..."
                    />
                  </div>
                  <Button
                    onClick={handleBooking}
                    disabled={isBooking}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    {isBooking ? 'جاري الحجز...' : 'تأكيد الحجز'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Specialist Info */}
          {session.specialist && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">عن المتخصص</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-pink-100 rounded-full flex items-center justify-center">
                    {session.specialist.photo_url ? (
                      <img
                        src={session.specialist.photo_url}
                        alt={session.specialist.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-pink-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{session.specialist.name}</h3>
                    <p className="text-sm text-gray-600">{session.specialist.specialization}</p>
                    {session.specialist.rating > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{session.specialist.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {session.specialist.qualifications && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">المؤهلات</h4>
                    <p className="text-sm text-gray-600">{session.specialist.qualifications}</p>
                  </div>
                )}
                
                {session.specialist.experience && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">الخبرة</h4>
                    <p className="text-sm text-gray-600">{session.specialist.experience}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/community/sessions" className="block">
                <Button variant="outline" className="w-full">
                  عرض جميع الجلسات
                </Button>
              </Link>
              <Link to="/community/news" className="block">
                <Button variant="outline" className="w-full">
                  قراءة الأخبار والمقالات
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;