// @vitest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('CartContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should add item with shell correctly', () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        });

        act(() => {
            result.current.addItem({
                productId: 1,
                productName: 'Ovo Trufado',
                productSlug: 'ovo-trufado',
                imageUrl: null,
                weight: '500g',
                weightGrams: 500,
                price: 50,
                quantity: 1,
                shell: 'Ao Leite'
            });
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].shell).toBe('Ao Leite');
    });

    it('should treat items with different shells as distinct', () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        });

        // Add first item (Ao Leite)
        act(() => {
            result.current.addItem({
                productId: 1,
                productName: 'Ovo Trufado',
                productSlug: 'ovo-trufado',
                imageUrl: null,
                weight: '500g',
                weightGrams: 500,
                price: 50,
                quantity: 1,
                shell: 'Ao Leite'
            });
        });

        // Add second item (Branco)
        act(() => {
            result.current.addItem({
                productId: 1,
                productName: 'Ovo Trufado',
                productSlug: 'ovo-trufado',
                imageUrl: null,
                weight: '500g',
                weightGrams: 500,
                price: 50,
                quantity: 1,
                shell: 'Branco'
            });
        });

        expect(result.current.items).toHaveLength(2);
        expect(result.current.items[0].shell).toBe('Ao Leite');
        expect(result.current.items[1].shell).toBe('Branco');
    });

    it('should stack items with same shell', () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        });

        // Add first item
        act(() => {
            result.current.addItem({
                productId: 1,
                productName: 'Ovo Trufado',
                productSlug: 'ovo-trufado',
                imageUrl: null,
                weight: '500g',
                weightGrams: 500,
                price: 50,
                quantity: 1,
                shell: 'Ao Leite'
            });
        });

        // Add same item again
        act(() => {
            result.current.addItem({
                productId: 1,
                productName: 'Ovo Trufado',
                productSlug: 'ovo-trufado',
                imageUrl: null,
                weight: '500g',
                weightGrams: 500,
                price: 50,
                quantity: 2,
                shell: 'Ao Leite'
            });
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(3);
    });

    it('should handle non-trufado items (no shell logic needed but robust against undefined)', () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        });

        act(() => {
            result.current.addItem({
                productId: 2,
                productName: 'Ovo Simples',
                productSlug: 'ovo-simples',
                imageUrl: null,
                weight: '250g',
                weightGrams: 250,
                price: 30,
                quantity: 1,
                // No shell provided
            });
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].shell).toBeUndefined();
    });
});
