import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { Flower2, ArrowLeft, Heart, Sparkles, Shield, ArrowRight } from "lucide-react";
import { setCurrentUser, createUser } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "" as "fighter" | "survivor" | "wellness" | "",
    language: "en" as "ar" | "en",
  });

  const userTypes = [
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

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.userType) {
      toast({
        title: t('auth.missing_info'),
        description: t('auth.fill_all_fields'),
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('auth.password_mismatch'),
        description: t('auth.passwords_not_match'),
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t('auth.weak_password'),
        description: t('auth.password_min_length'),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
          language: formData.language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
           throw new Error(data.error || t('auth.user_exists'));
        }
        throw new Error(data.error || data.message || t('auth.error_occurred'));
      }

      // store user in app state (Node API returns id, username, email)
      const appUser = {
        id: String(data.id),
        name: data.username || data.name || formData.name,
        email: data.email,
        userType: formData.userType || 'wellness',
        createdAt: new Date().toISOString(),
        language: formData.language,
      };
      setCurrentUser(appUser as Record<string, unknown>);

      toast({
        title: t('auth.registration_successful'),
        description: t('auth.welcome_hopebloom', { name: formData.name }),
      });

      navigate(`/questionnaire/${formData.userType}`);
    } catch (error: Error | unknown) {
       console.warn("Backend API failed, trying local storage fallback...");
       try {
         const newUser = createUser({
           name: formData.name,
           email: formData.email,
           password: formData.password,
           userType: (formData.userType as "fighter" | "survivor" | "wellness") || "wellness",
           language: formData.language,
         });
         setCurrentUser(newUser);
         toast({
           title: t('auth.registration_successful'),
           description: t('auth.welcome_hopebloom', { name: formData.name }),
         });
         navigate(`/questionnaire/${formData.userType}`);
       } catch (localError: Error | unknown) {
         toast({
           title: t('auth.registration_failed'),
           description: localError.message || t('auth.error_occurred'),
           variant: "destructive",
         });
       }
    }
  };

  return (
    <div className="min-h-screen gradient-blush p-4 md:p-8">
      <LanguageSwitcher />
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Flower2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">{t('auth.create_account')}</span>
        </div>

        <Card className="p-8 bg-white shadow-soft">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('auth.join_hopebloom')}
            </h1>
            <p className="text-muted-foreground">
              {t('auth.create_account_start_journey')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">{t('auth.full_name')} *</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('auth.enter_full_name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">{t('auth.email_address')} *</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">{t('auth.password')} *</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password_min_chars')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">{t('auth.confirm_password')} *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('auth.reenter_password')}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            {/* Language Selection */}
            <div>
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('auth.preferred_language')} *
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value: "ar" | "en") => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger id="language" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('common.english')}</SelectItem>
                  <SelectItem value="ar">{t('common.arabic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Type Selection */}
            <div>
              <Label>{t('auth.i_am_a')} *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {userTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.userType === type.id;

                  return (
                    <Card
                      key={type.id}
                      onClick={() => setFormData({ ...formData, userType: type.id })}
                      className={`
                        cursor-pointer p-4 transition-smooth hover:scale-105
                        ${isSelected 
                          ? "ring-2 ring-primary shadow-glow bg-white" 
                          : "bg-white/80 hover:shadow-soft"
                        }
                      `}
                    >
                      <div className="space-y-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${type.gradient} flex items-center justify-center mx-auto`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            {type.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {type.subtitle}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="gradient-rose text-white w-full py-6 text-lg rounded-full shadow-glow hover:scale-105 transition-smooth"
            >
              {t('auth.create_account')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.already_have_account')}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary hover:underline font-medium"
                >
                  {t('auth.sign_in')}
                </button>
              </p>
            </div>
          </form>
        </Card>

        {/* Privacy Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          🔒 {t('auth.data_private_secure')}
        </p>
      </div>
    </div>
  );
};

export default Register;

