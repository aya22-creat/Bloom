import { Button } from "@/components/ui/button";
import { Heart, Flower2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen gradient-blush flex items-center justify-center p-4 overflow-hidden relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Flower2 className="absolute top-20 left-10 text-primary/10 w-32 h-32 animate-pulse" />
        <Heart className="absolute bottom-20 right-10 text-accent/10 w-24 h-24 animate-pulse" style={{ animationDelay: "1s" }} />
        <Sparkles className="absolute top-40 right-20 text-primary/10 w-16 h-16 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full shadow-glow flex items-center justify-center">
              <Flower2 className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold rounded-full flex items-center justify-center shadow-soft">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('welcome.title')}
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 font-medium">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Description */}
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {t('welcome.description')}
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {[
            { icon: Heart, key: "personalized_care" },
            { icon: Sparkles, key: "ai_powered_support" },
            { icon: Flower2, key: "holistic_wellness" },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-soft hover:shadow-glow transition-smooth"
            >
              <feature.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">{t(`welcome.features.${feature.key}`)}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            className="gradient-rose text-white px-12 py-6 text-lg rounded-full shadow-glow hover:scale-105 transition-smooth"
          >
            {t('welcome.buttons.create_account')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/login")}
            className="px-12 py-6 text-lg rounded-full shadow-soft hover:shadow-glow transition-smooth"
          >
            {t('welcome.buttons.sign_in')}
          </Button>
        </div>

        {/* Footer text */}
        <p className="text-sm text-muted-foreground pt-4">
          {t('welcome.footer')}
        </p>
      </div>
    </div>
  );
};

export default Welcome;
