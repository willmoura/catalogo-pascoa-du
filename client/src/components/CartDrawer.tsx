import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "5511999999999";

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isOpen,
    setIsOpen,
  } = useCart();

  const createOrderMutation = trpc.orders.create.useMutation();

  const formatWhatsAppMessage = () => {
    let message = "🐰 *Pedido Páscoa Du*\n\n";
    
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.productName}*\n`;
      message += `   📦 ${item.weight}`;
      if (item.flavor) {
        message += ` | 🍫 ${item.flavor}`;
      }
      message += `\n   💰 R$ ${item.price.toFixed(2).replace(".", ",")} x ${item.quantity} = R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `*TOTAL: R$ ${totalPrice.toFixed(2).replace(".", ",")}*\n\n`;
    message += `Olá! Gostaria de fazer este pedido. 😊`;

    return encodeURIComponent(message);
  };

  const handleCheckout = async () => {
    try {
      // Create order in database and notify owner
      await createOrderMutation.mutateAsync({
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          weight: item.weight,
          price: item.price,
          quantity: item.quantity,
          flavor: item.flavor,
        })),
        totalAmount: totalPrice.toFixed(2),
      });

      // Open WhatsApp
      const message = formatWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
      window.open(whatsappUrl, "_blank");

      toast.success("Pedido enviado! Finalize pelo WhatsApp.");
      clearCart();
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating order:", error);
      // Still open WhatsApp even if order creation fails
      const message = formatWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
      window.open(whatsappUrl, "_blank");
      
      toast.success("Redirecionando para WhatsApp...");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Carrinho ({totalItems})
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Carrinho vazio
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione produtos deliciosos ao seu carrinho!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.weight}-${item.flavorId}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-3 p-3 bg-card rounded-xl border border-border"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--chocolate)] to-[var(--gold)] opacity-50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground line-clamp-1">
                          {item.productName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {item.weight}
                          {item.flavor && ` • ${item.flavor}`}
                        </p>
                        <p className="text-primary font-bold mt-1">
                          R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-border rounded-lg overflow-hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.weight,
                                  item.quantity - 1,
                                  item.flavorId
                                )
                              }
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.weight,
                                  item.quantity + 1,
                                  item.flavorId
                                )
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              removeItem(item.productId, item.weight, item.flavorId)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-4 safe-bottom">
                {/* Clear Cart */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={clearCart}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar carrinho
                </Button>

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  size="lg"
                  className="w-full rounded-xl gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white"
                  onClick={handleCheckout}
                  disabled={createOrderMutation.isPending}
                >
                  <MessageCircle className="w-5 h-5" />
                  {createOrderMutation.isPending
                    ? "Enviando..."
                    : "Finalizar pelo WhatsApp"}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
