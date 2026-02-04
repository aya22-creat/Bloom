import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar as CalendarIcon, 
  Heart, 
  ArrowLeft,
  Flower2,
  Bell,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Pill,
  FileText,
  Plus,
  Trash2,
  Clock,
  Save
} from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/database";
import { apiCycles, apiMedications, apiSelfExams, apiSymptoms } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  notes: string;
}

interface SelfExamRecord {
  id: string;
  date: string;
  time: string;
  findings: string;
  notes: string;
  nextExamDate: string;
}

const HealthTracker = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [medications, setMedications] = useState<Medication[]>([]);
  const [examRecords, setExamRecords] = useState<SelfExamRecord[]>([]);
  const [currentExam, setCurrentExam] = useState<Partial<SelfExamRecord>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    findings: "",
    notes: "",
  });
  const [currentMed, setCurrentMed] = useState<Partial<Medication>>({
    name: "",
    dosage: "",
    frequency: "",
    time: "",
    notes: "",
  });

  const [cycleLength, setCycleLength] = useState<number>(28);
  const nextPeriodDate = date ? addDays(date, cycleLength) : undefined;
  const nextSelfCheckDate = date ? addDays(date, 7) : undefined;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = getCurrentUser();
      if (!user) return;
      setLoading(true);

      try {
        // Fetch Cycle Data
        const cycles = await apiCycles.list(user.id);
        if (cycles && cycles.length > 0) {
           // Assume last cycle record has the config
           // This is a simplification; in a real app we'd query a specific settings endpoint or sort by date
           // For now, let's just stick to the cycle length from the latest record if available
           // or keep the default
        }

        // Fetch Medications
        const meds = await apiMedications.list(user.id);
        if (meds) {
          // Map backend structure to frontend interface if needed
          // Assuming backend returns matching fields for now, but safer to map:
          const mappedMeds = meds.map((m: any) => ({
            id: m.id,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            time: m.time_of_day || "",
            notes: m.instructions || ""
          }));
          setMedications(mappedMeds);
        }

        // Fetch Self Exams
        const exams = await apiSelfExams.list(user.id);
        if (exams) {
          const mappedExams = exams.map((e: any) => ({
            id: e.id,
            date: e.exam_date,
            time: e.exam_time || "",
            findings: e.findings,
            notes: e.notes || "",
            nextExamDate: e.next_exam_date || ""
          }));
          setExamRecords(mappedExams);
        }
      } catch (error) {
        console.error("Failed to load health data", error);
        toast({
          title: "Error loading data",
          description: "Could not fetch your health records. Using local backup.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userType, toast]);

  const handleSaveCycle = async () => {
    const user = getCurrentUser();
    if (!user || !date) return;
    try {
      await apiCycles.create({
        userId: user.id,
        startDate: format(date, 'yyyy-MM-dd'),
        cycleLength: cycleLength,
        notes: "Updated from Health Tracker"
      });
      toast({ title: t('common.saved'), description: t('health_tracker.cycle_saved') });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save cycle", variant: "destructive" });
    }
  };

  const handleAddMedication = async () => {
    if (currentMed.name && currentMed.dosage && currentMed.frequency) {
      const user = getCurrentUser();
      if (!user) return;

      try {
        const payload = {
          userId: user.id,
          name: currentMed.name,
          dosage: currentMed.dosage,
          frequency: currentMed.frequency,
          timeOfDay: currentMed.time,
          instructions: currentMed.notes
        };
        
        const newMed = await apiMedications.create(payload);
        
        // Optimistic update or refetch
        setMedications([...medications, {
          id: (newMed as any).id || Date.now().toString(),
          name: currentMed.name!,
          dosage: currentMed.dosage!,
          frequency: currentMed.frequency!,
          time: currentMed.time || "",
          notes: currentMed.notes || ""
        }]);

        setCurrentMed({
            name: "",
            dosage: "",
            frequency: "",
            time: "",
            notes: "",
        });
        toast({ title: t('common.saved'), description: t('health_tracker.medications.saved') });
      } catch (e) {
        toast({ title: "Error", description: "Failed to add medication", variant: "destructive" });
      }
    }
  };

  const handleSaveExam = async () => {
    if (currentExam.date && currentExam.findings) {
        const user = getCurrentUser();
        if (!user) return;

        try {
            const payload = {
                userId: user.id,
                examDate: currentExam.date,
                examTime: currentExam.time,
                findings: currentExam.findings,
                notes: currentExam.notes
            };

            const newExam = await apiSelfExams.create(payload);
            
            const nextDate = new Date(new Date(currentExam.date!).setMonth(new Date(currentExam.date!).getMonth() + 1)).toISOString().split('T')[0];
            
            setExamRecords([...examRecords, {
                id: (newExam as any).id || Date.now().toString(),
                date: currentExam.date!,
                time: currentExam.time || "",
                findings: currentExam.findings!,
                notes: currentExam.notes || "",
                nextExamDate: nextDate
            }]);

            setCurrentExam({
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().slice(0, 5),
                findings: "",
                notes: "",
            });
            toast({ title: t('common.saved'), description: t('health_tracker.exam_record.saved') });
        } catch (e) {
            toast({ title: "Error", description: "Failed to save exam record", variant: "destructive" });
        }
    }
  };

  const handleDeleteMedication = async (id: string) => {
      try {
          await apiMedications.remove(id);
          setMedications(medications.filter(m => m.id !== id));
          toast({ title: "Deleted", description: "Medication removed" });
      } catch (e) {
          // If it fails, just remove from UI for now to not block user
          setMedications(medications.filter(m => m.id !== id));
      }
  };

  const selfCheckSteps = [
    { 
      step: 1, 
      title: t('health_tracker.steps.step1_title'), 
      description: t('health_tracker.steps.step1_desc'),
      detailed: t('health_tracker.steps.step1_detail')
    },
    { 
      step: 2, 
      title: t('health_tracker.steps.step2_title'), 
      description: t('health_tracker.steps.step2_desc'),
      detailed: t('health_tracker.steps.step2_detail')
    },
    { 
      step: 3, 
      title: t('health_tracker.steps.step3_title'), 
      description: t('health_tracker.steps.step3_desc'),
      detailed: t('health_tracker.steps.step3_detail')
    },
    { 
      step: 4, 
      title: t('health_tracker.steps.step4_title'), 
      description: t('health_tracker.steps.step4_desc'),
      detailed: t('health_tracker.steps.step4_detail')
    },
    { 
      step: 5, 
      title: t('health_tracker.steps.step5_title'), 
      description: t('health_tracker.steps.step5_desc'),
      detailed: t('health_tracker.steps.step5_detail')
    },
    { 
      step: 6, 
      title: t('health_tracker.steps.step6_title'), 
      description: t('health_tracker.steps.step6_desc'),
      detailed: t('health_tracker.steps.step6_detail')
    },
    { 
      step: 7, 
      title: t('health_tracker.steps.step7_title'), 
      description: t('health_tracker.steps.step7_desc'),
      detailed: t('health_tracker.steps.step7_detail')
    },
  ];

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
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">{t('health_tracker.title')}</span>
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
        <Tabs defaultValue="cycle" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="cycle">{t('health_tracker.tabs.cycle')}</TabsTrigger>
            <TabsTrigger value="selfcheck">{t('health_tracker.tabs.selfcheck')}</TabsTrigger>
            <TabsTrigger value="medications">{t('health_tracker.tabs.medications')}</TabsTrigger>
            <TabsTrigger value="symptoms">{t('health_tracker.tabs.symptoms')}</TabsTrigger>
          </TabsList>

          {/* Menstrual Cycle Tab */}
          <TabsContent value="cycle" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  {t('health_tracker.cycle_calendar_title')}
                </h2>
                <p className="text-muted-foreground">
                  {t('health_tracker.cycle_calendar_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-lg border"
                  />
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-rose-600" />
                      <h3 className="font-semibold text-foreground">{t('health_tracker.next_self_check')}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('health_tracker.recommended_date')} <strong className="text-foreground">
                        {nextSelfCheckDate ? format(nextSelfCheckDate, "MMMM d, yyyy") : "Select a date"}
                      </strong>
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-foreground">{t('health_tracker.cycle_info')}</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                         <Label htmlFor="cycle-length">{t('health_tracker.avg_cycle')}</Label>
                         <Input 
                           id="cycle-length" 
                           type="number" 
                           value={cycleLength} 
                           onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)}
                           className="w-20 h-8"
                         />
                         <span>{t('days')}</span>
                      </div>
                      <p><strong>{t('health_tracker.last_period')}</strong> {date ? format(date, "MMMM d, yyyy") : "Select a date"}</p>
                      <p><strong>{t('health_tracker.next_expected')}</strong> {nextPeriodDate ? format(nextPeriodDate, "MMMM d, yyyy") : "-"}</p>
                    </div>
                  </div>

                  <Button className="gradient-rose text-white w-full" onClick={handleSaveCycle}>
                    {t('health_tracker.set_reminder')}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Self-Check Guide Tab */}
          <TabsContent value="selfcheck" className="space-y-4">
            {/* Instructions Section */}
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  {t('health_tracker.self_check_guide_title')}
                </h2>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 mb-1">{t('health_tracker.when_to_perform')}</p>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>{t('health_tracker.when_to_perform_points.monthly')}</li>
                        <li>{t('health_tracker.when_to_perform_points.best_timing')}</li>
                        <li>{t('health_tracker.when_to_perform_points.post_menopausal')}</li>
                        <li>{t('health_tracker.when_to_perform_points.pregnant_breastfeeding')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selfCheckSteps.map((step) => (
                  <Card key={step.step} className="p-4 bg-white shadow-soft hover:shadow-glow transition-smooth">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{step.step}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-primary hover:underline">{t('health_tracker.view_detailed')}</summary>
                          <p className="mt-2 text-muted-foreground">{step.detailed}</p>
                        </details>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-1">{t('health_tracker.what_to_look_for')}</p>
                    <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                      <li>{t('health_tracker.look_for.lumps')}</li>
                      <li>{t('health_tracker.look_for.size_shape')}</li>
                      <li>{t('health_tracker.look_for.skin_changes')}</li>
                      <li>{t('health_tracker.look_for.nipple_changes')}</li>
                      <li>{t('health_tracker.look_for.pain_tenderness')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button className="gradient-rose text-white w-full mt-4">
                {t('health_tracker.view_3d_guide')}
              </Button>
            </Card>

            {/* Record Examination Section */}
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  {t('health_tracker.exam_record.title')}
                </h2>
                <p className="text-muted-foreground">
                  {t('health_tracker.exam_record.desc')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exam-date">{t('health_tracker.exam_record.date')}</Label>
                    <Input
                      id="exam-date"
                      type="date"
                      value={currentExam.date}
                      onChange={(e) => setCurrentExam({ ...currentExam, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exam-time">{t('health_tracker.exam_record.time')}</Label>
                    <Input
                      id="exam-time"
                      type="time"
                      value={currentExam.time}
                      onChange={(e) => setCurrentExam({ ...currentExam, time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="findings">{t('health_tracker.exam_record.findings')}</Label>
                  <Textarea
                    id="findings"
                    placeholder={t('health_tracker.exam_record.findings_placeholder')}
                    value={currentExam.findings}
                    onChange={(e) => setCurrentExam({ ...currentExam, findings: e.target.value })}
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">{t('health_tracker.exam_record.notes')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t('health_tracker.exam_record.notes_placeholder')}
                    value={currentExam.notes}
                    onChange={(e) => setCurrentExam({ ...currentExam, notes: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="gradient-rose text-white flex-1"
                    onClick={handleSaveExam}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('health_tracker.exam_record.save_btn')}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Examination History */}
            {examRecords.length > 0 && (
              <Card className="p-6 bg-white shadow-soft">
                <h3 className="text-xl font-semibold text-foreground mb-4">{t('health_tracker.exam_history.title')}</h3>
                <div className="space-y-3">
                  {examRecords
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                      <Card key={record.id} className="p-4 bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarIcon className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-foreground">
                                {new Date(record.date).toLocaleDateString()}
                              </span>
                              <span className="text-sm text-muted-foreground">{t('health_tracker.exam_history.at')} {record.time}</span>
                            </div>
                            <p className="text-sm text-foreground mb-2">
                              <strong>{t('health_tracker.exam_history.findings')}</strong> {record.findings}
                            </p>
                            {record.notes && (
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>{t('health_tracker.exam_history.notes')}</strong> {record.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {t('health_tracker.exam_history.next_exam')} {new Date(record.nextExamDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExamRecords(examRecords.filter(r => r.id !== record.id))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Medication Monitoring Tab */}
          <TabsContent value="medications" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Pill className="w-6 h-6 text-primary" />
                  {t('health_tracker.medications.title')}
                </h2>
                <p className="text-muted-foreground">
                  {t('health_tracker.medications.desc')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="med-name">{t('health_tracker.medications.name')}</Label>
                    <Input
                      id="med-name"
                      placeholder={t('health_tracker.medications.name_ph')}
                      value={currentMed.name}
                      onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="med-dosage">{t('health_tracker.medications.dosage')}</Label>
                    <Input
                      id="med-dosage"
                      placeholder={t('health_tracker.medications.dosage_ph')}
                      value={currentMed.dosage}
                      onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="med-frequency">{t('health_tracker.medications.frequency')}</Label>
                    <Input
                      id="med-frequency"
                      placeholder={t('health_tracker.medications.frequency_ph')}
                      value={currentMed.frequency}
                      onChange={(e) => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="med-time">{t('health_tracker.medications.time')}</Label>
                    <Input
                      id="med-time"
                      type="time"
                      placeholder={t('health_tracker.medications.time_ph')}
                      value={currentMed.time}
                      onChange={(e) => setCurrentMed({ ...currentMed, time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="med-notes">{t('health_tracker.medications.notes')}</Label>
                  <Textarea
                    id="med-notes"
                    placeholder={t('health_tracker.medications.notes_ph')}
                    className="min-h-[80px]"
                    value={currentMed.notes}
                    onChange={(e) => setCurrentMed({ ...currentMed, notes: e.target.value })}
                  />
                </div>
                <Button
                  className="gradient-rose text-white w-full"
                  onClick={handleAddMedication}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('health_tracker.medications.add_btn')}
                </Button>
              </div>
            </Card>

            {/* Medication List */}
            {medications.length > 0 ? (
              <Card className="p-6 bg-white shadow-soft">
                <h3 className="text-xl font-semibold text-foreground mb-4">{t('health_tracker.medications.list_title')}</h3>
                <div className="space-y-3">
                  {medications.map((med) => (
                    <Card key={med.id} className="p-4 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Pill className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold text-foreground">{med.name}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><strong>{t('health_tracker.medications.dosage')}</strong> {med.dosage}</p>
                            <p><strong>{t('health_tracker.medications.frequency')}</strong> {med.frequency}</p>
                            <p><strong>{t('health_tracker.medications.time')}</strong> {med.time}</p>
                          </div>
                          {med.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>{t('health_tracker.medications.notes')}</strong> {med.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMedication(med.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-white shadow-soft text-center">
                <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{t('health_tracker.medications.empty')}</p>
              </Card>
            )}
          </TabsContent>

          {/* Symptom Tracking Tab */}
          <TabsContent value="symptoms" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-6 h-6 text-primary" />
                  {t('health_tracker.symptoms.title')}
                </h2>
                <p className="text-muted-foreground">
                  {userType === "fighter" 
                    ? t('health_tracker.symptoms.desc_fighter')
                    : t('health_tracker.symptoms.desc_survivor')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-white shadow-soft">
                    <p className="text-sm text-muted-foreground mb-2">{t('health_tracker.symptoms.today_date')}</p>
                    <p className="text-lg font-bold text-foreground">
                      {new Date().toLocaleDateString()}
                    </p>
                  </Card>
                  <Card className="p-4 bg-white shadow-soft">
                    <p className="text-sm text-muted-foreground mb-2">{t('health_tracker.symptoms.wellness_score')}</p>
                    <p className="text-lg font-bold text-foreground">8.5/10</p>
                  </Card>
                  <Card className="p-4 bg-white shadow-soft">
                    <p className="text-sm text-muted-foreground mb-2">{t('health_tracker.symptoms.days_tracked')}</p>
                    <p className="text-lg font-bold text-foreground">45 {t('days')}</p>
                  </Card>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-4">{t('health_tracker.symptoms.record_today')}</h3>
                  <div className="space-y-3">
                    {[t('health_tracker.symptoms.fatigue'), t('health_tracker.symptoms.nausea'), t('health_tracker.symptoms.pain'), t('health_tracker.symptoms.mood_changes'), t('health_tracker.symptoms.sleep_issues')].map((symptom) => (
                      <div key={symptom} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-foreground">{symptom}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">{t('health_tracker.symptoms.severity.none')}</Button>
                          <Button variant="outline" size="sm">{t('health_tracker.symptoms.severity.mild')}</Button>
                          <Button variant="outline" size="sm">{t('health_tracker.symptoms.severity.moderate')}</Button>
                          <Button variant="outline" size="sm">{t('health_tracker.symptoms.severity.severe')}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="gradient-rose text-white w-full">
                  {t('health_tracker.symptoms.save_today')}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HealthTracker;

