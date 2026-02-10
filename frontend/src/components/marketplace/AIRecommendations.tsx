import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { apiAI, apiMarketplace } from "@/lib/api";
import { MarketplaceProduct, ProductCard } from "@/components/marketplace/ProductCard";
import { useCart } from "@/contexts/CartContext";

interface AIRecommendationsProps {
  userType?: string;
  viewedProductIds?: number[];
  categories?: string[];
}

export const AIRecommendations = ({ userType, viewedProductIds = [], categories = [] }: AIRecommendationsProps) => {
  const { items } = useCart();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<number[]>([]);

  const cartIds = useMemo(() => items.map((i) => i.productId), [items]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await apiMarketplace.listProducts();
        if (!mounted) return;
        setProducts(list || []);
      } catch {
        if (mounted) setProducts([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!products.length) return;
      try {
        const response = await apiAI.recommendProducts({
          userJourney: userType || "wellness",
          viewedProducts: viewedProductIds,
          cartItems: cartIds,
          categories,
        });
        if (!mounted) return;
        const result = response as any;
        const ids = result?.data?.recommendedIds || result?.recommendedIds || [];
        setRecommendedIds(ids.slice(0, 8));
      } catch {
        if (!mounted) return;
        const fallback = products
          .filter((p) => categories.length === 0 || categories.includes(p.category || ""))
          .slice(0, 8)
          .map((p) => p.id);
        setRecommendedIds(fallback);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [products, categories, cartIds, viewedProductIds, userType]);

  const recommendedProducts = recommendedIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as MarketplaceProduct[];

  if (!recommendedProducts.length) return null;

  return (
    <Card className="p-6 bg-white shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
        <Badge className="bg-primary/10 text-primary border border-primary/20">Personalized</Badge>
      </div>
      <Carousel className="w-full">
        <CarouselContent>
          {recommendedProducts.map((product) => (
            <CarouselItem key={product.id} className="basis-full md:basis-1/2 lg:basis-1/3">
              <ProductCard product={product} showBadge userType={userType} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </Card>
  );
};
