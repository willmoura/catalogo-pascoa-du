import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingCart, ChevronLeft, ChevronRight, ZoomIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductPrice {
  id: number;
  weight: string;
  weightGrams: number;
  price: string;
  shell?: string | null;
}

interface ProductFlavor {
  flavor: {
    id: number;
    name: string;
    description: string | null;
  };
  additionalPrice: string | null;
}

interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  galleryImages: string | null;
  category?: {
    slug: string;
    name: string;
  } | null;
  prices: ProductPrice[];
  flavors: ProductFlavor[];
}

interface ProductModalProps {
  product: ProductDetails | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ProductModal({ product, isOpen, onClose, isLoading = false }: ProductModalProps) {
  const { addItem, setIsOpen: setCartOpen, openCartReview } = useCart();
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<ProductFlavor | null>(null);
  const [selectedShell, setSelectedShell] = useState<string>(""); // Changed default to empty for forced selection on ID 35
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const isOvoDeColher = product?.id === 35;

  // Parse gallery images
  const galleryImages: string[] = product?.galleryImages
    ? JSON.parse(product.galleryImages)
    : [];
  const allImages = product?.imageUrl
    ? [product.imageUrl, ...galleryImages]
    : galleryImages;

  // Helper to format weight label (1000g -> 1kg)
  const formatWeight = (grams: number) => {
    if (grams >= 1000) return `${grams / 1000}kg`;
    return `${grams}g`;
  };

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      // Default behavior for other products
      let defaultShell = "";

      if (product.category?.slug === 'ovos-trufados' && !isOvoDeColher) {
        defaultShell = "Ao Leite";
      }

      setSelectedShell(defaultShell);

      // Sort prices by weightGrams to ensure order (150g -> 1kg)
      const sortedPrices = [...product.prices].sort((a, b) => a.weightGrams - b.weightGrams);

      // Find price matching default shell and first available weight
      const defaultPrice = sortedPrices.find(p =>
        (p.shell === defaultShell || !p.shell)
      ) || sortedPrices[0];

      setSelectedPrice(defaultPrice || null);

      // Reset flavor 
      // For ovo de colher, start null to force selection. For others, maybe default?
      // Keeping consistent: reset to null or first available if mandated?
      // Original logic: setSelectedFlavor(product.flavors.length > 0 ? product.flavors[0] : null);
      // For ID 35 we want force selection, so null.
      if (isOvoDeColher) {
        setSelectedFlavor(null);
      } else {
        setSelectedFlavor(product.flavors.length > 0 ? product.flavors[0] : null);
      }

      setQuantity(1);
      setCurrentImageIndex(0);
    }
  }, [product, isOvoDeColher]);

  // Update price when shell changes (keeping same weight if possible)
  useEffect(() => {
    if (product && selectedPrice) {
      // Sort to ensure consistent lookup
      const sortedPrices = [...product.prices].sort((a, b) => a.weightGrams - b.weightGrams);

      const newPrice = sortedPrices.find(p =>
        p.weightGrams === selectedPrice.weightGrams &&
        (p.shell === selectedShell || !p.shell)
      );
      if (newPrice) {
        setSelectedPrice(newPrice);
      } else {
        // Fallback logic if needed
      }
    }
  }, [selectedShell, product, selectedPrice]);

  if (!isOpen) return null;

  const totalPrice = selectedPrice
    ? parseFloat(selectedPrice.price) * quantity +
    (selectedFlavor ? parseFloat(selectedFlavor.additionalPrice || "0") * quantity : 0)
    : 0;

  const handleAddToCart = (action: 'continue' | 'checkout') => {
    if (!product || !selectedPrice) {
      toast.error("Selecione um tamanho");
      return;
    }

    // Validation for Ovo de Colher
    if (isOvoDeColher) {
      if (!selectedShell) {
        toast.error("Selecione a casca");
        return;
      }
      if (!selectedFlavor) {
        toast.error("Selecione um sabor");
        return;
      }
    }

    const formattedWeight = formatWeight(selectedPrice.weightGrams);

    // Payload construction
    const cartItem = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.imageUrl,
      weight: formattedWeight,
      weightGrams: selectedPrice.weightGrams,
      price: parseFloat(selectedPrice.price) + (selectedFlavor ? parseFloat(selectedFlavor.additionalPrice || "0") : 0),
      quantity,
      flavor: selectedFlavor?.flavor.name,
      flavorId: selectedFlavor?.flavor.id,
      // Specific mapping for Ovo de Colher
      shell: isOvoDeColher ? selectedShell : (product.category?.slug === 'ovos-trufados' ? selectedShell : undefined),
      flavors: isOvoDeColher && selectedFlavor ? [selectedFlavor.flavor] : undefined // Pass as array for backend compatibility if needed, though flavor/flavorId is main
    };

    addItem(cartItem as any); // Type assertion if Context definition is strict, but fields match requirement

    if (action === 'continue') {
      toast.success("Adicionado ao carrinho!");
      onClose();
    } else {
      onClose();
      // Pequeno delay para garantir que o modal feche antes do drawer abrir suavemente
      setTimeout(() => {
        openCartReview();
      }, 100);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Get unique weights for display, sorted
  const uniqueWeights = product
    ? Array.from(new Set(product.prices.map(p => p.weightGrams)))
      .sort((a, b) => a - b)
    : [];

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
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-background rounded-t-3xl overflow-hidden md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full md:rounded-2xl md:max-h-[85vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto max-h-[90vh] md:max-h-[85vh]">
              {(isLoading || !product) ? (
                <div className="h-[50vh] flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Carregando detalhes...</p>
                </div>
              ) : (
                <>
                  {/* Image Gallery */}
                  <div className="relative w-full bg-secondary/30 flex items-center justify-center p-4">
                    {allImages.length > 0 ? (
                      <>
                        <motion.img
                          key={currentImageIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={allImages[currentImageIndex]}
                          alt={product.name}
                          className={`max-h-[50vh] md:max-h-[60vh] w-auto object-contain cursor-zoom-in ${isZoomed ? "scale-150" : ""}`}
                          onClick={() => setIsZoomed(!isZoomed)}
                        />

                        {/* Navigation Arrows */}
                        {allImages.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-md"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-md"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                              {allImages.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex
                                    ? "bg-primary w-4"
                                    : "bg-background/60"
                                    }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Zoom indicator */}
                        <div className="absolute bottom-4 right-4">
                          <Badge variant="secondary" className="gap-1">
                            <ZoomIn className="w-3 h-3" />
                            Toque para zoom
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--chocolate)] to-[var(--gold)] opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Title & Description */}
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {product.name}
                      </h2>
                      {product.description && (
                        <p className="text-muted-foreground">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Size Selection */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">
                        Tamanho
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex flex-wrap gap-2">
                          {uniqueWeights.map((grams) => {
                            // Find price for this weight and current shell
                            const priceForOption = product.prices.find(p =>
                              p.weightGrams === grams &&
                              (product.category?.slug === 'ovos-trufados' || isOvoDeColher ? (p.shell === selectedShell || !p.shell) : true)
                            );

                            // For Ovo de Colher, we typically have one price, but logic holds.
                            // If no price found specifically for shell (unlikely if shell is "Ao Leite" default in DB or null), show available.
                            // But for Ovo De Colher we inserted price with NO SHELL specified in DB (shell column null in script?).
                            // Wait, script inserted `weight: '550g', price: '189.90'`. Shell column typically NULL unless specified.
                            // Our logic: `(p.shell === selectedShell || !p.shell)`.
                            // If DB has NULL shell, `!p.shell` is true. So it matches any selected shell. Correct.

                            if (!priceForOption) return null;

                            return (
                              <motion.button
                                key={grams}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedPrice(priceForOption)}
                                className={`px-4 py-3 rounded-xl border-2 transition-all ${selectedPrice?.weightGrams === grams
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                                  }`}
                              >
                                <span className="block font-semibold">{formatWeight(grams)}</span>
                                <span className="text-sm text-primary font-bold">
                                  R$ {parseFloat(priceForOption.price).toFixed(2).replace(".", ",")}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Shell Selection - for Ovos Trufados OR Ovo de Colher */}
                    {(product.category?.slug === 'ovos-trufados' || isOvoDeColher) && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">
                          Escolha a Casca {isOvoDeColher && <span className="text-red-500">*</span>}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {['Ao Leite', 'Meio a Meio', 'Meio Amargo', 'Branco'].map((shell) => (
                            <motion.button
                              key={shell}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedShell(shell)}
                              className={`px-4 py-2 rounded-full border-2 transition-all ${selectedShell === shell
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                                }`}
                            >
                              {shell}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flavor Selection */}
                    {/* Special Handling for Ovo de Colher (ID 35) - Single Select / Radio */}
                    {isOvoDeColher && product.flavors.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">
                          Sabor do Recheio <span className="text-red-500">*</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {product.flavors.map((flavorItem) => (
                            <motion.button
                              key={flavorItem.flavor.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedFlavor(flavorItem)}
                              className={`px-4 py-2 rounded-full border-2 transition-all ${selectedFlavor?.flavor.id === flavorItem.flavor.id
                                ? "border-primary bg-primary"  // Filled style for selected
                                : "border-border hover:border-primary/50"
                                }`}
                            >
                              <span className={selectedFlavor?.flavor.id === flavorItem.flavor.id ? "text-primary-foreground font-medium" : ""}>
                                {flavorItem.flavor.name}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Normal Flavor Selection for other products */}
                    {!isOvoDeColher && product.flavors.length > 0 && !product.slug.includes('mini-ovos') && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">
                          Sabor do Recheio
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {product.flavors.map((flavorItem) => (
                            <motion.button
                              key={flavorItem.flavor.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedFlavor(flavorItem)}
                              className={`px-4 py-2 rounded-full border-2 transition-all ${selectedFlavor?.flavor.id === flavorItem.flavor.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                                }`}
                            >
                              {flavorItem.flavor.name}
                              {parseFloat(flavorItem.additionalPrice || "0") > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (+R$ {parseFloat(flavorItem.additionalPrice || "0").toFixed(2).replace(".", ",")})
                                </span>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sabores Inclusos - for Mini Ovos kits */}
                    {product.flavors.length > 0 && product.slug.includes('mini-ovos') && (
                      <div>
                        <h3 className="font-semibold text-[var(--gold)] mb-3 uppercase text-sm tracking-wide">
                          Sabores Inclusos
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {product.flavors.map((flavorItem) => (
                            <div
                              key={flavorItem.flavor.id}
                              className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border"
                            >
                              <div className="w-2 h-2 rounded-full bg-[var(--gold)]" />
                              <span className="text-sm text-foreground">{flavorItem.flavor.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Ideal para section */}
                        <div className="mt-4 p-4 bg-[var(--chocolate)] rounded-xl">
                          <h4 className="font-semibold text-[var(--cream)] mb-2 uppercase text-sm tracking-wide">
                            Ideal Para
                          </h4>
                          <ul className="space-y-1 text-[var(--cream)]/90 text-sm">
                            <li className="flex items-center gap-2">
                              <span>✓</span> Presentes especiais
                            </li>
                            <li className="flex items-center gap-2">
                              <span>✓</span> Degustar vários sabores
                            </li>
                            <li className="flex items-center gap-2">
                              <span>✓</span> Festas e eventos
                            </li>
                            <li className="flex items-center gap-2">
                              <span>✓</span> Lembrancinhas premium
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">
                        Quantidade
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">
                            {quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuantity(quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 p-4 bg-background border-t border-border safe-bottom">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Total</span>
                        <p className="text-2xl font-bold text-primary">
                          R$ {totalPrice.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-1 max-w-md">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1 rounded-xl border-primary text-primary hover:bg-primary/10"
                          onClick={() => handleAddToCart('continue')}
                          disabled={!selectedPrice || (isOvoDeColher && (!selectedShell || !selectedFlavor))}
                        >
                          Adicionar e continuar
                        </Button>
                        <Button
                          size="lg"
                          className="flex-1 rounded-xl gap-2 font-bold"
                          onClick={() => handleAddToCart('checkout')}
                          disabled={!selectedPrice || (isOvoDeColher && (!selectedShell || !selectedFlavor))}
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Finalizar Pedido
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
