import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Filter, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityService } from '@/services/community.service';
import { Session } from '@/types/community.types';

const SessionsList: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const LOC_ALIASES: Record<string, string[]> = {
    'القاهرة': ['القاهرة', 'cairo', 'al qahirah', 'alqahirah', 'القاهره'],
    'الجيزة': ['الجيزة', 'giza', 'al jizah', 'aljizah', 'الجيزه'],
    'الإسكندرية': ['الإسكندرية', 'alexandria', 'al iskandariyah', 'aliskandariyah', 'الاسكندرية', 'اسكندرية'],
  };
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const matchesLocation = (loc: string, selected: string) => {
    const l = normalize(loc);
    const s = normalize(selected);
    if (!s || s === 'all') return true;
    // direct match
    if (l === s) return true;
    // alias match
    const aliases = LOC_ALIASES[selected] || LOC_ALIASES[Object.keys(LOC_ALIASES).find(k => normalize(k) === s) || ''] || [];
    return aliases.some(a => normalize(a) === l);
  };

  useEffect(() => {
    loadSessions();
    loadLocations();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [selectedLocation, selectedDate]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await CommunityService.getSessions({
        location: selectedLocation && selectedLocation !== 'all' ? selectedLocation : undefined,
        date: selectedDate || undefined,
        page: 1,
        limit: 12
      });
      const filtered = (response.data || []).filter(s => matchesLocation(s.location || '', selectedLocation));
      setSessions(filtered);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const locationsData = await CommunityService.getLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load locations:', error);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">جلسات الدعم المتاحة</h2>
        <p className="text-gray-600">انضم إلى جلسات الدعم المخصصة لمرضى سرطان الثدي</p>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="h-5 w-5 text-pink-600" />
            <h3 className="font-semibold text-gray-900">تصفية الجلسات</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الموقع</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المحافظات</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLocation('');
                  setSelectedDate('');
                }}
                className="w-full"
              >
                مسح التصفية
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد جلسات متاحة حالياً</h3>
            <p className="text-gray-600">سيتم إضافة جلسات جديدة قريباً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-right">{session.title}</CardTitle>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                    {session.available_spots} مقاعد متاحة
                  </Badge>
                </div>
                <CardDescription className="text-right">
                  {session.specialist?.name} - {session.specialist?.specialization}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm text-right">{session.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 ml-2" />
                    <span>{formatDate(session.session_date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 ml-2" />
                    <span>{formatTime(session.session_time)} - {session.duration_minutes} دقيقة</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 ml-2" />
                    <span>{session.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 ml-2" />
                    <span>سعة الجلسة: {session.capacity} أشخاص</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Link to={`/community/sessions/${session.id}`} className="flex-1">
                    <Button className="w-full bg-pink-600 hover:bg-pink-700">
                      التفاصيل
                      <ChevronRight className="h-4 w-4 mr-2" />
                    </Button>
                  </Link>
                  {session.booking_link && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(session.booking_link, '_blank')}
                      className="flex-1"
                    >
                      حجز الآن
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsList;
