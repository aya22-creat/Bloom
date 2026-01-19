import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Heart } from "lucide-react";

// Fighter Schema
const fighterSchema = z.object({
  stage: z.string().min(1, "Please select a stage"),
  surgery: z.string().min(1, "Please select an option"),
  chemotherapy: z.string().min(1, "Please select an option"),
  chemoSessions: z.string().optional(),
  radiation: z.string().min(1, "Please select an option"),
  radiationSessions: z.string().optional(),
  hormoneTherapy: z.string().min(1, "Please select an option"),
  sideEffects: z.array(z.string()).optional(),
  psychologicalState: z.string().min(1, "Please select your state"),
  supportNetwork: z.string().min(1, "Please select an option"),
  professionalSupport: z.string().min(1, "Please select an option"),
  specialDiet: z.string().min(1, "Please select an option"),
  waterIntake: z.string().min(1, "Please select an option"),
  exercise: z.string().min(1, "Please select an option"),
});

// Survivor Schema
const survivorSchema = z.object({
  lastTreatment: z.string().min(1, "Please select a timeframe"),
  regularFollowUp: z.string().min(1, "Please select an option"),
  lastExam: z.string().min(1, "Please select a timeframe"),
  currentMedication: z.string().min(1, "Please select an option"),
  worryAboutRelapse: z.string().min(1, "Please select an option"),
  psychologicalSupport: z.string().min(1, "Please select an option"),
  moodBooster: z.string().min(1, "Please select what helps you"),
  balancedDiet: z.string().min(1, "Please select an option"),
  physicalActivity: z.string().min(1, "Please select frequency"),
  sleepQuality: z.string().min(1, "Please select an option"),
});

// Wellness Schema
const wellnessSchema = z.object({
  breastChanges: z.array(z.string()).optional(),
  painOrLumps: z.string().min(1, "Please select an option"),
  familyHistory: z.string().min(1, "Please select an option"),
  selfExamFrequency: z.string().min(1, "Please select frequency"),
  lastMenstrualPeriod: z.string().optional(),
  hormonalContraception: z.string().min(1, "Please select an option"),
  chronicConditions: z.string().min(1, "Please select an option"),
  exerciseFrequency: z.string().min(1, "Please select frequency"),
  dietQuality: z.string().min(1, "Please select an option"),
  learnSelfExam: z.string().min(1, "Please select an option"),
});

type FormData = z.infer<typeof fighterSchema> | z.infer<typeof survivorSchema> | z.infer<typeof wellnessSchema>;

const HealthQuestionnaire = () => {
  const { t } = useTranslation();
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const getSchema = () => {
    switch (userType) {
      case "fighter":
        return fighterSchema;
      case "survivor":
        return survivorSchema;
      case "wellness":
        return wellnessSchema;
      default:
        return fighterSchema;
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(getSchema()),
    defaultValues: {},
  });

  const onSubmit = (data: FormData) => {
    // Calculate health risk index
    const score = calculateHealthScore(data);
    
    // Store data in localStorage (would be backend in production)
    localStorage.setItem(`hopebloom_${userType}_profile`, JSON.stringify({ ...data, score }));
    
    // Navigate to personalized dashboard
    navigate(`/dashboard/${userType}`);
  };

  const handleInvalid = (errors: Record<string, unknown>) => {
    // determine first field with error and jump to its step
    const fieldNames = Object.keys(errors || {});
    if (fieldNames.length === 0) {
      toast({ title: 'Submission failed', description: 'Please complete the form.' });
      return;
    }

    const first = fieldNames[0];
    const stepForField = (name: string) => {
      const step0 = ['stage','surgery','chemotherapy','chemoSessions','radiation','radiationSessions','hormoneTherapy'];
      const step1 = ['sideEffects'];
      const step2 = ['psychologicalState','supportNetwork','professionalSupport'];
      const step3 = ['specialDiet','waterIntake','exercise'];
      if (step0.includes(name)) return 0;
      if (step1.includes(name)) return 1;
      if (step2.includes(name)) return 2;
      if (step3.includes(name)) return 3;
      return 0;
    };

    const step = stepForField(first);
    setCurrentStep(step);
    toast({ title: 'Please complete required fields', description: `There are errors in step ${step + 1}.` });
  };

  const calculateHealthScore = (data: Record<string, unknown>): number => {
    // Simple scoring logic - can be enhanced with ML model
    let score = 70; // Base score
    
    if (userType === "fighter") {
      if (data.psychologicalState === "stable") score += 10;
      if (data.supportNetwork === "yes") score += 10;
      if (data.exercise === "yes") score += 5;
      if (data.waterIntake === "more-than-8") score += 5;
    } else if (userType === "survivor") {
      if (data.regularFollowUp === "yes") score += 15;
      if (data.worryAboutRelapse === "rarely") score += 10;
      if (data.balancedDiet === "always") score += 5;
    } else if (userType === "wellness") {
      if (data.painOrLumps === "no") score += 15;
      if (data.selfExamFrequency === "monthly") score += 10;
      if (data.exerciseFrequency === "daily") score += 5;
    }
    
    return Math.min(score, 100);
  };

  const totalSteps = userType === "fighter" ? 4 : userType === "survivor" ? 3 : 3;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const renderFighterQuestions = () => {
    const steps = [
      // Step 1: Medical Questions
      <div key="medical" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">Medical Information</h3>
        
        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.diagnosis_stage')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="stage-1">Stage I</SelectItem>
                  <SelectItem value="stage-2">Stage II</SelectItem>
                  <SelectItem value="stage-3">Stage III</SelectItem>
                  <SelectItem value="stage-4">Stage IV</SelectItem>
                  <SelectItem value="unsure">Unsure</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="surgery"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.surgery_type')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="partial">Yes - Partial mastectomy</SelectItem>
                  <SelectItem value="total">Yes - Total mastectomy</SelectItem>
                  <SelectItem value="reconstruction">Reconstruction</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chemotherapy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.chemotherapy_status')}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="chemo-yes" />
                    <Label htmlFor="chemo-yes">{t('common.yes')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="chemo-no" />
                    <Label htmlFor="chemo-no">{t('common.no')}</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("chemotherapy") === "yes" && (
          <FormField
            control={form.control}
            name="chemoSessions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('questionnaire.chemo_sessions_completed')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="radiation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.radiation_therapy')}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="radiation-yes" />
                    <Label htmlFor="radiation-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="radiation-no" />
                    <Label htmlFor="radiation-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("radiation") === "yes" && (
          <FormField
            control={form.control}
            name="radiationSessions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('questionnaire.radiation_sessions')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="hormoneTherapy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.hormone_replacement_therapy')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('questionnaire.select_option')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">{t('common.yes')}</SelectItem>
                  <SelectItem value="no">{t('common.no')}</SelectItem>
                  <SelectItem value="unsure">{t('common.unsure')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,

      // Step 2: Side Effects
      <div key="side-effects" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">{t('questionnaire.current_symptoms')}</h3>
        
        <FormField
          control={form.control}
          name="sideEffects"
          render={() => (
            <FormItem>
              <FormLabel>{t('questionnaire.side_effects')}</FormLabel>
              <div className="space-y-3">
                {["nausea", "fatigue", "appetite-loss", "skin-changes", "other"].map((effect) => (
                  <FormField
                    key={effect}
                    control={form.control}
                    name="sideEffects"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={effect}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(effect)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), effect])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== effect
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">
                            {t(`questionnaire.side_effect_${effect.replace("-", "_")}`)}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,

      // Step 3: Psychological
      <div key="psychological" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">{t('questionnaire.emotional_wellbeing')}</h3>
        
        <FormField
          control={form.control}
          name="psychologicalState"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.psychological_state')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="stable">{t('questionnaire.state_stable')}</SelectItem>
                  <SelectItem value="fluctuating">{t('questionnaire.state_fluctuating')}</SelectItem>
                  <SelectItem value="tired">{t('questionnaire.state_tired')}</SelectItem>
                  <SelectItem value="depressed">{t('questionnaire.state_depressed')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supportNetwork"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.support_network')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">{t('common.yes')}</SelectItem>
                  <SelectItem value="partially">{t('common.partially')}</SelectItem>
                  <SelectItem value="no">{t('common.no')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="professionalSupport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.professional_support')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">{t('common.yes')}</SelectItem>
                  <SelectItem value="no">{t('common.no')}</SelectItem>
                  <SelectItem value="later">{t('common.later')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,

      // Step 4: Lifestyle
      <div key="lifestyle" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">{t('questionnaire.lifestyle_nutrition')}</h3>
        
        <FormField
          control={form.control}
          name="specialDiet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Are you following a special diet during treatment?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="sometimes">Sometimes</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="waterIntake"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.water_intake')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="less-than-4">{t('questionnaire.water_less_4')}</SelectItem>
                  <SelectItem value="4-to-8">{t('questionnaire.water_4_to_8')}</SelectItem>
                  <SelectItem value="more-than-8">{t('questionnaire.water_more_8')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="exercise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.light_exercise')}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="exercise-yes" />
                    <Label htmlFor="exercise-yes">{t('common.yes')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="exercise-no" />
                    <Label htmlFor="exercise-no">{t('common.no')}</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,
    ];

    return steps[currentStep];
  };

  const renderSurvivorQuestions = () => {
    const steps = [
      // Step 1: Medical
      <div key="medical" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">{t('questionnaire.medical_followup')}</h3>
        
        <FormField
          control={form.control}
          name="lastTreatment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('questionnaire.last_treatment')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="less-6-months">Less than 6 months ago</SelectItem>
                  <SelectItem value="6-to-12-months">6 months to 1 year ago</SelectItem>
                  <SelectItem value="more-1-year">More than 1 year ago</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="regularFollowUp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you have regular follow-up appointments?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="followup-yes" />
                    <Label htmlFor="followup-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="followup-no" />
                    <Label htmlFor="followup-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastExam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>When was your last scan or examination?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="past-month">During the past month</SelectItem>
                  <SelectItem value="past-6-months">During the past 6 months</SelectItem>
                  <SelectItem value="over-year">Over a year</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currentMedication"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Are you still taking medications or supplements?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="meds-yes" />
                    <Label htmlFor="meds-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="meds-no" />
                    <Label htmlFor="meds-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,

      // Step 2: Psychological
      <div key="psychological" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">Emotional Health</h3>
        
        <FormField
          control={form.control}
          name="worryAboutRelapse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Are you worried about the disease returning?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sometimes">Sometimes</SelectItem>
                  <SelectItem value="rarely">Rarely</SelectItem>
                  <SelectItem value="often">Often</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="psychologicalSupport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you need psychological support?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="support-yes" />
                    <Label htmlFor="support-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="support-no" />
                    <Label htmlFor="support-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="moodBooster"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What helps improve your mood the most?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="meditation">Meditation</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="talking">Talking to others</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,

      // Step 3: Lifestyle
      <div key="lifestyle" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">Lifestyle & Wellness</h3>
        
        <FormField
          control={form.control}
          name="balancedDiet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you maintain a balanced diet?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="always">Yes, always</SelectItem>
                  <SelectItem value="sometimes">Sometimes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="physicalActivity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you engage in physical activity regularly?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="rarely">Rarely</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sleepQuality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you get enough sleep?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="irregular">Irregular</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,
    ];

    return steps[currentStep];
  };

  const renderWellnessQuestions = () => {
    const steps = [
      // Step 1: Health Assessment
      <div key="assessment" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">Health Assessment</h3>
        
        <FormField
          control={form.control}
          name="breastChanges"
          render={() => (
            <FormItem>
              <FormLabel>Have you experienced any changes in your breasts?</FormLabel>
              <div className="space-y-3">
                {["no-changes", "swelling", "discharge", "skin-change"].map((change) => (
                  <FormField
                    key={change}
                    control={form.control}
                    name="breastChanges"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={change}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(change)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), change])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== change
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">
                            {change.replace("-", " ")}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="painOrLumps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Have you noticed any pain or unusual lumps?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="pain-no" />
                    <Label htmlFor="pain-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="pain-yes" />
                    <Label htmlFor="pain-yes">Yes</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="familyHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you have a family history of breast cancer?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="unsure">Unsure</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selfExamFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you perform self-exams regularly?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="sometimes">Sometimes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastMenstrualPeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>When was your last menstrual period? (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,

      // Step 1: Medical History
      <div key="medical" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">{t('questionnaire.medical_history')}</h3>
        
        <FormField
          control={form.control}
          name="hormonalContraception"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you use hormonal contraception?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="contraception-yes" />
                    <Label htmlFor="contraception-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="contraception-no" />
                    <Label htmlFor="contraception-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chronicConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you have any chronic conditions?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="chronic-yes" />
                    <Label htmlFor="chronic-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="chronic-no" />
                    <Label htmlFor="chronic-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,

      // Step 3: Preventive Care
      <div key="preventive" className="space-y-6">
        <h3 className="text-2xl font-semibold text-foreground mb-4">Preventive Care</h3>
        
        <FormField
          control={form.control}
          name="exerciseFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How often do you exercise per week?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="3-times">3 times</SelectItem>
                  <SelectItem value="rarely">Rarely</SelectItem>
                  <SelectItem value="not-exercising">Not exercising</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dietQuality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is your diet like?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="healthy">Healthy and balanced</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high-fat">High in fat</SelectItem>
                  <SelectItem value="irregular">Irregular</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="learnSelfExam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Would you like to learn the steps of self-examination?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="learn-yes" />
                    <Label htmlFor="learn-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="learn-no" />
                    <Label htmlFor="learn-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>,
    ];

    return steps[currentStep];
  };

  const renderQuestions = () => {
    switch (userType) {
      case "fighter":
        return renderFighterQuestions();
      case "survivor":
        return renderSurvivorQuestions();
      case "wellness":
        return renderWellnessQuestions();
      default:
        return null;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen gradient-blush p-4 md:p-8">
      <div className="max-w-3xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('questionnaire.health_profile')}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {t('questionnaire.personalize_experience')}
          </p>
          <div className="flex justify-center mt-4">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{t('questionnaire.step')} {currentStep + 1} {t('questionnaire.of')} {totalSteps}</span>
            <span>{Math.round(progress)}% {t('questionnaire.complete')}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form */}
        <Card className="p-8 bg-white shadow-soft">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, handleInvalid)}>
              {renderQuestions()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('questionnaire.previous')}
                </Button>

                {currentStep < totalSteps - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="gap-2"
                  >
                    {t('questionnaire.next')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="gap-2">
                    {t('questionnaire.complete_profile')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default HealthQuestionnaire;
