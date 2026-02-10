import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen gradient-blush flex items-center justify-center px-4" dir={user?.language === "ar" ? "rtl" : "ltr"}>
      <Card className="p-8 bg-white shadow-soft text-center max-w-lg">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Order placed!</h2>
        <p className="text-muted-foreground mb-4">
          Your order has been created and is ready for payment. We will keep you updated.
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-6">Order ID: {orderId}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(user?.userType ? `/marketplace/${user.userType}` : "/marketplace")}
            >Back to Marketplace</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </Card>
    </div>
  );
};

export default OrderSuccess;
