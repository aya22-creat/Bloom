import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

export type MarketplaceProduct = {
  id: number;
  vendor_id: number;
  vendor_name?: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
};

const formatCurrency = (value?: number, currency?: string) => {
  const amount = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
};

interface ProductCardProps {
  product: MarketplaceProduct;
  showBadge?: boolean;
  userType?: string;
}

export const ProductCard = ({ product, showBadge, userType }: ProductCardProps) => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const priceCents = Math.round((product.price || 0) * 100);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      priceCents,
      currency: product.currency || "USD",
      quantity: 1,
      vendorId: product.vendor_id,
      vendorName: product.vendor_name,
      category: product.category,
    });
  };

  const handleView = () => {
    if (userType) {
      navigate(`/marketplace/${userType}/product/${product.id}`);
    } else {
      navigate(`/marketplace/product/${product.id}`);
    }
  };

  return (
    <Card className="p-5 bg-white shadow-soft flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
          <p className="text-sm text-muted-foreground">
            {product.vendor_name || "HopeBloom Verified"}
          </p>
        </div>
        {showBadge && (
          <Badge className="bg-primary/10 text-primary border border-primary/20">AI Recommended</Badge>
        )}
      </div>

      {product.category && (
        <Badge variant="secondary" className="w-fit">
          {product.category}
        </Badge>
      )}

      <p className="text-sm text-muted-foreground line-clamp-2">
        {product.description || "Comfort-focused essentials curated for your wellness journey."}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-lg font-semibold text-foreground">
          {formatCurrency(product.price, product.currency)}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button onClick={handleAdd}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Card>
  );
};
