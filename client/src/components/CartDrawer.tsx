import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, ChevronLeft, MapPin, Calendar, Truck, Store, Wallet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "5511999999999";

const PAYMENT_METHODS = [
  { id: "pix", name: "PIX", icon: "pix" },
  { id: "credito", name: "Cartão de Crédito", icon: "💳" },
  { id: "debito", name: "Cartão de Débito", icon: "💳" },
  { id: "dinheiro", name: "Dinheiro", icon: "💵" },
];

const DELIVERY_REGIONS = [
  { id: "torre", name: "Torre de Pedra", fee: 5.00 },
  { id: "outra", name: "Outra cidade da região", fee: 20.00 },
];

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
    checkoutStep,
    setCheckoutStep,
    openCheckoutHub
  } = useCart();

  const createOrderMutation = trpc.orders.create.useMutation();

  // Logistics State
  const [deliveryMethod, setDeliveryMethod] = useState<"retirada" | "entrega" | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryRegion, setDeliveryRegion] = useState<"torre" | "outra" | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<typeof PAYMENT_METHODS[0] | null>(null);
  const [observations, setObservations] = useState("");

  const deliveryFee = deliveryMethod === "entrega" && deliveryRegion
    ? (DELIVERY_REGIONS.find(r => r.id === deliveryRegion)?.fee || 0)
    : 0;

  const finalTotal = totalPrice + deliveryFee;

  // Refs for Auto-Scroll
  const drawerContainerRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  // Helpers
  const scrollToSection = (ref: any) => {
    setTimeout(() => {
      if (ref.current && drawerContainerRef.current) {
        const top = ref.current.offsetTop - 100; // Offset for header
        drawerContainerRef.current.scrollTo({ top, behavior: "smooth" });
      }
    }, 100);
  };

  // Reset state when drawer closes or step changes back to review
  useEffect(() => {
    if (!isOpen || checkoutStep === 'review') {
      // Optional: reset logistics state? 
      // Keeping it preserved might be better for UX if they go back and forth.
    }
  }, [isOpen, checkoutStep]);

  const handleDeliveryMethodChange = (method: "retirada" | "entrega") => {
    setDeliveryMethod(method);
    if (method === "retirada") {
      setDeliveryRegion(null); // Clear region fee
      scrollToSection(dateRef);
    } else {
      scrollToSection(addressRef);
    }
  };

  const handleRegionChange = (region: "torre" | "outra") => {
    setDeliveryRegion(region);
    scrollToSection(dateRef);
  };

  const formatWhatsAppMessage = () => {
    let message = "*PEDIDO - OVOS DE PÁSCOA DU*\n\n";

    items.forEach((item, index) => {
      message += `${index + 1}. *${item.productName}*\n`;
      message += `   • Peso: ${item.weight}`;
      if (item.flavor) {
        message += `\n   • Sabor: ${item.flavor}`;
      }
      message += `\n   • R$ ${item.price.toFixed(2).replace(".", ",")} x ${item.quantity} = R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `*Subtotal: R$ ${totalPrice.toFixed(2).replace(".", ",")}*\n`;

    if (deliveryMethod === "entrega" && deliveryFee > 0) {
      message += `*Taxa de Entrega: R$ ${deliveryFee.toFixed(2).replace('.', ',')}*\n`;
    }

    message += `*TOTAL FINAL: R$ ${finalTotal.toFixed(2).replace(".", ",")}*\n\n`;

    // Logistics Info
    message += `*Forma de Recebimento:* ${deliveryMethod === "retirada" ? "Retirar no Local" : "Entrega"}\n`;
    if (deliveryMethod === "retirada") {
      message += `*Data de Retirada:* ${deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : 'Não informada'}\n\n`;
    } else {
      message += `*Data de Entrega:* ${deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : 'Não informada'}\n`;
      message += `*Endereço:* ${deliveryAddress}\n`;
      message += `*Região:* ${DELIVERY_REGIONS.find(r => r.id === deliveryRegion)?.name}\n\n`;
    }

    if (selectedPaymentMethod) {
      message += `*Forma de Pagamento:* ${selectedPaymentMethod.name}\n\n`;
    }
    if (observations) {
      message += `*Observações:* ${observations}\n\n`;
    }

    message += `Olá! Gostaria de fazer este pedido.`;

    return encodeURIComponent(message);
  };

  const isValid = () => {
    if (!deliveryMethod) return false;
    if (!deliveryDate) return false;
    if (deliveryMethod === "entrega") {
      if (!deliveryAddress || deliveryAddress.length < 5) return false;
      if (!deliveryRegion) return false;
    }
    if (!selectedPaymentMethod) return false;
    return true;
  };

  const handleCheckout = async () => {
    if (!isValid()) {
      // Focus error logic logic
      if (!deliveryMethod) { toast.error("Selecione a forma de entrega"); return; }
      if (deliveryMethod === 'entrega' && !deliveryAddress) { toast.error("Informe o endereço"); scrollToSection(addressRef); return; }
      if (!deliveryDate) { toast.error("Informe a data"); scrollToSection(dateRef); return; }
      if (!selectedPaymentMethod) { toast.error("Selecione o pagamento"); scrollToSection(paymentRef); return; }
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          weight: item.weight,
          price: item.price,
          quantity: item.quantity,
          flavor: item.flavor,
          shell: item.shell,
        })),
        totalAmount: finalTotal.toFixed(2),
      });

      const message = formatWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
      window.open(whatsappUrl, "_blank");

      toast.success("Pedido enviado! Finalize pelo WhatsApp.");
      clearCart();
      setIsOpen(false);
      setCheckoutStep('review'); // Reset to start
    } catch (error) {
      console.error("Error creating order:", error);
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background z-10">
              <div className="flex items-center gap-2">
                {checkoutStep === 'hub' ? (
                  <Button variant="ghost" size="icon" onClick={() => setCheckoutStep('review')}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                ) : (
                  <ShoppingBag className="w-5 h-5 text-primary" />
                )}
                <div>
                  <h2 className="text-lg font-semibold">
                    {checkoutStep === 'hub' ? 'Finalizar Pedido' : `Carrinho (${totalItems})`}
                  </h2>
                  {checkoutStep === 'hub' && (
                    <p className="text-xs text-muted-foreground">Preencha os dados de entrega</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div ref={drawerContainerRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">

              {/* STAGE 1: REVIEW */}
              {checkoutStep === 'review' && (
                <>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Carrinho vazio</h3>
                      <p className="text-sm text-muted-foreground">Adicione produtos deliciosos ao seu carrinho!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <motion.div
                          key={`${item.productId}-${item.weight}-${item.flavorId}-${item.shell || ''}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 p-3 bg-card rounded-xl border border-border"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary/30 shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                                <ShoppingBag className="w-8 h-8 text-zinc-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground line-clamp-1">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.weight}
                              {item.shell && ` • Casca: ${item.shell}`}
                              {item.flavor && ` • ${item.flavor}`}
                            </p>
                            <p className="text-primary font-bold mt-1">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1, item.flavorId, item.shell, item.variantKey)}><Minus className="w-3 h-3" /></Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1, item.flavorId, item.shell, item.variantKey)}><Plus className="w-3 h-3" /></Button>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.productId, item.weight, item.flavorId, item.shell, item.variantKey)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* STAGE 2: HUB */}
              {checkoutStep === 'hub' && (
                <div className="space-y-8 pb-20">

                  {/* Entrega vs Retirada */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" /> Forma de Recebimento
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleDeliveryMethodChange("retirada")}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryMethod === "retirada" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                          }`}
                      >
                        <Store className="w-6 h-6" />
                        <span className="font-semibold">Retirada</span>
                      </button>
                      <button
                        onClick={() => handleDeliveryMethodChange("entrega")}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryMethod === "entrega" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                          }`}
                      >
                        <Truck className="w-6 h-6" />
                        <span className="font-semibold">Entrega</span>
                      </button>
                    </div>
                  </div>

                  {/* Endereço e Região (Se Entrega) */}
                  <AnimatePresence>
                    {deliveryMethod === "entrega" && (
                      <motion.div
                        ref={addressRef}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Endereço Completo</label>
                          <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Rua, Número, Bairro e Complemento"
                            className="w-full p-3 rounded-lg border border-input bg-background min-h-[80px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Região de Entrega</label>
                          <p className="text-xs text-muted-foreground -mt-1">Necessário para calcular a taxa</p>
                          <div className="space-y-2">
                            {DELIVERY_REGIONS.map((region) => (
                              <button
                                key={region.id}
                                onClick={() => handleRegionChange(region.id as any)}
                                className={`w-full p-3 rounded-lg border flex justify-between items-center transition-all ${deliveryRegion === region.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"
                                  }`}
                              >
                                <span>{region.name}</span>
                                <span className="font-bold text-primary">R$ {region.fee.toFixed(2).replace('.', ',')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Data */}
                  <AnimatePresence>
                    {deliveryMethod && (
                      <motion.div
                        ref={dateRef}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3 overflow-hidden"
                      >
                        <h3 className="font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Data de {deliveryMethod === 'retirada' ? 'Retirada' : 'Entrega'}
                        </h3>
                        <DatePicker
                          date={deliveryDate}
                          setDate={(date) => {
                            setDeliveryDate(date);
                            if (date) scrollToSection(paymentRef);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pagamento */}
                  <AnimatePresence>
                    {deliveryDate && (
                      <motion.div
                        ref={paymentRef}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3 overflow-hidden"
                      >
                        <h3 className="font-semibold flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-primary" /> Forma de Pagamento
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {PAYMENT_METHODS.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => setSelectedPaymentMethod(method)}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${selectedPaymentMethod?.id === method.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/30"
                                }`}
                            >
                              {method.id === 'pix' ? (
                                <img src="/pix-logo.png" alt="Pix" className="w-5 h-5 object-contain" />
                              ) : (
                                <span>{method.icon}</span>
                              )}
                              {method.name}
                            </button>
                          ))}
                        </div>

                        <div className="mt-4">
                          <label className="text-sm font-medium">Observações (Opcional)</label>
                          <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Ex: Troco para 50, Campainha não funciona..."
                            className="w-full mt-1 p-3 rounded-lg border border-input bg-background min-h-[60px]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-background safe-bottom space-y-3">
              {/* Total Summary Row */}
              <div className="flex flex-col gap-1 pb-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                {checkoutStep === 'hub' && deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Taxa de Entrega</span>
                    <span>+ R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold mt-1">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {checkoutStep === 'review' ? (
                items.length > 0 && (
                  <Button
                    size="lg"
                    className="w-full rounded-xl font-bold text-lg h-12"
                    onClick={() => openCheckoutHub()}
                  >
                    Confirmar Pedido
                  </Button>
                )
              ) : (
                <Button
                  size="lg"
                  className={`w-full rounded-xl font-bold text-lg h-12 gap-2 transition-transform active:scale-[0.98] ${isValid() ? "bg-[#25D366] hover:bg-[#128C7E] text-white opacity-100 hover:opacity-100" : "bg-muted text-muted-foreground"
                    }`}
                  onClick={handleCheckout}
                // disabled={!isValid()} // UX: Don't disable, let click trigger validation feedback
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar Pedido via WhatsApp
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
