import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  weight: string;
  weightGrams: number;
  price: number;
  quantity: number;
  flavor?: string;
  flavorId?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, weight: string, flavorId?: number) => void;
  updateQuantity: (productId: number, weight: string, quantity: number, flavorId?: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  checkoutStep: "review" | "hub";
  setCheckoutStep: (step: "review" | "hub") => void;
  openCheckout: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "pascoa-du-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"review" | "hub">("review");

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.weight === newItem.weight &&
          item.flavorId === newItem.flavorId
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }

      return [...prev, newItem];
    });
  };

  const removeItem = (productId: number, weight: string, flavorId?: number) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.weight === weight &&
            item.flavorId === flavorId
          )
      )
    );
  };

  const updateQuantity = (
    productId: number,
    weight: string,
    quantity: number,
    flavorId?: number
  ) => {
    if (quantity <= 0) {
      removeItem(productId, weight, flavorId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId &&
          item.weight === weight &&
          item.flavorId === flavorId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setCheckoutStep("review");
  };

  const openCheckout = () => {
    setCheckoutStep("hub");
    setIsOpen(true);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
        checkoutStep,
        setCheckoutStep,
        openCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
