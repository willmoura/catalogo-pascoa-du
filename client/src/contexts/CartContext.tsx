import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  shell?: 'Ao Leite' | 'Meio a Meio' | 'Meio Amargo' | 'Branco';
  variantKey?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, weight: string, flavorId?: number, shell?: string, variantKey?: string) => void;
  updateQuantity: (productId: number, weight: string, quantity: number, flavorId?: number, shell?: string, variantKey?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  checkoutStep: "review" | "hub";
  setCheckoutStep: (step: "review" | "hub") => void;
  openCartReview: () => void;
  openCheckoutHub: () => void;
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
  });
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"review" | "hub">("review");

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    // Normalize shell string (trim)
    if (newItem.shell) {
      newItem.shell = newItem.shell.trim() as any;
    }

    setItems((prev) => {
      // Find existing item
      const existingIndex = prev.findIndex((item) => {
        // STRICT GROUPING FOR KITS (12, 13, 34)
        if ([12, 13, 34].includes(newItem.productId)) {
          return item.productId === newItem.productId && item.variantKey === newItem.variantKey;
        }

        // STANDARD GROUPING FOR OTHER PRODUCTS (Exact existing logic)
        const isSameProduct = item.productId === newItem.productId &&
          item.weight === newItem.weight &&
          item.flavorId === newItem.flavorId;

        if (newItem.shell) {
          return isSameProduct && item.shell === newItem.shell;
        } else {
          return isSameProduct && !item.shell;
        }
      });

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }

      return [...prev, newItem];
    });
  };

  const removeItem = (productId: number, weight: string, flavorId?: number, shell?: string, variantKey?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => {
          if (variantKey) {
            return !(item.productId === productId && item.variantKey === variantKey);
          }
          return !(
            item.productId === productId &&
            item.weight === weight &&
            item.flavorId === flavorId &&
            item.shell === shell
          );
        }
      )
    );
  };

  const updateQuantity = (
    productId: number,
    weight: string,
    quantity: number,
    flavorId?: number,
    shell?: string,
    variantKey?: string
  ) => {
    if (quantity <= 0) {
      removeItem(productId, weight, flavorId, shell, variantKey);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (variantKey) {
          return item.productId === productId && item.variantKey === variantKey
            ? { ...item, quantity }
            : item;
        }
        return item.productId === productId &&
          item.weight === weight &&
          item.flavorId === flavorId &&
          item.shell === shell
          ? { ...item, quantity }
          : item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCheckoutStep("review");
  };

  const openCartReview = () => {
    setCheckoutStep("review");
    setIsOpen(true);
  };

  const openCheckoutHub = () => {
    if (checkoutStep === "review") {
      setCheckoutStep("hub");
      setIsOpen(true);
    }
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
        openCartReview,
        openCheckoutHub,
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
