import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Package,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';
import { AdminCourses } from './AdminCourses';
import { AdminOrders } from './AdminOrders';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    publishedCourses: 0,
    draftCourses: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch courses stats
      const { data: coursesData } = await supabase
        .from('courses')
        .select('status');

      // Fetch orders stats
      const { data: ordersData } = await supabase
        .from('orders')
        .select('status, amount');

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const publishedCourses = coursesData?.filter(c => c.status === 'published').length || 0;
      const draftCourses = coursesData?.filter(c => c.status === 'draft').length || 0;
      const totalCourses = coursesData?.length || 0;
      
      const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;
      const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0;
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData
        ?.filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.amount || 0), 0) || 0;

      setStats({
        totalCourses,
        totalOrders,
        totalRevenue,
        totalUsers: usersCount || 0,
        pendingOrders,
        completedOrders,
        publishedCourses,
        draftCourses
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin_dashboard')}</h1>
          <p className="text-gray-600">{t('manage_your_platform')}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {t('admin')}
        </Badge>
      </div>

      {/* Overview Stats */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('total_courses')}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                {stats.publishedCourses} {t('published')}, {stats.draftCourses} {t('draft')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('total_orders')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} {t('pending')}, {stats.completedOrders} {t('completed')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {t('total_earnings')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('total_users')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{t('registered_users')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:max-w-[400px]">
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="courses">{t('courses')}</TabsTrigger>
          <TabsTrigger value="orders">{t('orders')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('recent_activity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stats.pendingOrders} {t('pending_orders')}</p>
                      <p className="text-xs text-gray-500">{t('require_attention')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stats.completedOrders} {t('completed_orders')}</p>
                      <p className="text-xs text-gray-500">{t('this_month')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <Eye className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stats.publishedCourses} {t('published_courses')}</p>
                      <p className="text-xs text-gray-500">{t('available_for_sale')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('quick_actions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('courses')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t('manage_courses')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('orders')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {t('manage_orders')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    {t('manage_users')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {t('view_analytics')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('performance_summary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('order_completion_rate')}</span>
                      <span>{stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('course_publication_rate')}</span>
                      <span>{stats.totalCourses > 0 ? Math.round((stats.publishedCourses / stats.totalCourses) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${stats.totalCourses > 0 ? (stats.publishedCourses / stats.totalCourses) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <AdminCourses />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <AdminOrders />
        </TabsContent>
      </Tabs>
    </div>
  );
};