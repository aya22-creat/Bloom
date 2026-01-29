import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flower2, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { apiAuth } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/dashboard/${user.userType}`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  if (!formData.email || !formData.password) {
    toast({
      title: t('auth.missing_info'),
      description: t('auth.enter_email_password'),
      variant: "destructive",
    });
    setIsLoading(false);
    return;
  }

    try {
    const data = await apiAuth.login(formData);

    // Store user data with token
    login({
      id: data.id,
      username: data.username,
      email: data.email,
      userType: data.userType || 'wellness',
      language: data.language || 'en',
      token: data.token,
    });

    toast({
      title: t('auth.welcome_back'),
      description: t('auth.greeting', { name: data.username }),
    });

    navigate(`/dashboard/${data.userType || 'wellness'}`);
  } catch (error: any) {
    console.error("Login error:", error);
    toast({
      title: t('auth.login_failed'),
      description: error.message || t('auth.invalid_credentials'),
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen gradient-blush flex items-center justify-center p-4">
      <LanguageSwitcher />
      <div className="max-w-md w-full">
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
          <span className="text-xl font-bold text-foreground">{t('auth.sign_in')}</span>
        </div>

        <Card className="p-8 bg-white shadow-soft">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('auth.welcome_back')}
            </h1>
            <p className="text-muted-foreground">
              {t('auth.sign_in_continue')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <Label htmlFor="email">{t('auth.email_address')}</Label>
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
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password_placeholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="gradient-rose text-white w-full py-6 text-lg rounded-full shadow-glow hover:scale-105 transition-smooth disabled:opacity-50"
            >
              {isLoading ? t('auth.signing_in') : t('auth.sign_in')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.no_account')}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-primary hover:underline font-medium"
                >
                  {t('auth.create_account')}
                </button>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;

