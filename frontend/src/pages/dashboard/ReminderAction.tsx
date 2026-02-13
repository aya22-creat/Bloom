import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { apiReminders } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ReminderAction() {
  const { userType, type } = useParams<{ userType: string; type: 'water' | 'medication' }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const title = type === 'water' ? t('reminder_action.water_title', 'تأكيد شرب الماء') : t('reminder_action.med_title', 'تأكيد تناول الدواء');
  const desc = type === 'water' ? t('reminder_action.water_desc', 'اشرب كوب ماء الآن ثم اضغط تم') : t('reminder_action.med_desc', 'تناول الجرعة المحددة ثم اضغط تم');

  const onDone = async () => {
    if (!user?.id || !type) return;
    try {
      await apiReminders.complete({ user_id: user.id, type });
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const doneTypeKey = `hb_reminder_done_${user.id}_${type}_${todayStr}`;
        localStorage.setItem(doneTypeKey, '1');
      } catch {}
      if (type === 'water') {
        try {
          const todayKey = `nutrition_${new Date().toDateString()}`;
          const raw = localStorage.getItem(todayKey);
          const WATER_TARGET_CUPS = 8;
          const data = raw ? JSON.parse(raw) : { waterIntake: 0, calories: 0 };
          const nextWater = Math.min(Number(data.waterIntake || 0) + 1, WATER_TARGET_CUPS);
          const next = { ...data, waterIntake: nextWater, timestamp: new Date().toISOString() };
          localStorage.setItem(todayKey, JSON.stringify(next));
        } catch {}
      }
      toast({ title: t('reminder_action.done_toast', 'تم تسجيل الإكمال') });
      navigate(`/reminders/${userType}`);
    } catch (e) {
      toast({ title: t('common.error', 'خطأ'), description: t('reminder_action.error', 'تعذر التسجيل') , variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen gradient-blush">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-6 bg-white shadow-soft space-y-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{desc}</p>
          {type === 'water' ? (
            <div className="h-40 bg-cyan-100 rounded flex items-center justify-center text-cyan-700">💧</div>
          ) : (
            <div className="h-40 bg-orange-100 rounded flex items-center justify-center text-orange-700">💊</div>
          )}
          <div className="flex gap-2">
            <Button className="gradient-rose text-white" onClick={onDone}>{t('common.done', 'تم')}</Button>
            <Button variant="outline" onClick={() => navigate(`/reminders/${userType}`)}>{t('common.back', 'رجوع')}</Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
