import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Send, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

const TelegramOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const BOT_USERNAME = "Hope_Bloom_bot";
  const BOT_LINK = `https://t.me/${BOT_USERNAME}`;

  useEffect(() => {
    if (!user?.id) return;

    // Start checking if user has linked Telegram
    intervalRef.current = setInterval(checkTelegramStatus, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.id]);

  const checkTelegramStatus = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/telegram/status/${user.id}`);
      const data = await response.json();

      if (data.verified) {
        setIsVerified(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        toast({
          title: "✅ Telegram Connected!",
          description: "You'll now receive reminders via Telegram",
        });
      }
    } catch (error) {
      console.error("Error checking Telegram status:", error);
    }
  };

  const handleOpenBot = () => {
    window.open(BOT_LINK, "_blank");
    setIsChecking(true);
  };

  const handleContinue = () => {
    const fromRegistration = location.state?.fromRegistration;
    
    if (fromRegistration && user?.userType) {
      navigate(`/questionnaire/${user.userType}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    toast({
      title: "Skipped Telegram Setup",
      description: "You can link your Telegram later in settings",
    });
    handleContinue();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Send className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Connect Telegram
          </h1>
          <p className="text-muted-foreground">
            Get reminders and updates directly in Telegram
          </p>
        </div>

        {/* Status */}
        {isVerified ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                Connected Successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your account is now linked with Telegram
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                How to connect:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>Click the button below to open our Telegram bot</li>
                <li>Press "START" in the bot conversation</li>
                <li>Your account will be automatically linked</li>
              </ol>
            </div>

            {/* Bot Link */}
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">@{BOT_USERNAME}</p>
                  <p className="text-sm text-muted-foreground">Hope Bloom Bot</p>
                </div>
                <Button onClick={handleOpenBot} className="gap-2">
                  Open Bot
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Checking Status */}
            {isChecking && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Waiting for connection...</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isVerified ? (
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
              size="lg"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSkip}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Skip for Now
            </Button>
          )}
        </div>

        {/* Note */}
        <p className="text-xs text-center text-muted-foreground">
          You can link Telegram later from your profile settings
        </p>
      </Card>
    </div>
  );
};

export default TelegramOnboarding;
