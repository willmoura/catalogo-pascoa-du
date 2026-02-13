import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingCart, ChevronLeft, ChevronRight, ZoomIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const KIT_CONFIG = {
  12: {
    unitPrice: 69.90,
    requiredCount: 4,
    flavors: ["Ovomaltine", "Kinder Bueno", "Ferrero Rocher", "Ninho com Nutella"]
  },
  13: {
    unitPrice: 99.90,
    requiredCount: 6,
    flavors: ["Ovomaltine", "Kinder Bueno", "Ferrero Rocher", "Ninho com Nutella", "Sensação", "Laka Oreo com Nutella"]
  },
  34: {
    unitPrice: 199.90,
    requiredCount: 3,
    flavors: ["Ovomaltine", "Kinder Bueno", "Ferrero Rocher", "Ninho com Nutella", "Sensação", "Laka Oreo com Nutella"]
  }
} as const;

const normalizeName = (name: string) => {
  return name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

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
  const isKit = product ? [12, 13, 34].includes(product.id) : false;
  const kitConfig = isKit && product ? KIT_CONFIG[product.id as keyof typeof KIT_CONFIG] : null;

  // State for Custom Kits
  const [customSelections, setCustomSelections] = useState<Record<string, number>>({});

  const totalSelected = Object.values(customSelections).reduce((a, b) => a + b, 0);

  const handleAdjustFlavor = (flavorName: string, delta: number) => {
    if (!kitConfig) return;

    setCustomSelections(prev => {
      const currentQty = prev[flavorName] || 0;
      const newQty = currentQty + delta;

      if (newQty < 0) return prev;
      if (delta > 0 && totalSelected >= kitConfig.requiredCount) return prev; // Block exceeding

      const next = { ...prev, [flavorName]: newQty };
      if (newQty === 0) delete next[flavorName];
      return next;
    });
  };

  const clearSelections = () => {
    setCustomSelections({});
  };

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
      if (isOvoDeColher) {
        setSelectedFlavor(null);
      } else {
        setSelectedFlavor(product.flavors.length > 0 ? product.flavors[0] : null);
      }

      setQuantity(1);
      setCurrentImageIndex(0);
      setCustomSelections({}); // Reset custom selections
    }
  }, [product, isOvoDeColher]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentImageIndex, allImages.length]); // Dependencies for closure stability handled by functional updates in prev/nextImage, but good practice to include


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
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPrice = selectedPrice
    ? parseFloat(selectedPrice.price) * quantity +
    (selectedFlavor ? parseFloat(selectedFlavor.additionalPrice || "0") * quantity : 0)
    : 0;

  const handleAddToCart = (action: 'continue' | 'checkout') => {
    // 1. Validation for Kits (12, 13, 34)
    if (isKit && kitConfig) {
      if (totalSelected !== kitConfig.requiredCount) {
        toast.error(`Selecione exatamente ${kitConfig.requiredCount} sabores`);
        return;
      }
    }
    // 2. Validation for Ovo de Colher
    else if (isOvoDeColher) {
      if (!selectedShell) {
        toast.error("Selecione a casca");
        return;
      }
      if (!selectedFlavor) {
        toast.error("Selecione um sabor");
        return;
      }
    }
    // 3. Validation for Standard Products
    else if (!product || !selectedPrice) {
      toast.error("Selecione um tamanho");
      return;
    }

    let cartItem: any;

    if (isKit && kitConfig && product) {
      // Build Flavor Summary and Variant Key
      const selectedFlavorEntries = Object.entries(customSelections)
        .filter(([_, qty]) => qty > 0)
        .sort((a, b) => normalizeName(a[0]).localeCompare(normalizeName(b[0])));

      // 1. Variant Key: kit|12|ferrero:2|ninho:2
      const variantKeyParts = selectedFlavorEntries.map(([name, qty]) => `${normalizeName(name)}:${qty}`);
      const variantKey = `kit|${product.id}|${variantKeyParts.join('|')}`;

      // 2. Flavor Display String: "Sabores (4): Ferrero x2, Ninho x2"
      const flavorSummary = selectedFlavorEntries
        .map(([name, qty]) => `${name} x${qty}`)
        .join(', ');

      const flavorDisplay = `Sabores (${kitConfig.requiredCount}): ${flavorSummary}`;

      // 3. Cart Items
      cartItem = {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: product.imageUrl,
        weight: 'Kit', // Fixed label
        weightGrams: 0, // Not relevant for kits price-wise
        price: kitConfig.unitPrice,
        quantity,
        flavor: flavorDisplay, // For display compatibility
        variantKey: variantKey // For strict grouping
      };

    } else if (product && selectedPrice) {
      const formattedWeight = formatWeight(selectedPrice.weightGrams);

      cartItem = {
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
    }

    if (!cartItem) return;

    addItem(cartItem);

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
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl overflow-hidden md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full md:rounded-2xl max-h-[90dvh] md:max-h-[85vh] flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {(isLoading || !product) ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando detalhes...</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y">
                  {/* Image Gallery */}
                  {/* Image Gallery */}
                  <div className="relative w-full bg-secondary/30 flex flex-col items-center justify-center p-4">
                    {allImages.length > 0 ? (
                      <>
                        <div className="relative w-full h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
                          <AnimatePresence initial={false} mode="wait">
                            <motion.div
                              key={currentImageIndex}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3 }}
                              className="w-full h-full flex items-center justify-center p-2"
                              onTouchStart={(e) => {
                                const touch = e.targetTouches[0];
                                e.currentTarget.dataset.touchStartX = touch.clientX.toString();
                                e.currentTarget.dataset.touchStartY = touch.clientY.toString();
                              }}
                              onTouchEnd={(e) => {
                                const touchStart = parseFloat(e.currentTarget.dataset.touchStartX || "0");
                                const touchStartY = parseFloat(e.currentTarget.dataset.touchStartY || "0");
                                const touchEnd = e.changedTouches[0].clientX;
                                const touchEndY = e.changedTouches[0].clientY;

                                const diffX = touchStart - touchEnd;
                                const diffY = Math.abs(touchStartY - touchEndY);

                                // Only trigger if horizontal swipe is significantly larger than vertical (scrolling)
                                if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY) {
                                  if (diffX > 0) {
                                    nextImage();
                                  } else {
                                    prevImage();
                                  }
                                }
                              }}
                            >
                              <ResponsiveImage
                                imageId={allImages[currentImageIndex]}
                                alt={`${product.name} - Imagem ${currentImageIndex + 1}`}
                                className="w-auto h-auto max-h-full max-w-full bg-transparent"
                                imageClassName={`object-contain cursor-zoom-in ${isZoomed ? "scale-150" : ""}`}
                                onClick={() => setIsZoomed(!isZoomed)}
                                priority={true}
                              />
                            </motion.div>
                          </AnimatePresence>

                          {/* Navigation Arrows */}
                          {allImages.length > 1 && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background transition-colors z-10"
                                aria-label="Imagem anterior"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background transition-colors z-10"
                                aria-label="Próxima imagem"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </>
                          )}

                          {/* Zoom indicator */}
                          <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
                            <Badge variant="secondary" className="gap-1 shadow-sm">
                              <ZoomIn className="w-3 h-3" />
                              Toque para zoom
                            </Badge>
                          </div>
                        </div>

                        {/* Thumbnails */}
                        {allImages.length > 1 && (
                          <div className="flex gap-2 mt-4 overflow-x-auto w-full justify-center px-4 py-2 scrollbar-none">
                            {allImages.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${idx === currentImageIndex
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-transparent opacity-60 hover:opacity-100"
                                  }`}
                                aria-label={`Ver imagem ${idx + 1}`}
                                aria-current={idx === currentImageIndex}
                              >
                                <img
                                  src={img}
                                  alt={`Miniatura ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-[50vh] md:h-[60vh] flex items-center justify-center">
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

                    {/* Size Selection - Hide for Kits */}
                    {!isKit && (
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
                    )}

                    {/* Shell Selection - for Ovos Trufados OR Ovo de Colher. HIDE for Kits. */}
                    {!isKit && (product.category?.slug === 'ovos-trufados' || isOvoDeColher) && (
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

                    {/* KIT FLAVOR SELECTION (IDs 12, 13, 34) */}
                    {isKit && kitConfig && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">
                            Monte seu Kit
                            <span className="text-muted-foreground ml-2 text-sm font-normal">
                              (Escolha {kitConfig.requiredCount} sabores)
                            </span>
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${totalSelected === kitConfig.requiredCount ? "text-green-600" : "text-amber-600"}`}>
                              {totalSelected} de {kitConfig.requiredCount}
                            </span>
                            {totalSelected > 0 && (
                              <button
                                onClick={clearSelections}
                                className="text-xs text-muted-foreground hover:text-destructive underline"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {kitConfig.flavors.map((flavorName) => {
                            const count = customSelections[flavorName] || 0;
                            const isMaxReached = totalSelected >= kitConfig.requiredCount;

                            return (
                              <div key={flavorName} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/50">
                                <span className="font-medium">{flavorName}</span>
                                <div className="flex items-center gap-3">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => handleAdjustFlavor(flavorName, -1)}
                                    disabled={count === 0}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className={`w-6 text-center font-bold ${count > 0 ? "text-primary" : "text-muted-foreground"}`}>
                                    {count}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => handleAdjustFlavor(flavorName, 1)}
                                    disabled={isMaxReached}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {totalSelected < kitConfig.requiredCount && (
                          <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
                            Faltam {kitConfig.requiredCount - totalSelected} sabores para completar
                          </p>
                        )}
                      </div>
                    )}

                    {/* Flavor Selection */}
                    {/* Special Handling for Ovo de Colher (ID 35) - Single Select / Radio */}
                    {!isKit && isOvoDeColher && product.flavors.length > 0 && (
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
                    {!isKit && !isOvoDeColher && product.flavors.length > 0 && !product.slug.includes('mini-ovos') && (
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

                    {/* Sabores Inclusos - for Mini Ovos kits (that are NOT 12,13,34 if any exist, or backward compat) */}
                    {/* The new kits IDs 12, 13, 34 have 'mini-ovos' in slug usually but we use Custom Selection now. */}
                    {/* So hide this block if isKit. */}
                    {!isKit && product.flavors.length > 0 && product.slug.includes('mini-ovos') && (
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

                </div>
                {/* Footer */}
                <div className="p-4 bg-background border-t border-border safe-bottom z-20">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full sm:flex-[1] sm:justify-start">
                      <span className="text-sm text-muted-foreground sm:mr-2">Total</span>
                      <p className="text-2xl font-bold text-primary inline-block">
                        {isKit && kitConfig ? (
                          `R$ ${(kitConfig.unitPrice * quantity).toFixed(2).replace(".", ",")}`
                        ) : (
                          `R$ ${totalPrice.toFixed(2).replace(".", ",")}`
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:flex-[2]">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 w-full rounded-xl border-primary text-primary hover:bg-primary/10 h-12 whitespace-nowrap"
                        onClick={() => handleAddToCart('continue')}
                        disabled={
                          isKit ? totalSelected !== kitConfig?.requiredCount :
                            (!selectedPrice || (isOvoDeColher && (!selectedShell || !selectedFlavor)))
                        }
                      >
                        Adicionar
                      </Button>
                      <Button
                        size="lg"
                        className="flex-1 w-full rounded-xl gap-2 font-bold h-12 whitespace-nowrap"
                        onClick={() => handleAddToCart('checkout')}
                        disabled={
                          isKit ? totalSelected !== kitConfig?.requiredCount :
                            (!selectedPrice || (isOvoDeColher && (!selectedShell || !selectedFlavor)))
                        }
                      >
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        Finalizar
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )
      }
    </AnimatePresence >
  );
}
