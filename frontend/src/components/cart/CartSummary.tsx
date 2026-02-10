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

export const CartSummary = ({ currency = "USD" }: { currency?: string }) => {
  const { subtotalCents } = useCart();

  return (
    <Card className="p-6 bg-white shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Order Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotalCents, currency)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">Free</span>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatCurrency(subtotalCents, currency)}</span>
        </div>
      </div>
    </Card>
  );
};
