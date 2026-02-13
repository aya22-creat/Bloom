import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Newspaper, Heart, Users, Star, ArrowRight, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CommunityHome: React.FC = () => {
  const features = [
    {
      title: 'جلسات الدعم',
      description: 'انضم إلى جلسات الدعم المخصصة لمرضى سرطان الثدي مع متخصصين معتمدين',
      icon: Calendar,
      href: '/community/sessions',
      color: 'bg-pink-100 text-pink-600'
    },
    {
      title: 'الأخبار والمقالات',
      description: 'تابع آخر المستجدات والمعلومات الطبية الموثوقة حول سرطان الثدي',
      icon: Newspaper,
      href: '/community/news',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'المجتمع',
      description: 'تواصل مع أشخاص يمرون بتجارب مشابهة وشارك في قصص النجاح',
      icon: Users,
      href: '#',
      color: 'bg-green-100 text-green-600'
    }
  ];

  const testimonials = [
    {
      name: 'أميرة محمد',
      role: 'ناجية من سرطان الثدي',
      content: 'الجلسات الداعمة ساعدتني كثيراً في تخطي مرحلة العلاج الصعبة. أشعر بالامتنان للفريق الطبي والمتخصصين.',
      rating: 5
    },
    {
      name: 'د. سارة أحمد',
      role: 'أخصائية أورام',
      content: 'نحن نعمل على توفير أفضل الرعاية والدعم لمرضانا من خلال جلسات توعية وتثقيف مستمرة.',
      rating: 5
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-6">
          <div className="bg-pink-100 p-4 rounded-full">
            <Heart className="h-12 w-12 text-pink-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          مرحباً بك في مجتمع دعم سرطان الثدي
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          نحن هنا لنقدم لك الدعم والمعلومات والرعاية التي تحتاجينها في رحلتك مع سرطان الثدي.
          اكتشف جلسات الدعم المتاحة، اقرأ آخر الأخبار الطبية، وتواصل مع مجتمع من الأشخاص الذين يفهمون ما تمرين به.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/community/sessions">
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700">
              استكشف الجلسات
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </Link>
          <Link to="/community/news">
            <Button size="lg" variant="outline">
              اقرأ آخر الأخبار
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-right">{feature.title}</CardTitle>
              <CardDescription className="text-right">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={feature.href}>
                <Button variant="ghost" className="w-full group">
                  اكتشف المزيد
                  <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Assistant Card (styled like the provided design) */}
      <Card className="bg-white rounded-2xl border border-pink-200/70 shadow-[0_8px_24px_rgba(244,114,182,0.12)]">
        <CardContent className="p-6">
          <Link to="/ai-assistant/wellness" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-rose-600" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-gray-900">AI Assistant</div>
              <div className="text-sm text-gray-600">Chat with your AI assistant for guidance and support</div>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Community Forum Card */}
      <Card className="bg-pink-50 rounded-2xl border border-pink-200 shadow-[0_8px_24px_rgba(244,114,182,0.12)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-rose-600" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-gray-900">Community Forum</div>
              <div className="text-sm text-gray-600">Join a safe, private community of women supporting each other. Share experiences, ask questions, and find strength together.</div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Link to="/community-forum/wellness">
              <Button variant="outline" className="rounded-full bg-pink-100 text-gray-900">
                Join Community
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold mb-2">50+</div>
            <div className="text-pink-100">جلسة دعم متاحة</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">200+</div>
            <div className="text-pink-100">مقال وخبر طبي</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">1000+</div>
            <div className="text-pink-100">عضو في المجتمع</div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">قصص نجاح من مجتمعنا</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            تعرف على تجارب أعضائنا وكيف ساعدهم مجتمعنا في رحلتهم العلاجية
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-right leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-rose-100 to-pink-100 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          انضم إلى مجتمعنا اليوم
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          لا تمر بهذه الرحلة وحدك. انضم إلى مجتمعنا واستفد من الدعم والمعلومات التي نقدمها.
          معاً نحن أقوى.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/community/sessions">
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700">
              تصفح الجلسات المتاحة
            </Button>
          </Link>
          <Link to="/community/news">
            <Button size="lg" variant="outline">
              اقرأ مقالاتنا
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CommunityHome;
