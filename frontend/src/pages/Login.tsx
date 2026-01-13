import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flower2, ArrowLeft, ArrowRight } from "lucide-react";
import { loginUser, getCurrentUser, setCurrentUser } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

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
    const response = await fetch("http://localhost:4000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || t('auth.invalid_credentials'));
    }

    // Node API returns user info (id, username, email)
    const appUser = {
      id: String(data.id),
      name: data.username || data.name || "",
      email: data.email,
      userType: data.userType || 'wellness',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(appUser as any);

    toast({
      title: t('auth.welcome_back'),
      description: t('auth.greeting', { name: data.username || data.name }),
    });

    navigate(`/dashboard/${appUser.userType}`);
  } catch (error: any) {
    console.warn("Backend API failed, trying local storage fallback...");
    // Fallback to local storage
    const localUser = loginUser(formData.email, formData.password);
    if (localUser) {
      setCurrentUser(localUser);
      toast({
        title: t('auth.welcome_back'),
        description: t('auth.greeting', { name: localUser.name }),
      });
      navigate(`/dashboard/${localUser.userType}`);
      setIsLoading(false);
      return;
    }

    toast({
      title: t('auth.login_failed'),
      description: error.message || t('auth.invalid_credentials'),
      variant: "destructive",
    });
  }

  setIsLoading(false);
};


  // Check if user is already logged in
  const currentUser = getCurrentUser();
  if (currentUser) {
    navigate(`/dashboard/${currentUser.userType}`);
    return null;
  }

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

