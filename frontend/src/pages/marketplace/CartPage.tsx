import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/contexts/CartContext";
import { AIRecommendations } from "@/components/marketplace/AIRecommendations";
import { ArrowLeft, Flower2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

const CartPage = () => {
  const { items, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[],
    [items]
  );

  return (
    <div className="min-h-screen gradient-blush" dir={user?.language === "ar" ? "rtl" : "ltr"}>
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Your Cart</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {items.length === 0 ? (
          <Card className="p-8 bg-white shadow-soft text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Cart is empty</h2>
            <p className="text-muted-foreground mb-4">Explore the marketplace to add essentials.</p>
            <Button onClick={() => navigate(user?.userType ? `/marketplace/${user.userType}` : "/marketplace")}>
              Browse Marketplace
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  onRemove={removeItem}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>
            <div className="space-y-4">
              <CartSummary currency={items[0]?.currency || "USD"} />
              <Button className="w-full" onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}

        <AIRecommendations userType={user?.userType} categories={categories} />
      </main>
    </div>
  );
};

export default CartPage;
