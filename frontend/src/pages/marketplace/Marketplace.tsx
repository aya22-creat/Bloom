import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AIRecommendations } from "@/components/marketplace/AIRecommendations";
import { ProductCard, MarketplaceProduct } from "@/components/marketplace/ProductCard";
import { apiMarketplace } from "@/lib/api";
import { ArrowLeft, Flower2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Marketplace = () => {
  const { userType } = useParams<{ userType?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const productsQuery = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: () => apiMarketplace.listProducts(),
  });

  const products = (productsQuery.data || []) as MarketplaceProduct[];

  const categories = useMemo(() => {
    const items = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
    return ["all", ...items];
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen gradient-blush" dir={user?.language === "ar" ? "rtl" : "ltr"}>
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(userType ? `/dashboard/${userType}` : "/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Marketplace</span>
          </div>
          <CartDrawer />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-6 bg-white shadow-soft">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">HopeBloom Marketplace</h2>
              <p className="text-sm text-muted-foreground">
                Curated essentials focused on comfort, recovery, and wellness.
              </p>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((item) => (
              <Button
                key={item}
                variant={category === item ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(item)}
              >
                {item === "all" ? "All" : item}
              </Button>
            ))}
          </div>
        </Card>

        <AIRecommendations
          userType={userType}
          categories={category === "all" ? [] : [category]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} userType={userType} />
          ))}
          {filteredProducts.length === 0 && (
            <Card className="p-6 bg-white shadow-soft col-span-full text-center">
              <Badge variant="secondary" className="mb-2">No products found</Badge>
              <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Marketplace;
