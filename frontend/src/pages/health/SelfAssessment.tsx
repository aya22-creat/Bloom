import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { apiAI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function SelfAssessment() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'health' | 'psych'>('health');

  interface VideoItem { title: string; subtitle?: string; file: string; thumbnail?: string }
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = videos[currentIndex] || null;
  const [muted, setMuted] = useState(true);
  const [notes, setNotes] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const send = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const resp = await apiAI.chat({ prompt: question, mode: assistantMode });
      const text = (resp as any)?.data?.text || '';
      setAnswer(text);
    } catch (e) {
      setAnswer(t('common.error', 'حدث خطأ ما'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/assets/videos.json')
      .then((r) => r.json())
      .then((list: VideoItem[]) => {
        const sorted = [...list].sort((a, b) => {
          const num = (s?: string) => {
            if (!s) return Number.MAX_SAFE_INTEGER;
            const m = s.match(/^\s*(\d+)/);
            return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
          };
        
          const na = Math.min(num(a.file), num(a.title));
          const nb = Math.min(num(b.file), num(b.title));
          return na - nb;
        });
        setVideos(sorted);
        setCurrentIndex(0);
        const saved = localStorage.getItem('hb_self_assessment_notes');
        if (saved) setNotes(saved);
      })
      .catch(() => setVideos([]));
  }, []);

  const nextVideo = () => {
    setCurrentIndex((i) => Math.min(i + 1, Math.max(0, videos.length - 1)));
  };
  const repeatVideo = () => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const recordExam = async () => {
    try {
      if (!user?.id) throw new Error('no-user');
      const today = new Date().toISOString().split('T')[0];
      const payload = { user_id: user.id, exam_date: today, findings: '', notes };
      const resp = await (await import('@/lib/api')).apiSelfExams.create(payload as any);
      toast({ title: 'تم تسجيل الفحص الذاتي', description: `رقم السجل: ${(resp as any)?.id || ''}` });
    } catch (e: any) {
      toast({ title: 'فشل تسجيل الفحص', description: e?.message || 'حاولي مرة أخرى', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen gradient-blush">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Card className="p-6 bg-white shadow-soft space-y-4">
          <h2 className="text-xl font-bold">{t('self_assessment.title', 'الفحص الذاتي (إجابات Rasa فقط)')}</h2>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} placeholder={t('self_assessment.ph', 'اكتبي سؤالك هنا (سيتم الرد من Rasa فقط)') as string} />
          <div className="flex gap-2">
            <div className="flex gap-2">
              <Button variant={assistantMode === 'health' ? 'default' : 'outline'} size="sm" onClick={() => setAssistantMode('health')}>المساعد الطبي</Button>
              <Button variant={assistantMode === 'psych' ? 'default' : 'outline'} size="sm" onClick={() => setAssistantMode('psych')}>الأخصائي النفسي</Button>
            </div>
            <Button disabled={loading} onClick={send}>{loading ? t('common.loading', 'جاري التحميل...') : t('common.submit', 'إرسال')}</Button>
          </div>
          {answer && (
            <div className="mt-4 p-4 bg-muted rounded">
              <div className="whitespace-pre-wrap text-sm">{answer}</div>
            </div>
          )}

          {/* Videos from assets inside Self-Assessment */}
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold">فيديوهات الفحص الذاتي</h3>
            {current ? (
              <div className="space-y-2">
                <div>
                  <h4 className="text-lg font-semibold">{current.title}</h4>
                  {current.subtitle && (
                    <p className="text-sm text-muted-foreground">{current.subtitle}</p>
                  )}
                </div>
                <video
                  key={current.file}
                  ref={videoRef}
                  src={`/assets/${encodeURIComponent(current.file)}`}
                  controls
                  muted={muted}
                  className="w-full rounded-lg"
                />
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setMuted((m) => !m)}>
                    {muted ? 'تشغيل الصوت' : 'كتم الصوت'}
                  </Button>
                  <Button className="gradient-rose text-white" onClick={nextVideo} disabled={currentIndex >= videos.length - 1}>
                    تم (التالي)
                  </Button>
                  <Button variant="secondary" onClick={repeatVideo}>إعادة</Button>
                  <Button variant="default" onClick={recordExam}>
                    تسجيل الفحص الذاتي اليوم
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    localStorage.setItem('hb_self_assessment_notes', e.target.value);
                  }}
                  placeholder="وصف الحركة/ملاحظاتك هنا"
                  rows={3}
                />
              </div>
            ) : (
              <p className="text-muted-foreground">أضف/حدّث videos.json داخل مجلد assets لعرض الفيديوهات هنا</p>
            )}

            {/* List */}
            {videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {videos.map((v, idx) => (
                  <button key={v.file} className="text-left" onClick={() => setCurrentIndex(idx)}>
                    <Card className="p-3 hover:shadow-md transition">
                      {v.thumbnail ? (
                        <img src={`/assets/${v.thumbnail}`} alt={v.title} className="w/full h-32 object-cover rounded" />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded" />
                      )}
                    <div className="mt-2 text-sm font-medium">{v.title}</div>
                    {v.subtitle && (
                      <div className="text-[11px] text-muted-foreground">{v.subtitle}</div>
                    )}
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
