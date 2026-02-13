import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flower2, ArrowLeft, Bell, User as UserIcon, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiProfile } from "@/lib/api";
import { getCurrentUser } from "@/lib/database";

const PatientHistory = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const user = getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    diagnoses: "",
    surgeries: "",
    medications: "",
    allergies: "",
    familyHistory: "",
    lifestyle: "",
    notes: "",
  });

  useEffect(() => {
    const run = async () => {
      try {
        if (!user?.id) return;
        setLoading(true);
        const profile = await apiProfile.get(user.id);
        const raw = String(profile?.medicalHistory || "");
        let parsed: any = {};
        try { parsed = JSON.parse(raw); } catch { parsed = { notes: raw }; }
        setForm({
          diagnoses: String(parsed.diagnoses || ""),
          surgeries: String(parsed.surgeries || ""),
          medications: String(parsed.medications || ""),
          allergies: String(parsed.allergies || ""),
          familyHistory: String(parsed.familyHistory || ""),
          lifestyle: String(parsed.lifestyle || ""),
          notes: String(parsed.notes || ""),
        });
      } finally { setLoading(false); }
    };
    run();
  }, [user?.id]);

  const onChange = (key: keyof typeof form, val: string) => setForm({ ...form, [key]: val });

  const save = async () => {
    if (!user?.id) return;
    try {
      const payload = { userId: user.id, medicalHistory: JSON.stringify(form) } as any;
      await apiProfile.upsert(payload);
      toast({ title: t("common.saved", "تم الحفظ"), description: t("common.saved_desc", "تم حفظ التاريخ الطبي") });
    } catch (e) {
      toast({ title: t("common.error", "خطأ"), description: t("common.save_failed", "تعذر الحفظ") , variant: "destructive" });
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen gradient-blush">
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/${userType}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Medical History</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon"><UserIcon className="w-5 h-5" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-6 bg-white shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Previous Diagnoses</Label>
              <Textarea rows={4} value={form.diagnoses} onChange={(e) => onChange("diagnoses", e.target.value)} />
            </div>
            <div>
              <Label>Surgeries</Label>
              <Textarea rows={4} value={form.surgeries} onChange={(e) => onChange("surgeries", e.target.value)} />
            </div>
            <div>
              <Label>Current Medications</Label>
              <Textarea rows={4} value={form.medications} onChange={(e) => onChange("medications", e.target.value)} />
            </div>
            <div>
              <Label>Allergies</Label>
              <Textarea rows={4} value={form.allergies} onChange={(e) => onChange("allergies", e.target.value)} />
            </div>
            <div>
              <Label>Family History</Label>
              <Textarea rows={3} value={form.familyHistory} onChange={(e) => onChange("familyHistory", e.target.value)} />
            </div>
            <div>
              <Label>Lifestyle (Nutrition/Activity/Smoking)</Label>
              <Textarea rows={3} value={form.lifestyle} onChange={(e) => onChange("lifestyle", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Additional Notes</Label>
              <Textarea rows={4} value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button className="gradient-rose text-white" onClick={save}>Save</Button>
            <Button variant="outline" onClick={printReport} className="flex items-center gap-2"><Printer className="w-4 h-4" /> Print Report</Button>
          </div>
        </Card>

        {/* Report Preview (print-friendly) */}
        <Card className="p-6 bg-white shadow-soft print:shadow-none">
          <h2 className="text-xl font-bold mb-4">Medical History Report</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div><span className="font-semibold text-foreground">Diagnoses:</span> {form.diagnoses || '—'}</div>
            <div><span className="font-semibold text-foreground">Surgeries:</span> {form.surgeries || '—'}</div>
            <div><span className="font-semibold text-foreground">Medications:</span> {form.medications || '—'}</div>
            <div><span className="font-semibold text-foreground">Allergies:</span> {form.allergies || '—'}</div>
            <div><span className="font-semibold text-foreground">Family History:</span> {form.familyHistory || '—'}</div>
            <div><span className="font-semibold text-foreground">Lifestyle:</span> {form.lifestyle || '—'}</div>
            <div><span className="font-semibold text-foreground">Notes:</span> {form.notes || '—'}</div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default PatientHistory;
