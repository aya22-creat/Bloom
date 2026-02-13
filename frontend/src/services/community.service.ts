import { supabase } from '@/lib/supabase';
import { 
  Session, 
  News, 
  SessionFilters, 
  NewsFilters, 
  PaginatedResponse,
  Booking 
} from '@/types/community.types';

export class CommunityService {
  static async getSessions(filters: SessionFilters = {}): Promise<PaginatedResponse<Session>> {
    let query = supabase
      .from('sessions')
      .select(`
        *,
        specialist:specialists(*)
      `)
      .eq('is_active', true)
      .order('session_date', { ascending: true });

    if (filters.location) {
      query = query.eq('location', filters.location);
    }
    
    if (filters.date) {
      query = query.eq('session_date', filters.date);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      const nowStr = new Date().toISOString();
      const sample: Session[] = [
        {
          id: 'session-1',
          title: 'جلسة دعم نفسي جماعية',
          description: 'جلسة تفاعلية مع مختصين للدعم النفسي للمصابات بسرطان الثدي.',
          location: 'القاهرة',
          coordinates: { lat: 30.0444, lng: 31.2357 },
          session_date: nowStr.split('T')[0],
          session_time: '17:00:00',
          duration_minutes: 90,
          capacity: 20,
          available_spots: 12,
          booking_link: null,
          specialist_id: 'spec-1',
          images: [],
          is_active: true,
          created_at: nowStr,
          updated_at: nowStr,
          specialist: {
            id: 'spec-1',
            name: 'د. أحمد محمد',
            photo_url: null,
            specialization: 'طبيب نفسي',
            qualifications: 'دكتوراه في الطب النفسي',
            experience: '15 سنة',
            rating: 4.8,
            is_verified: true,
            created_at: nowStr,
          },
        },
      ];
      return {
        data: sample,
        total: sample.length,
        page,
        totalPages: 1,
      };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  static async getSessionById(id: string): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        specialist:specialists(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      const nowStr = new Date().toISOString();
      const sample: Session = {
        id: 'session-1',
        title: 'جلسة دعم نفسي جماعية',
        description: 'جلسة تفاعلية مع مختصين للدعم النفسي للمصابات بسرطان الثدي.',
        location: 'القاهرة',
        coordinates: { lat: 30.0444, lng: 31.2357 },
        session_date: nowStr.split('T')[0],
        session_time: '17:00:00',
        duration_minutes: 90,
        capacity: 20,
        available_spots: 12,
        booking_link: null,
        specialist_id: 'spec-1',
        images: [],
        is_active: true,
        created_at: nowStr,
        updated_at: nowStr,
        specialist: {
          id: 'spec-1',
          name: 'د. أحمد محمد',
          photo_url: null,
          specialization: 'طبيب نفسي',
          qualifications: 'دكتوراه في الطب النفسي',
          experience: '15 سنة',
          rating: 4.8,
          is_verified: true,
          created_at: nowStr,
        },
      };
      return sample;
    }

    return data;
  }

  static async getNews(filters: NewsFilters = {}): Promise<PaginatedResponse<News>> {
    const now = new Date().toISOString();
    let query = supabase
      .from('news')
      .select(`
        *,
        category:categories(*),
        author:authors(*)
      `, { count: 'exact' })
      .lte('published_at', now)
      .order('published_at', { ascending: false });

    if (filters.category) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', filters.category)
        .single();
      if (cat?.id) {
        query = query.eq('category_id', cat.id);
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      const nowStr = new Date().toISOString();
      const sample = [
        {
          id: 'sample-1',
          title: 'اكتشافات حديثة في تشخيص سرطان الثدي',
          content: [
            'ملخص لأحدث الأبحاث حول تحسين دقة التشخيص المبكر لسرطان الثدي، بما يشمل تقنيات التصوير المتقدمة والذكاء الاصطناعي في قراءة الصور.',
            'تُظهر الدراسات أن دمج تصوير الثدي ثلاثي الأبعاد مع تقنيات الذكاء الاصطناعي يساعد في تقليل الحالات الإيجابية الكاذبة ورفع دقة اكتشاف الأورام الصغيرة.',
            'كما تشير الأدلة إلى أن الفحص الدوري وفق الجدول الزمني الموصى به يزيد فرص العلاج المبكر ويُحسّن من النتائج طويلة الأمد.',
            'ينصح الخبراء بمناقشة خطة الفحص المناسبة مع الطبيب بناءً على العمر والتاريخ العائلي والعوامل الوراثية.'
          ].join('\n\n'),
          excerpt: 'أحدث الدراسات تشير إلى تحسين كبير في أدوات التشخيص...',
          image_url: null,
          category_id: 'medical-news',
          author_id: 'author-1',
          tags: ['تشخيص', 'أبحاث'],
          read_time: 4,
          published_at: nowStr,
          created_at: nowStr,
          category: { id: 'medical-news', name: 'أخبار طبية', slug: 'medical-news', color: '#FF6B6B', created_at: nowStr },
          author: { id: 'author-1', name: 'د. سارة أحمد', specialization: 'أخصائي أورام', photo_url: null, created_at: nowStr }
        },
        {
          id: 'sample-2',
          title: 'نصائح غذائية للمصابات بسرطان الثدي',
          content: [
            'نصائح عملية حول التغذية المتوازنة أثناء العلاج وبعده، مع التركيز على دعم المناعة وتقليل الآثار الجانبية.',
            'احرصي على تناول البروتينات الصحية (السمك، الدجاج، البقوليات) والخضروات الورقية والفواكه الغنية بمضادات الأكسدة.',
            'قللي من السكريات والدهون المشبعة والأطعمة المصنعة، وزيدي شرب الماء للوصول إلى هدف يومي لا يقل عن 8 أكواب.',
            'استشيري أخصائية تغذية لوضع خطة شخصية تأخذ في الاعتبار طبيعة العلاج والحالة الصحية العامة.'
          ].join('\n\n'),
          excerpt: 'إليكِ خطوات بسيطة لتحسين التغذية اليومية...',
          image_url: null,
          category_id: 'tips-guidance',
          author_id: 'author-2',
          tags: ['تغذية', 'نصائح'],
          read_time: 5,
          published_at: nowStr,
          created_at: nowStr,
          category: { id: 'tips-guidance', name: 'نصائح وإرشادات', slug: 'tips-guidance', color: '#4ECDC4', created_at: nowStr },
          author: { id: 'author-2', name: 'أ. ليلى محمود', specialization: 'تغذية علاجية', photo_url: null, created_at: nowStr }
        }
      ] as any as News[];
      return {
        data: sample,
        total: sample.length,
        page: 1,
        totalPages: 1
      };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  static async getNewsById(id: string): Promise<News> {
    // Try local custom storage first
    try {
      const raw = localStorage.getItem('hb_news_custom');
      const items: News[] = raw ? JSON.parse(raw) : [];
      const match = items.find((n) => String(n.id) === String(id));
      if (match) return match;
    } catch {}

    const { data, error } = await supabase
      .from('news')
      .select(`
        *,
        category:categories(*),
        author:authors(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      const nowStr = new Date().toISOString();
      const sample = [
        {
          id: 'sample-1',
          title: 'اكتشافات حديثة في تشخيص سرطان الثدي',
          content: 'ملخص لأحدث الأبحاث حول تحسين دقة التشخيص المبكر...',
          excerpt: 'أحدث الدراسات تشير إلى تحسين كبير في أدوات التشخيص...',
          image_url: null,
          category_id: 'medical-news',
          author_id: 'author-1',
          tags: ['تشخيص', 'أبحاث'],
          read_time: 4,
          published_at: nowStr,
          created_at: nowStr,
          category: { id: 'medical-news', name: 'أخبار طبية', slug: 'medical-news', color: '#FF6B6B', created_at: nowStr },
          author: { id: 'author-1', name: 'د. سارة أحمد', specialization: 'أخصائي أورام', photo_url: null, created_at: nowStr }
        },
        {
          id: 'sample-2',
          title: 'نصائح غذائية للمصابات بسرطان الثدي',
          content: 'نصائح عملية حول التغذية المتوازنة أثناء العلاج وبعده...',
          excerpt: 'إليكِ خطوات بسيطة لتحسين التغذية اليومية...',
          image_url: null,
          category_id: 'tips-guidance',
          author_id: 'author-2',
          tags: ['تغذية', 'نصائح'],
          read_time: 5,
          published_at: nowStr,
          created_at: nowStr,
          category: { id: 'tips-guidance', name: 'نصائح وإرشادات', slug: 'tips-guidance', color: '#4ECDC4', created_at: nowStr },
          author: { id: 'author-2', name: 'أ. ليلى محمود', specialization: 'تغذية علاجية', photo_url: null, created_at: nowStr }
        }
      ] as any as News[];
      const found = sample.find((s) => s.id === id) || sample[0];
      return found as News;
    }

    return data;
  }

  static async createBooking(sessionId: string, userEmail: string, userPhone?: string, notes?: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        session_id: sessionId,
        user_email: userEmail,
        user_phone: userPhone,
        notes: notes,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    return data;
  }

  static async getLocations(): Promise<string[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('location')
      .eq('is_active', true)
      .not('location', 'is', null);

    if (error) {
      return ['القاهرة', 'الجيزة', 'الإسكندرية'];
    }

    return [...new Set(data?.map(item => item.location) || [])];
  }

  static async getCategories(): Promise<any[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return [];
    }

    return data || [];
  }
}
