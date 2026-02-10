import { ReactNode } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useNavigate } from "react-router-dom";

interface CartDrawerProps {
  trigger?: ReactNode;
}

export const CartDrawer = ({ trigger }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, totalItems } = useCart();
  const navigate = useNavigate();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {trigger || (
          <Button variant="outline" className="relative">
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Your Cart</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 grid gap-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Your cart is empty.</div>
          ) : (
            <>
              <ScrollArea className="max-h-[45vh] pr-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <CartItem
                      key={item.productId}
                      item={item}
                      onRemove={removeItem}
                      onUpdateQuantity={updateQuantity}
                    />
                  ))}
                </div>
              </ScrollArea>
              <CartSummary currency={items[0]?.currency || "USD"} />
              <Button className="w-full" onClick={() => navigate("/cart")}>
                Go to Cart
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
