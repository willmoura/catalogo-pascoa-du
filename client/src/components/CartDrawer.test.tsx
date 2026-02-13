import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CartDrawer from './CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { trpc } from '@/lib/trpc';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as React from 'react';

// Mock dependencies
vi.mock('@/contexts/CartContext', () => ({
    useCart: vi.fn(),
}));

vi.mock('@/lib/trpc', () => ({
    trpc: {
        orders: {
            create: {
                useMutation: vi.fn(),
            },
        },
    },
}));

vi.mock('./ui/responsive-image', () => ({
    ResponsiveImage: () => <div data-testid="responsive-image" />,
}));

// Mock DatePicker to allow easy partial date selection testing
vi.mock('@/components/ui/date-picker', () => ({
    DatePicker: ({ setDate }: { setDate: (d: Date) => void }) => (
        <button onClick={() => setDate(new Date(2024, 3, 1))}>Select Date</button>
    ),
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

describe('CartDrawer Delivery Fee Logic', () => {
    const mockUpdateQuantity = vi.fn();
    const mockRemoveItem = vi.fn();
    const mockClearCart = vi.fn();
    const mockSetIsOpen = vi.fn();
    const mockSetCheckoutStep = vi.fn();
    const mockOpenCheckoutHub = vi.fn();
    const mockMutateAsync = vi.fn();

    const defaultCartState = {
        items: [
            {
                productId: 1,
                productName: 'Ovo Gourmet',
                weight: '500g',
                price: 50.00,
                quantity: 1,
                imageUrl: 'img1',
            },
        ],
        removeItem: mockRemoveItem,
        updateQuantity: mockUpdateQuantity,
        clearCart: mockClearCart,
        totalItems: 1,
        totalPrice: 50.00,
        isOpen: true,
        setIsOpen: mockSetIsOpen,
        checkoutStep: 'hub', // Start at hub to test delivery options
        setCheckoutStep: mockSetCheckoutStep,
        openCheckoutHub: mockOpenCheckoutHub,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useCart as any).mockReturnValue(defaultCartState);
        (trpc.orders.create.useMutation as any).mockReturnValue({
            mutateAsync: mockMutateAsync,
        });
    });

    it('should calculate correct fee for "Torre de Pedra"', async () => {
        render(<CartDrawer />);

        // Select "Entrega"
        const entregaBtn = screen.getByText('Entrega');
        fireEvent.click(entregaBtn);

        // Select "Torre de Pedra"
        const regionBtn = screen.getByText('Torre de Pedra');
        fireEvent.click(regionBtn);

        // Verify subtotal, fee and total
        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText('R$ 50,00')).toBeInTheDocument();

        expect(screen.getByText('Taxa de Entrega')).toBeInTheDocument();
        expect(screen.getByText('+ R$ 5,00')).toBeInTheDocument();

        expect(screen.getByText('R$ 55,00')).toBeInTheDocument();
    });

    it('should handle "Outra cidade" correctly (no numeric fee, disclaimer)', async () => {
        render(<CartDrawer />);

        // Select "Entrega"
        fireEvent.click(screen.getByText('Entrega'));

        // Select "Outra cidade"
        const regionBtn = screen.getByText('Outra cidade da região');
        fireEvent.click(regionBtn);

        // Verify UI changes
        // 1. Fee in summary should be "À combinar"
        expect(screen.getByText('Taxa de Entrega')).toBeInTheDocument();
        expect(screen.getAllByText('À combinar').length).toBeGreaterThan(0);

        // 2. Total should remain equal to Subtotal (50,00)
        // We expect "R$ 50,00" to appear twice (Subtotal and Total)
        const priceElements = screen.getAllByText('R$ 50,00');
        expect(priceElements.length).toBeGreaterThanOrEqual(2);

        // 3. Disclaimer should be visible
        expect(screen.getByText(/A taxa de entrega é à combinar/i)).toBeInTheDocument();
    });

    it('should format WhatsApp message correctly for "Outra cidade"', async () => {
        render(<CartDrawer />);

        // 1. Select Entrega
        fireEvent.click(screen.getByText('Entrega'));

        // 2. Select Outra cidade
        fireEvent.click(screen.getByText('Outra cidade da região'));

        // 3. Fill Address
        const addressInput = screen.getByPlaceholderText('Rua, Número, Bairro e Complemento');
        fireEvent.change(addressInput, { target: { value: 'Rua Teste, 123' } });

        // 4. Select Date (using our mock button)
        fireEvent.click(screen.getByText('Select Date'));

        // 5. Select Payment
        fireEvent.click(screen.getByText('PIX'));

        // 6. Submit
        const submitBtn = screen.getByText('Enviar Pedido via WhatsApp');
        // Ensure button is enabled
        expect(submitBtn).not.toBeDisabled();

        // Check validation (isValid) implicitly by clicking
        fireEvent.click(submitBtn);

        // Wait for async mutation
        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalled();
        });

        // Check window.open call
        expect(mockWindowOpen).toHaveBeenCalled();
        const url = mockWindowOpen.mock.calls[0][0];
        const decodedUrl = decodeURIComponent(url);

        // Verify content
        expect(decodedUrl).toContain('Taxa de Entrega: à combinar');
        expect(decodedUrl).toContain('O total poderá ser ajustado pois a taxa de entrega é à combinar');
        expect(decodedUrl).toContain('TOTAL FINAL: R$ 50,00'); // Should match subtotal
        expect(decodedUrl).toContain('*Região:* Outra cidade da região');
    });
});
