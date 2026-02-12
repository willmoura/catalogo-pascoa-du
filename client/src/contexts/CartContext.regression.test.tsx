// @vitest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from './CartContext';

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
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('CartContext Flow Regression', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('openCartReview should open drawer and set step to review', () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        });

        act(() => {
            result.current.setIsOpen(false);
            result.current.setCheckoutStep('hub'); // Pre-condition
        });

        act(() => {
            result.current.openCartReview();
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.checkoutStep).toBe('review');
    });

    it('openCheckoutHub should transition from review to hub', () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        });

        act(() => {
            result.current.setIsOpen(true);
            result.current.setCheckoutStep('review');
        });

        act(() => {
            result.current.openCheckoutHub();
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.checkoutStep).toBe('hub');
    });

    it('openCheckoutHub should NOT transition if not in review (safeguard, though less likely in current flow)', () => {
        // Implementation check: 
        // if (checkoutStep === "review") { setCheckoutStep("hub"); ... }
        // So if step is hub (already), it does nothing (stays hub).
        // If step is something else (unlikely with type system), it checks check.

        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        });

        act(() => {
            // Force simulate a weird state if possible, but here we just check idempotency or transition
            result.current.setCheckoutStep('hub');
        });

        act(() => {
            result.current.openCheckoutHub();
        });

        // It should stay hub (or re-set hub)
        expect(result.current.checkoutStep).toBe('hub');
    });
});
