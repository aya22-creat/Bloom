import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

type VideoItem = { title: string; file: string; thumbnail?: string };

export default function ExerciseVideos() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [current, setCurrent] = useState<VideoItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [notes, setNotes] = useState('');
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetch('/assets/videos.json')
      .then((r) => r.json())
      .then((list: VideoItem[]) => {
        const sorted = [...list].sort((a, b) => {
          const parseNum = (s?: string) => {
            if (!s) return Number.MAX_SAFE_INTEGER;
            const m = s.match(/^\s*(\d+)/);
            return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
          };
          const na = Math.min(parseNum(a.file), parseNum(a.title));
          const nb = Math.min(parseNum(b.file), parseNum(b.title));
          return na - nb;
        });
        setVideos(sorted);
        setCurrent(sorted[0] || null);
        setCurrentIndex(0);
        const saved = localStorage.getItem('hb_exercise_notes');
        if (saved) setNotes(saved);
      })
      .catch(() => setVideos([]));
  }, []);

  const saveNotes = () => {
    localStorage.setItem('hb_exercise_notes', notes);
  };

  const goNext = async () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < videos.length) {
      setCurrent(videos[nextIdx]);
      setCurrentIndex(nextIdx);
      setShowControls(false);
    } else {
      if (user?.id) {
        try {
          await fetch('/api/self-exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, notes }),
          });
        } catch {}
      }
      setShowControls(false);
    }
  };

  const repeat = () => {
    setShowControls(false);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen gradient-blush">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4 md:col-span-2 bg-white shadow-soft">
            <div className="space-y-4">
              <h2 className={`text-xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('exercise_videos.title', 'فيديوهات التمارين')}</h2>
              {current ? (
                <div className="space-y-3">
                  <div className="relative">
                    <video
                    key={current.file}
                    ref={videoRef}
                    src={`/assets/${current.file}`}
                    controls
                    muted={muted}
                    className="w-full rounded-lg"
                    onEnded={() => setShowControls(true)}
                  />
                    {showControls && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3">
                        <Button className="gradient-rose text-white" onClick={goNext}>
                          {t('common.done', 'تم')}
                        </Button>
                        <Button variant="secondary" onClick={repeat}>
                          {t('exercise_videos.repeat', 'إعادة')}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setMuted((m) => !m)}>
                      {muted ? t('exercise_videos.unmute', 'تشغيل الصوت') : t('exercise_videos.mute', 'كتم الصوت')}
                    </Button>
                    {user?.userType && (
                      <Button variant="secondary" onClick={() => (window.location.hash = `#/self-assessment/${user.userType}`)}>
                        {t('exercise_videos.go_assessment', 'اذهب للفحص الذاتي')}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">{t('exercise_videos.empty', 'أضف فيديوهات إلى مجلد assets لعرضها هنا')}</p>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-soft">
            <h3 className={`text-lg font-semibold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('exercise_videos.notes_title', 'وصف الحركة / الملاحظات')}</h3>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} placeholder={t('exercise_videos.notes_ph', 'اكتب وصف الحركة أو ملاحظاتك هنا') as string} />
            <div className="mt-2 flex gap-2">
              <Button onClick={saveNotes}>{t('common.save', 'حفظ')}</Button>
            </div>
          </Card>
        </div>

        <Card className="p-4 mt-6 bg-white shadow-soft">
          <h3 className={`text-lg font-semibold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('exercise_videos.list_title', 'قائمة الفيديوهات')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {videos.map((v, idx) => (
              <button key={v.file} className="text-left" onClick={() => { setCurrent(v); setCurrentIndex(idx); setShowControls(false); }}>
                <Card className="p-3 hover:shadow-md transition">
                  {v.thumbnail ? (
                    <img src={`/assets/${v.thumbnail}`} alt={v.title} className="w-full h-32 object-cover rounded" />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded" />
                  )}
                  <div className="mt-2 text-sm font-medium">{v.title}</div>
                </Card>
              </button>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
