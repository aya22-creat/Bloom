import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';

interface VideoItem { title: string; subtitle?: string; file: string; thumbnail?: string }

export default function ThreeDGuide() {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const defaults: VideoItem[] = [
      { title: '1- Self Exam: Visual Check', subtitle: 'Observe symmetry and skin', file: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { title: '2- Self Exam: Arm Raise', subtitle: 'Raise arms and observe', file: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    ];

    const toUrl = (f: string) => (f?.startsWith('http') ? f : `/assets/${encodeURIComponent(f)}`);

    fetch('/assets/videos.json')
      .then((r) => r.json())
      .then(async (list: VideoItem[]) => {
        const sorted = [...list].sort((a, b) => {
          const num = (s?: string) => {
            if (!s) return Number.MAX_SAFE_INTEGER;
            const m = s.match(/^\s*(\d+)/);
            return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
          };
          return Math.min(num(a.file), num(a.title)) - Math.min(num(b.file), num(b.title));
        });

        // تحقق من وجود الملفات فعلياً، وإلا استخدام الافتراضي
        const checks = await Promise.all(
          sorted.map(async (v) => {
            try {
              const res = await fetch(toUrl(v.file), { method: 'HEAD' });
              return res.ok ? v : null;
            } catch {
              return null;
            }
          })
        );
        const existing = checks.filter(Boolean) as VideoItem[];
        setVideos(existing.length > 0 ? existing : defaults);
      })
      .catch(() => setVideos(defaults));
  }, []);

  const next = () => setIdx((i) => Math.min(i + 1, Math.max(0, videos.length - 1)));
  const prev = () => setIdx((i) => Math.max(0, i - 1));

  const current = videos[idx];

  return (
    <div className="min-h-screen gradient-blush">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate(`/health-tracker/${userType || 'wellness'}`)}>رجوع</Button>
          <div />
        </div>
        <Card className="p-6 bg-white shadow-soft">
          {showIntro && (
            <>
              <h2 className="text-xl font-bold mb-3">دليل ثلاثي الأبعاد للفحص الذاتي</h2>
              <p className="text-sm text-muted-foreground mb-4">الفيديوهات التالية توضح خطوات الفحص الذاتي بشكل مبسط. المحتوى توعوي فقط ولا يغني عن الاستشارة الطبية.</p>
            </>
          )}
          {current ? (
            <div className="space-y-3">
              <div>
                <h4 className="text-lg font-semibold">{current.title}</h4>
                {current.subtitle && (
                  <p className="text-sm text-muted-foreground">{current.subtitle}</p>
                )}
              </div>
              <video
                key={current.file}
                ref={videoRef}
                src={current.file.startsWith('http') ? current.file : `/assets/${encodeURIComponent(current.file)}`}
                controls
                muted={muted}
                onPlay={() => setShowIntro(false)}
                onError={() => {
                  //Fallback إلى أول فيديو افتراضي عند فشل التحميل
                  const fallback = 'https://www.w3schools.com/html/mov_bbb.mp4';
                  if (videoRef.current) {
                    videoRef.current.src = fallback;
                  }
                }}
                className="w-full rounded-lg"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setMuted((m) => !m)}>{muted ? 'تشغيل الصوت' : 'كتم الصوت'}</Button>
                <Button className="gradient-rose text-white" onClick={prev} disabled={idx === 0}>السابق</Button>
                <Button className="gradient-rose text-white" onClick={next} disabled={idx >= videos.length - 1}>التالي</Button>
                <Button
                  variant="default"
                  onClick={() => navigate(`/exercise-coach?exercise=${encodeURIComponent(current.title || 'Self Exam')}`)}
                >
                  تشغيل التقدير الحركي (Camera)
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">أضف فيديوهات إلى مجلد assets وحدّث videos.json لعرضها هنا.</p>
          )}

          {videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              {videos.map((v, i) => (
                <button key={v.file} className="text-left" onClick={() => setIdx(i)}>
                  <Card className={`p-3 hover:shadow-md transition ${i === idx ? 'ring-2 ring-primary' : ''}`}>
                    {v.thumbnail ? (
                      <img src={v.thumbnail.startsWith('http') ? v.thumbnail : `/assets/${encodeURIComponent(v.thumbnail)}`} alt={v.title} className="w-full h-24 object-cover rounded" />
                    ) : (
                      <div className="w-full h-24 bg-muted rounded" />
                    )}
                    <div className="mt-2 text-xs font-medium">{v.title}</div>
                    {v.subtitle && (
                      <div className="text-[10px] text-muted-foreground">{v.subtitle}</div>
                    )}
                  </Card>
                </button>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
