import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckoutForm, CheckoutValues } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { useCart } from "@/contexts/CartContext";
import { apiOrders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Flower2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: CheckoutValues) => {
    if (!items.length) return;
    setIsSubmitting(true);
    try {
      const payload = {
        userId: user?.id,
        currency: items[0]?.currency || "USD",
        shipping: {
          name: values.fullName,
          phone: values.phone,
          address: values.address,
          notes: values.notes || "",
        },
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const response = await apiOrders.create(payload);
      const result = response as any;
      clearCart();
      navigate(`/order-success?orderId=${result?.orderId || ""}`);
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error?.message || "Unable to place order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <div className="min-h-screen gradient-blush flex items-center justify-center px-4">
        <Card className="p-8 bg-white shadow-soft text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Cart is empty</h2>
          <p className="text-muted-foreground mb-4">Add items before checkout.</p>
          <Button onClick={() => navigate(user?.userType ? `/marketplace/${user.userType}` : "/marketplace")}>
            Go to Marketplace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-blush" dir={user?.language === "ar" ? "rtl" : "ltr"}>
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Flower2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">Checkout</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CheckoutForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        <OrderSummary />
      </main>
    </div>
  );
};

export default CheckoutPage;
