import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Heart, 
  Calendar, 
  BookOpen, 
  Activity, 
  MessageCircle, 
  Apple,
  MapPin,
  Bell,
  User,
  LogOut,
  Flower2
} from "lucide-react";
import { getCurrentUser, logoutUser } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { DoctorReportButton } from "@/components/health/DoctorReportButton";

const Dashboard = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState({
    nextAppointment: 3,
    wellnessScore: 8,
    dailyGoalsCompleted: 2,
    dailyGoalsTotal: 3
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserName(user.name);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Use route param if present, otherwise fall back to stored current user
  const effectiveUserType = userType || getCurrentUser()?.userType || 'wellness';

  const handleFeatureClick = (route: string) => {
    const target = `/${route}/${effectiveUserType}`;
    console.log('Dashboard: navigating to', target);
    toast({ title: 'Navigating', description: target });
    navigate(target);
  };

  const handleProfileClick = () => {
    const target = `/profile/${effectiveUserType}`;
    console.log('Dashboard: navigating to', target);
    toast({ title: 'Navigating', description: target });
    navigate(target);
  };

  const getUserTypeInfo = (type: string) => {
    switch (type) {
      case "fighter":
        return {
          title: t('dashboard.fighter_title'),
          subtitle: t('dashboard.fighter_subtitle'),
          icon: "🎗️"
        };
      case "survivor":
        return {
          title: t('dashboard.survivor_title'),
          subtitle: t('dashboard.survivor_subtitle'),
          icon: "💝"
        };
      case "wellness":
        return {
          title: t('dashboard.wellness_title'),
          subtitle: t('dashboard.wellness_subtitle'),
          icon: "🌸"
        };
      default:
        return {
          title: t('dashboard.user_title'),
          subtitle: t('dashboard.user_subtitle'),
          icon: "👤"
        };
    }
  };

  const info = getUserTypeInfo(effectiveUserType);

  const features = [
    {
      icon: MessageCircle,
      title: t('navigation.ai_assistant'),
      description: t('dashboard.ai_assistant_desc'),
      color: "bg-rose-100 text-rose-600",
      route: "ai-assistant",
    },
    {
      icon: Calendar,
      title: t('navigation.health_tracker'),
      description: t('dashboard.health_tracker_desc'),
      color: "bg-purple-100 text-purple-600",
      route: "health-tracker",
    },
    {
      icon: Apple,
      title: t('navigation.nutrition_plan'),
      description: t('dashboard.nutrition_plan_desc'),
      color: "bg-green-100 text-green-600",
      route: "nutrition-plan",
    },
    {
      icon: Activity,
      title: t('navigation.exercise_guide'),
      description: t('dashboard.exercise_guide_desc'),
      color: "bg-blue-100 text-blue-600",
      route: "exercise-guide",
    },
    {
      icon: BookOpen,
      title: t('navigation.educational_hub'),
      description: t('dashboard.educational_hub_desc'),
      color: "bg-amber-100 text-amber-600",
      route: "educational-hub",
    },
    {
      icon: MapPin,
      title: t('navigation.medical_centers'),
      description: t('dashboard.medical_centers_desc'),
      color: "bg-indigo-100 text-indigo-600",
      route: "medical-centers",
    },
    {
      icon: Heart,
      title: t('navigation.mental_wellness'),
      description: t('dashboard.mental_wellness_desc'),
      color: "bg-pink-100 text-pink-600",
      route: "mental-wellness",
    },
    {
      icon: Bell,
      title: t('navigation.reminders'),
      description: t('dashboard.reminders_desc'),
      color: "bg-orange-100 text-orange-600",
      route: "reminders",
    },
  ];

  return (
    <div className="min-h-screen gradient-blush">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">HopeBloom</span>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleProfileClick}
            >
              <User className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                logoutUser();
                toast({
                  title: t('dashboard.logged_out'),
                  description: t('dashboard.logged_out_desc'),
                });
                navigate("/");
              }}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className={`bg-gradient-to-r ${effectiveUserType === "fighter" ? "from-rose-500 to-pink-500" : effectiveUserType === "survivor" ? "from-purple-500 to-pink-500" : effectiveUserType === "wellness" ? "from-pink-500 to-rose-500" : "from-primary to-accent"} rounded-3xl p-8 mb-8 text-white shadow-glow`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {userName ? `Welcome back, ${userName}!` : info.title}
              </h1>
              <p className="text-white/90 text-lg">{info.subtitle}</p>
            </div>
            <DoctorReportButton />
          </div>
        </div>

        {/* Quick Stats (for fighters and survivors) */}
        {(effectiveUserType === "fighter" || effectiveUserType === "survivor") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 bg-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.next_appointment')}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.nextAppointment} {t('dashboard.days')}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </Card>
            
            <Card className="p-6 bg-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.wellness_score')}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.wellnessScore}/10</p>
                </div>
                <Heart className="w-8 h-8 text-rose-500" />
              </div>
            </Card>
            
            <Card className="p-6 bg-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.daily_goals')}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.dailyGoalsCompleted}/{stats.dailyGoalsTotal}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Features Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('dashboard.your_tools_resources')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  onClick={() => handleFeatureClick(feature.route)}
                  className="p-6 bg-white shadow-soft hover:shadow-glow transition-smooth cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Daily Inspiration */}
        <Card className="mt-8 p-8 bg-white shadow-soft text-center">
          <p className="text-xl text-foreground italic mb-4">
            {t('dashboard.daily_inspiration_quote')}
          </p>
          <p className="text-sm text-muted-foreground">✨ {t('dashboard.daily_inspiration')}</p>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
