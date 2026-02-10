import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";

const formatCurrency = (amountCents: number, currency: string) => {
  const value = amountCents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(value);
};

export const OrderSummary = () => {
  const { items, subtotalCents } = useCart();
  const currency = items[0]?.currency || "USD";

  return (
    <Card className="p-6 bg-white shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Order Summary</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium">
              {formatCurrency(item.priceCents * item.quantity, currency)}
            </span>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="flex items-center justify-between text-base">
        <span className="font-semibold">Total</span>
        <span className="font-semibold">{formatCurrency(subtotalCents, currency)}</span>
      </div>
    </Card>
  );
};
