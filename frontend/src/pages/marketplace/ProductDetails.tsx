import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AIRecommendations } from "@/components/marketplace/AIRecommendations";
import { apiMarketplace } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, Flower2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const formatCurrency = (value?: number, currency?: string) => {
  const amount = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
};

const ProductDetails = () => {
  const { productId, userType } = useParams<{ productId: string; userType?: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const id = Number(productId);

  const productQuery = useQuery({
    queryKey: ["marketplace-product", id],
    queryFn: () => apiMarketplace.getProduct(id),
    enabled: Number.isFinite(id),
  });

  const product = productQuery.data;

  const categories = useMemo(() => (product?.category ? [product.category] : []), [product?.category]);

  const handleAdd = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      priceCents: Math.round((product.price || 0) * 100),
      currency: product.currency || "USD",
      quantity: 1,
      vendorId: product.vendor_id,
      vendorName: product.vendor_name,
      category: product.category,
    });
  };

  return (
    <div className="min-h-screen gradient-blush" dir={user?.language === "ar" ? "rtl" : "ltr"}>
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(userType ? `/marketplace/${userType}` : "/marketplace")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Product Details</span>
          </div>
          <CartDrawer />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-6 bg-white shadow-soft">
          {product ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {product.vendor_name || "HopeBloom Verified"}
                  </p>
                </div>
                {product.category && <Badge variant="secondary">{product.category}</Badge>}
              </div>
              <p className="text-muted-foreground">
                {product.description || "Comfort-focused essentials curated for your wellness journey."}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-xl font-semibold text-foreground">
                  {formatCurrency(product.price, product.currency)}
                </span>
                <Button onClick={handleAdd}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Loading product...</div>
          )}
        </Card>

        <AIRecommendations userType={userType} viewedProductIds={Number.isFinite(id) ? [id] : []} categories={categories} />
      </main>
    </div>
  );
};

export default ProductDetails;
