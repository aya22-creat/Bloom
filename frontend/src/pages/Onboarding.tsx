import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, Shield, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/database";

type UserType = "fighter" | "survivor" | "wellness" | null;

const Onboarding = () => {
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
      navigate(`/dashboard/${user.userType}`);
    }
  }, [navigate]);

  const userTypes = [
    {
      id: "fighter" as UserType,
      title: "Breast Cancer Fighter",
      subtitle: "Currently in treatment",
      icon: Heart,
      gradient: "from-rose-500 to-pink-500",
      description: "Get personalized support through your treatment journey",
    },
    {
      id: "survivor" as UserType,
      title: "Survivor",
      subtitle: "Celebrating your strength",
      icon: Sparkles,
      gradient: "from-gold to-yellow-500",
      description: "Continue your wellness journey with ongoing care",
    },
    {
      id: "wellness" as UserType,
      title: "Health-Conscious Woman",
      subtitle: "Prevention & self-care",
      icon: Shield,
      gradient: "from-primary to-rose-400",
      description: "Stay informed and maintain your breast health",
    },
  ];

  const handleContinue = () => {
    if (selectedType) {
      // Redirect to register if not logged in
      const user = getCurrentUser();
      if (!user) {
        navigate("/register");
      } else {
        navigate(`/questionnaire/${selectedType}`);
      }
    }
  };

  return (
    <div className="min-h-screen gradient-blush p-4 md:p-8">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to HopeBloom 🌸
          </h1>
          <p className="text-lg text-muted-foreground">
            Let's personalize your experience. How can we support you today?
          </p>
        </div>

        {/* User Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {userTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <Card
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`
                  cursor-pointer p-6 transition-smooth hover:scale-105
                  ${isSelected 
                    ? "ring-2 ring-primary shadow-glow bg-white" 
                    : "bg-white/80 hover:shadow-soft"
                  }
                `}
              >
                <div className="space-y-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {type.title}
                    </h3>
                    <p className="text-sm text-primary font-medium mb-3">
                      {type.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="pt-2">
                      <div className="w-full h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedType}
            className="gradient-rose text-white px-12 py-6 text-lg rounded-full shadow-soft hover:shadow-glow transition-smooth disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            Continue
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          🔒 Your data is private and secure. We prioritize your privacy and confidentiality.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
