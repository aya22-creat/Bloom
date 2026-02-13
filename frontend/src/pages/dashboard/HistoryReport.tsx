import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { apiReports } from '@/lib/api';
import { FileText, ArrowLeft, Download, Calendar, Pill, Activity, ClipboardList, Printer } from 'lucide-react';

interface ReportData {
  user: { username?: string; email?: string };
  profile: any;
  symptoms: any[];
  medications: any[];
  selfExams: any[];
  healthLogs: any[];
}

const HistoryReport = () => {
  const navigate = useNavigate();
  const { userType } = useParams<{ userType: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (!user?.id) return;
        setLoading(true);
        const d = await apiReports.getDoctorReport(user.id);
        setData(d as any);
      } catch (e: any) {
        setError(e?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.id]);

  const exportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-report-${user?.username || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-blush flex items-center justify-center">
        <Card className="p-8">Loading report...</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-blush flex items-center justify-center">
        <Card className="p-8">{error}</Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-blush">
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/${userType}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <FileText className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">History Report</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={exportJson}>
              <Download className="w-4 h-4" /> Export JSON
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Patient Summary */}
        <Card className="p-6 bg-white shadow-soft">
          <h2 className="text-2xl font-bold mb-2">Patient Summary</h2>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{data?.user?.username || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{data?.user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{data?.profile?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Age</p>
              <p className="font-medium">{data?.profile?.age ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{data?.profile?.address || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Medical History</p>
              <p className="font-medium">{data?.profile?.medicalHistory || '—'}</p>
            </div>
          </div>
        </Card>

        {/* Timeline: Health Logs */}
        <Card className="p-6 bg-white shadow-soft">
          <div className="flex items-center gap-2 mb-2"><Activity className="w-5 h-5" /><h2 className="text-xl font-bold">Health Timeline</h2></div>
          <Separator className="my-4" />
          <div className="space-y-3">
            {(data?.healthLogs || []).length === 0 && <p className="text-sm text-muted-foreground">No health logs recorded.</p>}
            {(data?.healthLogs || []).map((log, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 rounded bg-muted/30">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{log.created_at || log.log_date}</span></div>
                <div className="font-medium">{log.type || log.activity_type}</div>
                <div className="text-muted-foreground">{log.value ?? log.notes}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Symptoms */}
        <Card className="p-6 bg-white shadow-soft">
          <h2 className="text-xl font-bold mb-2">Symptoms</h2>
          <Separator className="my-4" />
          <div className="space-y-2">
            {(data?.symptoms || []).length === 0 && <p className="text-sm text-muted-foreground">No symptoms logged.</p>}
            {(data?.symptoms || []).map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 rounded bg-muted/30">
                <div className="font-medium">{s.type || s.category || 'Symptom'}</div>
                <div className="text-muted-foreground">{s.notes || s.description || '—'}</div>
                <div>{s.logged_at || s.created_at}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Medications */}
        <Card className="p-6 bg-white shadow-soft">
          <div className="flex items-center gap-2 mb-2"><Pill className="w-5 h-5" /><h2 className="text-xl font-bold">Medications</h2></div>
          <Separator className="my-4" />
          <div className="space-y-2">
            {(data?.medications || []).length === 0 && <p className="text-sm text-muted-foreground">No medications saved.</p>}
            {(data?.medications || []).map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 rounded bg-muted/30">
                <div className="font-medium">{m.name}</div>
                <div className="text-muted-foreground">{(m.type || '-')}{m.type ? ' • ' : ''}{m.dosage || '-'}{m.frequency ? ` • ${m.frequency}` : ''}</div>
                <div>{m.start_date || m.created_at}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Self Exams */}
        <Card className="p-6 bg-white shadow-soft">
          <div className="flex items-center gap-2 mb-2"><ClipboardList className="w-5 h-5" /><h2 className="text-xl font-bold">Self Exams</h2></div>
          <Separator className="my-4" />
          <div className="space-y-2">
            {(data?.selfExams || []).length === 0 && <p className="text-sm text-muted-foreground">No self exams recorded.</p>}
            {(data?.selfExams || []).map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 rounded bg-muted/30">
                <div className="font-medium">{e.exam_date}</div>
                <div className="text-muted-foreground">{e.findings || e.notes || '—'}</div>
                <div>{e.created_at}</div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default HistoryReport;
