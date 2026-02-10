import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type CartItem = {
  productId: number;
  name: string;
  priceCents: number;
  currency: string;
  quantity: number;
  vendorId?: number;
  vendorName?: string;
  category?: string;
  imageUrl?: string;
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  subtotalCents: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "hb_cart";

const readCart = (key: string): CartItem[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCart = (key: string, items: CartItem[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const storageKey = useMemo(() => {
    const id = user?.id ? String(user.id) : "guest";
    return `${CART_STORAGE_KEY}_${id}`;
  }, [user?.id]);

  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart(storageKey));
  }, [storageKey]);

  useEffect(() => {
    writeCart(storageKey, items);
  }, [items, storageKey]);

  const addItem = (item: CartItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.productId === item.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === item.productId
            ? { ...p, quantity: p.quantity + quantity }
            : p
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, quantity } : p))
    );
  };

  const clearCart = () => setItems([]);

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotalCents,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
