import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, ChevronLeft, MapPin, Calendar, Truck, Store, Wallet, Check, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { ResponsiveImage } from "./ui/responsive-image";
import { useAnalytics } from "@/hooks/useAnalytics";


const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "5511999999999";

const PAYMENT_METHODS = [
  { id: "pix", name: "PIX", icon: "pix" },
  { id: "credito", name: "Cartão de Crédito", icon: "💳" },
  { id: "debito", name: "Cartão de Débito", icon: "💳" },
  { id: "dinheiro", name: "Dinheiro", icon: "💵" },
];

const DELIVERY_REGIONS: { id: string; name: string; fee: number | null }[] = [
  { id: "torre", name: "Torre de Pedra", fee: 5.00 },
  { id: "outra", name: "Outra cidade da região", fee: null },
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

  const { trackEvent } = useAnalytics();

  const createOrderMutation = trpc.orders.create.useMutation();

  // Checkout UX State
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Logistics State
  const [deliveryMethod, setDeliveryMethod] = useState<"retirada" | "entrega" | null>(null);
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [complement, setComplement] = useState("");
  const [deliveryRegion, setDeliveryRegion] = useState<"torre" | "outra" | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<typeof PAYMENT_METHODS[0] | null>(null);
  const [observations, setObservations] = useState("");

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    const formatted = value.replace(/^(\d{5})(\d)/, "$1-$2");
    setCep(formatted);
    
    if (value.length === 8) {
      // Auto fetch via CEP
      try {
        const res = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || "");
          setNeighborhood(data.bairro || "");
          setErrors(prev => ({ ...prev, cep: false, street: false, neighborhood: false }));
        } else {
          setErrors(prev => ({ ...prev, cep: true }));
        }
      } catch (err) {
        console.error("CEP error", err);
      }
    }
  };

  const deliveryFee = deliveryMethod === "entrega" && deliveryRegion
    ? (DELIVERY_REGIONS.find(r => r.id === deliveryRegion)?.fee || 0)
    : 0;

  const isFeeToBeAgreed = deliveryMethod === "entrega" && deliveryRegion === "outra";
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

    if (deliveryMethod === "entrega") {
      if (isFeeToBeAgreed) {
        message += `*Taxa de Entrega: à combinar*\n`;
      } else if (deliveryFee > 0) {
        message += `*Taxa de Entrega: R$ ${deliveryFee.toFixed(2).replace('.', ',')}*\n`;
      }
    }

    message += `*TOTAL FINAL: R$ ${finalTotal.toFixed(2).replace(".", ",")}*\n`;
    if (isFeeToBeAgreed) {
      message += `_(O total poderá ser ajustado pois a taxa de entrega é à combinar)_\n`;
    }
    message += `\n`;

    if (customerName) {
      message += `*Cliente:* ${customerName}\n\n`;
    }

    message += `*Forma de Recebimento:* ${deliveryMethod === "retirada" ? "Retirar no Local" : "Entrega"}\n`;
    if (deliveryMethod === "retirada") {
      message += `*Data de Retirada:* ${deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : 'Não informada'}\n\n`;
    } else {
      message += `*Data de Entrega:* ${deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : 'Não informada'}\n`;
      message += `*Endereço:* ${street}, ${number}${complement ? ` - ${complement}` : ''} - ${neighborhood} (CEP: ${cep})\n`;
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

  const handleCheckout = async () => {
    // 1. Validation
    const newErrors: Record<string, boolean> = {};
    if (!customerName.trim()) newErrors.customerName = true;
    if (!deliveryMethod) newErrors.deliveryMethod = true;
    if (deliveryMethod === "entrega") {
      if (!cep) newErrors.cep = true;
      if (!street) newErrors.street = true;
      if (!number) newErrors.number = true;
      if (!neighborhood) newErrors.neighborhood = true;
      if (!deliveryRegion) newErrors.deliveryRegion = true;
    }
    if (!deliveryDate) newErrors.deliveryDate = true;
    if (!selectedPaymentMethod) newErrors.payment = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Preencha todos os campos destacados em vermelho");
      
      // Auto-scroll logic
      if (newErrors.customerName || newErrors.deliveryMethod) scrollToSection(drawerContainerRef);
      else if (newErrors.cep || newErrors.street || newErrors.deliveryRegion) scrollToSection(addressRef);
      else if (newErrors.deliveryDate) scrollToSection(dateRef);
      else scrollToSection(paymentRef);
      
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    trackEvent("purchase", {
      currency: "BRL",
      value: finalTotal,
      items: items.map(item => ({
        item_id: item.productId,
        item_name: item.productName,
        price: item.price,
        quantity: item.quantity
      }))
    });

    try {
      await createOrderMutation.mutateAsync({
        customerName,
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
      window.location.href = whatsappUrl;

      toast.success("Pedido enviado! Finalize pelo WhatsApp.");
      clearCart();
      setIsSubmitting(false);
      setIsOpen(false);
      setCheckoutStep('review'); // Reset to start
    } catch (error) {
      console.error("Error creating order:", error);
      const message = formatWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
      window.location.href = whatsappUrl;
      toast.success("Redirecionando para WhatsApp...");
      clearCart();
      setIsSubmitting(false);
      setIsOpen(false);
      setCheckoutStep('review');
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
                          key={`${item.productId}-${item.weight}-${item.flavorId}-${item.shell || ''}-${item.variantKey || ''}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 p-3 bg-card rounded-xl border border-border"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary/30 shrink-0">
                            {item.imageUrl ? (
                              <ResponsiveImage
                                imageId={item.imageUrl}
                                alt={item.productName}
                                className="w-full h-full bg-secondary/30"
                                imageClassName="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                                <ShoppingBag className="w-8 h-8 text-zinc-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground leading-tight notranslate" translate="no">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.weight}
                              {item.shell && <span className="notranslate" translate="no"> • Casca: {item.shell}</span>}
                              {item.flavor && <span className="notranslate" translate="no"> • {item.flavor}</span>}
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

                  {/* Nome do Cliente */}
                  <div className="space-y-3">
                    <h3 className={`font-semibold flex items-center gap-2 ${errors.customerName ? "text-red-500" : ""}`}>
                      <User className="w-4 h-4 text-primary" /> Seus Dados
                    </h3>
                    <input
                      type="text"
                      className={`w-full p-3 rounded-lg border bg-background ${errors.customerName ? "border-red-500 ring-1 ring-red-500" : "border-input"}`}
                      placeholder="Nome e Sobrenome"
                      value={customerName}
                      onChange={(e) => {
                         setCustomerName(e.target.value);
                         if(e.target.value) setErrors(prev => ({...prev, customerName: false}));
                      }}
                    />
                  </div>

                  {/* Entrega vs Retirada */}
                  <div className="space-y-3">
                    <h3 className={`font-semibold flex items-center gap-2 ${errors.deliveryMethod ? "text-red-500" : ""}`}>
                      <Truck className="w-4 h-4 text-primary" /> Forma de Recebimento
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => { handleDeliveryMethodChange("retirada"); setErrors(prev => ({...prev, deliveryMethod: false})); }}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryMethod === "retirada" ? "border-primary bg-primary/10" : errors.deliveryMethod ? "border-red-500" : "border-border hover:border-primary/50"
                          }`}
                      >
                        <Store className="w-6 h-6" />
                        <span className="font-semibold">Retirada</span>
                      </button>
                      <button
                        onClick={() => { handleDeliveryMethodChange("entrega"); setErrors(prev => ({...prev, deliveryMethod: false})); }}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryMethod === "entrega" ? "border-primary bg-primary/10" : errors.deliveryMethod ? "border-red-500" : "border-border hover:border-primary/50"
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
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Endereço Completo</label>
                          <div className="grid grid-cols-3 gap-2">
                             <input
                               className={`col-span-1 p-3 rounded-lg border bg-background ${errors.cep ? "border-red-500 ring-1 ring-red-500" : "border-input"}`}
                               placeholder="CEP" maxLength={9}
                               value={cep} onChange={handleCepChange}
                             />
                             <input
                               className={`col-span-2 p-3 rounded-lg border bg-background ${errors.street ? "border-red-500 ring-1 ring-red-500" : "border-input"}`}
                               placeholder="Rua" value={street} onChange={(e) => { setStreet(e.target.value); setErrors(prev => ({...prev, street: false})); }}
                             />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                             <input
                               className={`col-span-1 p-3 rounded-lg border bg-background ${errors.number ? "border-red-500 ring-1 ring-red-500" : "border-input"}`}
                               placeholder="Número" value={number} onChange={(e) => { setNumber(e.target.value); setErrors(prev => ({...prev, number: false})); }}
                             />
                             <input
                               className={`col-span-2 p-3 rounded-lg border bg-background ${errors.neighborhood ? "border-red-500 ring-1 ring-red-500" : "border-input"}`}
                               placeholder="Bairro" value={neighborhood} onChange={(e) => { setNeighborhood(e.target.value); setErrors(prev => ({...prev, neighborhood: false})); }}
                             />
                          </div>
                          <input
                               className={`w-full p-3 rounded-lg border border-input bg-background`}
                               placeholder="Complemento (Opcional)" value={complement} onChange={(e) => setComplement(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${errors.deliveryRegion ? "text-red-500" : ""}`}>Região de Entrega</label>
                          <p className="text-xs text-muted-foreground -mt-1">Necessário para calcular a taxa</p>
                          <div className="space-y-2">
                            {DELIVERY_REGIONS.map((region) => (
                              <button
                                key={region.id}
                                onClick={() => { handleRegionChange(region.id as any); setErrors(prev => ({...prev, deliveryRegion: false})) }}
                                className={`w-full p-3 rounded-lg border flex justify-between items-center transition-all ${deliveryRegion === region.id ? "border-primary bg-primary/5 ring-1 ring-primary" : errors.deliveryRegion ? "border-red-500 bg-red-500/5" : "border-border hover:border-primary/30"
                                  }`}
                              >
                                <span>{region.name}</span>
                                <span className="font-bold text-primary">
                                  {region.fee === null ? "À combinar" : `R$ ${region.fee.toFixed(2).replace('.', ',')}`}
                                </span>
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
                        <h3 className={`font-semibold flex items-center gap-2 ${errors.deliveryDate ? "text-red-500" : ""}`}>
                          <Calendar className="w-4 h-4 text-primary" />
                          Data de {deliveryMethod === 'retirada' ? 'Retirada' : 'Entrega'}
                        </h3>
                        <div className={errors.deliveryDate ? "ring-2 ring-red-500 rounded-lg inline-block" : ""}>
                          <DatePicker
                            date={deliveryDate}
                            setDate={(date) => {
                              setDeliveryDate(date);
                              if (date) { 
                                 scrollToSection(paymentRef);
                                 setErrors(prev => ({...prev, deliveryDate: false}));
                              }
                            }}
                            disabled={(date) => {
                              if (deliveryMethod === 'retirada') {
                                const y = date.getFullYear();
                                const m = date.getMonth();
                                const d = date.getDate();
                                return !(y === 2026 && m === 3 && (d === 2 || d === 3));
                              }
                              // For non-retirada, just disable past dates
                              return date < new Date(new Date().setHours(0, 0, 0, 0));
                            }}
                          />
                        </div>
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
                        <h3 className={`font-semibold flex items-center gap-2 ${errors.payment ? "text-red-500" : ""}`}>
                          <Wallet className="w-4 h-4 text-primary" /> Forma de Pagamento
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {PAYMENT_METHODS.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => { setSelectedPaymentMethod(method); setErrors(prev => ({...prev, payment: false})); }}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${selectedPaymentMethod?.id === method.id
                                ? "border-primary bg-primary/10 text-primary"
                                : errors.payment ? "border-red-500" : "border-border hover:border-primary/30"
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
                {checkoutStep === 'hub' && deliveryRegion && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Taxa de Entrega</span>
                    <span>
                      {isFeeToBeAgreed
                        ? "À combinar"
                        : `+ R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold mt-1">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {/* Disclaimer */}
                {isFeeToBeAgreed && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md mt-1 border border-amber-200">
                    A taxa de entrega é à combinar. O total poderá ser ajustado posteriormente.
                  </p>
                )}
              </div>

              {checkoutStep === 'review' ? (
                items.length > 0 && (
                  <Button
                    size="lg"
                    className="w-full rounded-xl font-bold text-lg h-12"
                    onClick={() => {
                      trackEvent("begin_checkout", {
                        currency: "BRL",
                        value: totalPrice,
                        items: items.map(item => ({
                          item_id: item.productId,
                          item_name: item.productName,
                          price: item.price,
                          quantity: item.quantity
                        }))
                      });
                      openCheckoutHub();
                    }}
                  >
                    Confirmar Pedido
                  </Button>
                )
              ) : (
                <Button
                  size="lg"
                  className={`w-full rounded-xl font-bold text-lg h-12 gap-2 transition-transform active:scale-[0.98] ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""} bg-[#25D366] hover:bg-[#128C7E] text-white`}
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                  {isSubmitting ? "Processando..." : "Enviar Pedido via WhatsApp"}
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
