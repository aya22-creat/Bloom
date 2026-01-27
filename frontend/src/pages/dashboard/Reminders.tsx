import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  Calendar, 
  Droplet, 
  Activity, 
  Heart,
  ArrowLeft,
  ArrowRight,
  Flower2,
  User as UserIcon,
  LogOut,
  Plus,
  Trash2,
  Clock
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/database";

type ReminderType = "checkup" | "appointment" | "water" | "exercise";
type ReminderDay = "monday" | "wednesday" | "friday";
type ReminderInterval = "every_2_hours";

interface Reminder {
  id: number;
  type: ReminderType;
  contentKey: "monthly_self_exam" | "doctor_appointment" | "drink_water" | "daily_exercise";
  time: string;
  enabled: boolean;
  date?: string;
  days?: ReminderDay[];
  interval?: ReminderInterval;
}

const Reminders = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.dir() === "rtl";

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 1,
      type: "checkup",
      contentKey: "monthly_self_exam",
      time: "09:00",
      days: ["monday"],
      enabled: true,
    },
    {
      id: 2,
      type: "appointment",
      contentKey: "doctor_appointment",
      date: "2024-03-15",
      time: "14:00",
      enabled: true,
    },
    {
      id: 3,
      type: "water",
      contentKey: "drink_water",
      time: "10:00",
      interval: "every_2_hours",
      enabled: true,
    },
    {
      id: 4,
      type: "exercise",
      contentKey: "daily_exercise",
      time: "18:00",
      days: ["monday", "wednesday", "friday"],
      enabled: false,
    },
  ]);

  const [dailyQuotes, setDailyQuotes] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const savedReminders = localStorage.getItem(`bloom_reminders_${user.id}`);
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
    }
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      localStorage.setItem(`bloom_reminders_${user.id}`, JSON.stringify(reminders));
    }
  }, [reminders]);

  const toggleReminder = (id: number) => {
    const target = reminders.find((r) => r.id === id);
    const toggledOn = target ? !target.enabled : true;
    const title = target ? t(`reminders.defaults.${target.contentKey}.title`) : "";
    setReminders(reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    toast({
      title: toggledOn ? t("reminders.toast_enabled_title") : t("reminders.toast_disabled_title"),
      description: toggledOn
        ? t("reminders.toast_enabled_desc", { title })
        : t("reminders.toast_disabled_desc", { title }),
    });
  };

  const deleteReminder = (id: number) => {
    const target = reminders.find((r) => r.id === id);
    const title = target ? t(`reminders.defaults.${target.contentKey}.title`) : "";
    setReminders(reminders.filter(r => r.id !== id));
    toast({
      title: t("reminders.toast_deleted_title"),
      description: t("reminders.toast_deleted_desc", { title }),
    });
  };

  return (
    <div className="min-h-screen gradient-blush">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/${userType}`)}
            >
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className={cn("text-xl font-bold text-foreground", isRTL ? "text-right" : "text-left")}>{t("reminders.page_title")}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <UserIcon className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <Card className="p-6 bg-white shadow-soft">
            <div className="space-y-4 mb-4">
              <h2 className={cn("text-2xl font-bold text-foreground flex items-center gap-2", isRTL ? "text-right" : "text-left")}>
                <Bell className="w-6 h-6 text-primary" />
                {t("reminders.header_title")}
              </h2>
              <p className={cn("text-muted-foreground", isRTL ? "text-right" : "text-left")}> 
                {t("reminders.header_desc")}
              </p>
            </div>
          </Card>

          {/* Active Reminders */}
          <Card className="p-6 bg-white shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className={cn("text-xl font-semibold text-foreground", isRTL ? "text-right" : "text-left")}>{t("reminders.your_reminders")}</h3>
              <Button className="gradient-rose text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t("reminders.add_reminder")}
              </Button>
            </div>

            <div className="space-y-4">
              {reminders.length === 0 && (
                <Card className="p-6 bg-white/60">
                  <div className="text-center space-y-2">
                    <Bell className="w-8 h-8 mx-auto text-primary" />
                    <h4 className="text-lg font-semibold text-foreground">{t("reminders.empty_title")}</h4>
                    <p className="text-sm text-muted-foreground">{t("reminders.empty_desc")}</p>
                    <Button className="mt-2 gradient-rose text-white" onClick={() => setReminders([
                      {
                        id: Date.now(),
                        type: "checkup",
                        contentKey: "monthly_self_exam",
                        time: "09:00",
                        days: ["monday"],
                        enabled: true,
                      },
                    ])}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t("reminders.empty_cta")}
                    </Button>
                  </div>
                </Card>
              )}
              {reminders.map((reminder) => {
                const Icon = 
                  reminder.type === "checkup" ? Heart :
                  reminder.type === "appointment" ? Calendar :
                  reminder.type === "water" ? Droplet :
                  Activity;

                const colorClass = 
                  reminder.type === "checkup" ? "bg-rose-100 text-rose-600" :
                  reminder.type === "appointment" ? "bg-blue-100 text-blue-600" :
                  reminder.type === "water" ? "bg-cyan-100 text-cyan-600" :
                  "bg-green-100 text-green-600";

                const title = t(`reminders.defaults.${reminder.contentKey}.title`);
                const description = t(`reminders.defaults.${reminder.contentKey}.desc`);

                return (
                  <Card key={reminder.id} className="p-4 bg-white shadow-soft">
                    <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
                      <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className={cn("flex items-start justify-between mb-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <div>
                            <h4 className={cn("font-semibold text-foreground", isRTL ? "text-right" : "text-left")}>{title}</h4>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? "text-right" : "text-left")}>{description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={reminder.enabled}
                              onCheckedChange={() => toggleReminder(reminder.id)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteReminder(reminder.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {reminder.time}
                          </span>
                          {reminder.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {reminder.date}
                            </span>
                          )}
                          {reminder.days && (
                            <span>{
                              reminder.days
                                .map((d) => t(`reminders.days.${d}`))
                                .join(i18n.dir() === "rtl" ? "، " : ", ")
                            }</span>
                          )}
                          {reminder.interval && (
                            <span>{t(`reminders.interval.${reminder.interval}`)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6 bg-white shadow-soft">
            <h3 className="text-xl font-semibold text-foreground mb-6">{t("reminders.notification_settings")}</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-quotes" className="text-base font-medium text-foreground">
                    {t("reminders.daily_quotes")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("reminders.daily_quotes_desc")}
                  </p>
                </div>
                <Switch
                  id="daily-quotes"
                  checked={dailyQuotes}
                  onCheckedChange={setDailyQuotes}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="checkup-reminders" className="text-base font-medium text-foreground">
                    {t("reminders.checkup_reminders")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("reminders.checkup_reminders_desc")}
                  </p>
                </div>
                <Switch id="checkup-reminders" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="self-exam" className="text-base font-medium text-foreground">
                    {t("reminders.self_exam_reminders")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("reminders.self_exam_reminders_desc")}
                  </p>
                </div>
                <Switch id="self-exam" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="water-reminders" className="text-base font-medium text-foreground">
                    {t("reminders.water_reminders")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("reminders.water_reminders_desc")}
                  </p>
                </div>
                <Switch id="water-reminders" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="exercise-reminders" className="text-base font-medium text-foreground">
                    {t("reminders.exercise_reminders")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("reminders.exercise_reminders_desc")}
                  </p>
                </div>
                <Switch id="exercise-reminders" defaultChecked />
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reminders.stats.active")}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {reminders.filter(r => r.enabled).length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-primary" />
              </div>
            </Card>
            
            <Card className="p-4 bg-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reminders.stats.upcoming")}</p>
                  <p className="text-2xl font-bold text-foreground">3</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4 bg-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reminders.stats.completion")}</p>
                  <p className="text-2xl font-bold text-foreground">92%</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reminders;

