import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompanyAnalytics } from "@/components/company/CompanyAnalytics";
import { ArrowLeft, Flower2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CompanyAnalyticsPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const companyId = params.get("companyId");
  const all = params.get("all") === "true";
  const { user } = useAuth();

  return (
    <div className="min-h-screen gradient-blush" dir={user?.language === "ar" ? "rtl" : "ltr"}>
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Flower2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">Company Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 bg-white shadow-soft">
          <CompanyAnalytics
            companyId={companyId ? Number(companyId) : undefined}
            allCompanies={all}
          />
        </Card>
      </main>
    </div>
  );
};

export default CompanyAnalyticsPage;
