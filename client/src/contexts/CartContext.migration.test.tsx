import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        },
    };
})();

Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
});

describe("CartContext Migration", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("should migrate 'Ovomaltina' to 'Ovomaltine' on initialization", () => {
        // 1. Setup stale data in localStorage
        const staleCart = [
            {
                productId: 1,
                productName: "Test Product",
                flavor: "Ovomaltina", // The typo
                price: 10,
                quantity: 1,
                weight: "100g",
                weightGrams: 100,
            },
        ];
        window.localStorage.setItem("pascoa-du-cart", JSON.stringify(staleCart));

        // 2. Initialize CartProvider
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{children}</CartProvider>
        );
        const { result } = renderHook(() => useCart(), { wrapper });

        // 3. Verify migration
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].flavor).toBe("Ovomaltine"); // Should be corrected
    });

    it("should keeps 'Ovomaltine' as is", () => {
        // 1. Setup correct data
        const correctCart = [
            {
                productId: 1,
                productName: "Test Product",
                flavor: "Ovomaltine",
                price: 10,
                quantity: 1,
                weight: "100g",
                weightGrams: 100,
            },
        ];
        window.localStorage.setItem("pascoa-du-cart", JSON.stringify(correctCart));

        // 2. Initialize CartProvider
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{children}</CartProvider>
        );
        const { result } = renderHook(() => useCart(), { wrapper });

        // 3. Verify it remains correct
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].flavor).toBe("Ovomaltine");
    });
});
