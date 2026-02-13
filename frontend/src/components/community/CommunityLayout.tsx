import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Calendar, Newspaper, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const CommunityLayout: React.FC = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'الجلسات',
      href: '/community/sessions',
      icon: Calendar,
      pattern: /^\/community\/sessions/
    },
    {
      name: 'الأخبار والمقالات',
      href: '/community/news',
      icon: Newspaper,
      pattern: /^\/community\/news/
    }
  ];

  const isActive = (pattern: RegExp) => pattern.test(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8 text-pink-500" />
              <h1 className="text-2xl font-bold text-gray-900">مجتمع دعم سرطان الثدي</h1>
            </div>
            <nav className="flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(item.pattern)
                      ? "bg-pink-100 text-pink-700"
                      : "text-gray-600 hover:text-pink-600 hover:bg-pink-50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CommunityLayout;