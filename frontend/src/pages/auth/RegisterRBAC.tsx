/**
 * Updated Register component with role selection
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flower2, ArrowLeft, Heart, Sparkles, Shield, Stethoscope, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth, UserRole, UserType } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient" as UserRole,
    userType: "" as UserType | "",
    language: "en" as "ar" | "en",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const roles = [
    {
      id: "patient" as UserRole,
      title: t('auth.patient'),
      subtitle: t('auth.patient_desc'),
      icon: Heart,
      gradient: "from-rose-500 to-pink-500",
    },
    {
      id: "doctor" as UserRole,
      title: t('auth.doctor'),
      subtitle: t('auth.doctor_desc'),
      icon: Stethoscope,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "admin" as UserRole,
      title: t('auth.admin'),
      subtitle: t('auth.admin_desc'),
      icon: ShieldCheck,
      gradient: "from-purple-500 to-indigo-500",
    },
  ];

  const patientTypes = [
    {
      id: "fighter" as const,
      title: t('auth.breast_cancer_fighter'),
      subtitle: t('auth.currently_in_treatment'),
      icon: Heart,
      gradient: "from-rose-500 to-pink-500",
    },
    {
      id: "survivor" as const,
      title: t('auth.survivor'),
      subtitle: t('auth.celebrating_strength'),
      icon: Sparkles,
      gradient: "from-gold to-yellow-500",
    },
    {
      id: "wellness" as const,
      title: t('auth.health_conscious_woman'),
      subtitle: t('auth.prevention_selfcare'),
      icon: Shield,
      gradient: "from-primary to-rose-400",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast({
        title: t('auth.missing_info'),
        description: t('auth.fill_all_fields'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.role === 'patient' && !formData.userType) {
      toast({
        title: t('auth.missing_info'),
        description: t('auth.select_patient_type'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('auth.password_mismatch'),
        description: t('auth.passwords_not_match'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t('auth.weak_password'),
        description: t('auth.password_min_length'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        userType: formData.role === 'patient' ? formData.userType : undefined,
        language: formData.language,
      });

      // Store user data with token
      login({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        userType: data.userType,
        approved: data.approved,
        language: data.language,
        token: data.token,
      });

      // Show appropriate message
      if (data.pending) {
        toast({
          title: t('auth.account_pending'),
          description: t('auth.doctor_approval_needed'),
        });
        navigate("/");
      } else {
        toast({
          title: t('auth.account_created'),
          description: t('auth.welcome_message'),
        });

        // Navigate based on role
        if (data.role === 'patient') {
          navigate(`/questionnaire/${data.userType}`);
        } else if (data.role === 'doctor') {
          navigate('/doctor/dashboard');
        } else if (data.role === 'admin') {
          navigate('/admin/dashboard');
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: t('auth.registration_failed'),
        description: error.response?.data?.message || t('auth.error_occurred'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-blush flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Flower2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">{t('auth.create_account')}</span>
        </div>

        <Card className="p-8 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">{t('auth.select_role')}</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole, userType: "" })}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <Label
                      key={role.id}
                      className={`cursor-pointer relative overflow-hidden rounded-lg border-2 transition-all ${
                        formData.role === role.id
                          ? 'border-primary shadow-lg scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={role.id} className="sr-only" />
                      <div className="p-6 space-y-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${role.gradient} flex items-center justify-center`}>
                          <role.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-base">{role.title}</div>
                          <div className="text-sm text-muted-foreground">{role.subtitle}</div>
                        </div>
                      </div>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Patient Type Selection (only for patients) */}
            {formData.role === 'patient' && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">{t('auth.select_patient_type')}</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => setFormData({ ...formData, userType: value as UserType })}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {patientTypes.map((type) => (
                      <Label
                        key={type.id}
                        className={`cursor-pointer relative overflow-hidden rounded-lg border-2 transition-all ${
                          formData.userType === type.id
                            ? 'border-primary shadow-lg scale-105'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={type.id} className="sr-only" />
                        <div className="p-6 space-y-3">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${type.gradient} flex items-center justify-center`}>
                            <type.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-base">{type.title}</div>
                            <div className="text-sm text-muted-foreground">{type.subtitle}</div>
                          </div>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.full_name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('auth.enter_name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('auth.enter_email')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('auth.enter_password')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirm_password')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder={t('auth.confirm_password')}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.creating') : t('auth.create_account')}
            </Button>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">{t('auth.have_account')} </span>
              <Button variant="link" onClick={() => navigate("/login")} className="p-0">
                {t('auth.sign_in')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
