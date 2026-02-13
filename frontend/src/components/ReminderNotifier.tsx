import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiReminders } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

type ReminderType = 'checkup' | 'appointment' | 'water' | 'exercise';

type ReminderRow = {
  id: number;
  type: ReminderType | string;
  title?: string;
  description?: string | null;
  time?: string | null;
  date?: string | null;
  enabled?: boolean;
};

function normalizeDateTime(rem: ReminderRow): Date | null {
  const time = (rem.time || '').trim();
  if (!time) return null;

  const hasDate = Boolean(rem.date && String(rem.date).trim().length > 0);
  const dateStr = hasDate ? String(rem.date).trim() : new Date().toISOString().split('T')[0];
  const iso = `${dateStr}T${time}:00`;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function getContentKey(type: ReminderType): 'monthly_self_exam' | 'doctor_appointment' | 'drink_water' | 'daily_exercise' {
  if (type === 'water') return 'drink_water';
  if (type === 'appointment') return 'doctor_appointment';
  if (type === 'checkup') return 'monthly_self_exam';
  return 'daily_exercise';
}

export default function ReminderNotifier() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const lang = useMemo(() => (i18n.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'), [i18n.language]);
  const timeoutsRef = useRef<number[]>([]);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const canNotify = typeof window !== 'undefined' && 'Notification' in window;
    if (canNotify && (window as any).Notification?.permission === 'default') {
      (window as any).Notification.requestPermission().catch(() => {});
    }

    const clearTimers = () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const normalizeType = (t?: string): ReminderType => {
      const s = String(t || '').toLowerCase();
      if (s === 'water' || s === 'drink_water') return 'water';
      if (s === 'appointment' || s === 'medication' || s === 'doctor') return 'appointment';
      if (s === 'checkup' || s === 'self_exam' || s === 'monthly_self_exam') return 'checkup';
      return 'exercise';
    };

    const schedule = async () => {
      const list = (await apiReminders.list(user.id)) as unknown as ReminderRow[];
      const now = Date.now();
      const todayStr = new Date().toISOString().split('T')[0];

      list
        .filter((r) => r && r.enabled)
        .forEach((r) => {
          const dt = normalizeDateTime(r);
          if (!dt) return;
          const due = dt.getTime();
          const firedKey = `hb_reminder_fired_${r.id}_${todayStr}`;
          const nType = normalizeType(String(r.type));
          const doneTypeKey = `hb_reminder_done_${user?.id}_${nType}_${todayStr}`;
          if (localStorage.getItem(doneTypeKey) === '1') return;
          if (localStorage.getItem(firedKey) === '1') return;

          const fireNow = () => {
            if (localStorage.getItem(doneTypeKey) === '1') return;
            localStorage.setItem(firedKey, '1');
            const contentKey = getContentKey(nType);
            const title = t(`reminders.defaults.${contentKey}.title`);
            const description = t(`reminders.defaults.${contentKey}.desc`);
            toast({ title, description });
            const permission = canNotify ? (window as any).Notification?.permission : 'denied';
            if (canNotify && permission === 'granted') {
              const n = new (window as any).Notification(title, { body: description, lang });
              n.onclick = () => {
                if (nType === 'checkup' && user?.userType) {
                  window.location.hash = `#/self-assessment/${user.userType}`;
                } else if (nType === 'water' && user?.userType) {
                  window.location.hash = `#/reminder-action/${user.userType}/water`;
                } else if (nType === 'appointment' && user?.userType) {
                  window.location.hash = `#/reminder-action/${user.userType}/medication`;
                }
              };
            }
            if (nType === 'checkup' && user?.userType) {
              window.location.hash = `#/self-assessment/${user.userType}`;
            } else if (nType === 'water' && user?.userType) {
              window.location.hash = `#/reminder-action/${user.userType}/water`;
            } else if (nType === 'appointment' && user?.userType) {
              window.location.hash = `#/reminder-action/${user.userType}/medication`;
            }
          };

          if (due <= now) {
            fireNow();
            return;
          }

          const delay = due - now;
          const timeoutId = window.setTimeout(() => fireNow(), Math.min(delay, 2_147_000_000));
          timeoutsRef.current.push(timeoutId);
        });
    };

    schedule().catch(() => {});
    pollRef.current = window.setInterval(() => {
      schedule().catch(() => {});
    }, 120_000);

    return clearTimers;
  }, [isAuthenticated, user?.id, toast, t, lang]);

  return null;
}
