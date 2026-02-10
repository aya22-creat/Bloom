import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/contexts/CartContext";

interface CartItemProps {
  item: CartItemType;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

const formatCurrency = (amountCents: number, currency: string) => {
  const value = amountCents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(value);
};

export const CartItem = ({ item, onRemove, onUpdateQuantity }: CartItemProps) => {
  return (
    <Card className="p-4 bg-white shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{item.name}</h4>
            {item.category && (
              <Badge variant="secondary" className="text-xs">
                {item.category}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {item.vendorName || "HopeBloom Verified"}
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {formatCurrency(item.priceCents, item.currency)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[2rem] text-center font-semibold">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.productId)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
