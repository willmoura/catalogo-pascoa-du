import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ShoppingCart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

// Dados das opções
const WEIGHTS = [
  { weight: "400g", price: 99.90 },
  { weight: "600g", price: 149.90 },
  { weight: "800g", price: 189.90 },
];

const SHELL_TYPES = [
  { id: "unica", name: "Casca Única", description: "As duas metades do mesmo chocolate" },
  { id: "duo", name: "Duo", description: "Uma metade de cada chocolate" },
];

const SHELLS = [
  { id: "ao-leite", name: "Ao Leite", description: "Chocolate ao leite cremoso", color: "#8B4513" },
  { id: "branco", name: "Branco", description: "Chocolate branco suave", color: "#FFF8DC" },
  { id: "meio-amargo", name: "Meio Amargo", description: "50% cacau, equilibrado", color: "#5D3A1A" },
];

const FILLINGS = [
  "Franuí", "Kinder Bueno", "Ferrero Rocher", "Ninho com Nutella",
  "Maracujá com Nutella", "Maracujá", "Ovomaltine", "Strogonoff de Nozes",
  "Alpino", "Doce de Leite", "Prestígio", "Sensação", "Charge", "Trufa Tradicional",
  "Laka Oreo"
];

interface CustomizeEggProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomizeEgg({ isOpen, onClose }: CustomizeEggProps) {
  const [step, setStep] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<typeof WEIGHTS[0] | null>(null);
  const [selectedShellType, setSelectedShellType] = useState<typeof SHELL_TYPES[0] | null>(null);
  const [selectedShell, setSelectedShell] = useState<typeof SHELLS[0] | null>(null);
  const [selectedShell2, setSelectedShell2] = useState<typeof SHELLS[0] | null>(null);
  const [selectedFilling, setSelectedFilling] = useState<string | null>(null);
  const [observations, setObservations] = useState("");
  const { addItem } = useCart();

  const totalSteps = 4;

  const canProceed = () => {
    switch (step) {
      case 1: return selectedWeight !== null;
      case 2: return selectedShellType !== null;
      case 3: 
        if (selectedShellType?.id === "duo") {
          return selectedShell !== null && selectedShell2 !== null && selectedShell.id !== selectedShell2.id;
        }
        return selectedShell !== null;
      case 4: return selectedFilling !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const resetState = () => {
    setStep(1);
    setSelectedWeight(null);
    setSelectedShellType(null);
    setSelectedShell(null);
    setSelectedShell2(null);
    setSelectedFilling(null);
    setObservations("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getShellDescription = () => {
    if (selectedShellType?.id === "duo" && selectedShell && selectedShell2) {
      return `${selectedShell.name} + ${selectedShell2.name}`;
    }
    return selectedShell?.name || "";
  };

  const formatWhatsAppMessage = () => {
    if (!selectedWeight || !selectedShellType || !selectedShell || !selectedFilling) return "";
    
    let message = `*PEDIDO PERSONALIZADO - OVOS DE PÁSCOA DU*\n\n`;
    message += `*Meu Ovo Personalizado*\n\n`;
    message += `• Peso: ${selectedWeight.weight}\n`;
    message += `• Tipo: ${selectedShellType.name}\n`;
    message += `• Casca: ${getShellDescription()}\n`;
    message += `• Recheio: ${selectedFilling}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `*TOTAL: R$ ${selectedWeight.price.toFixed(2).replace('.', ',')}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    if (observations) {
      message += `Observações: ${observations}\n\n`;
    }
    message += `Olá! Gostaria de fazer este pedido personalizado.`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsApp = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "5511999999999";
    const message = formatWhatsAppMessage();
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
    handleClose();
  };

  const handleAddToCart = () => {
    if (!selectedWeight || !selectedShellType || !selectedShell || !selectedFilling) return;
    
    addItem({
      productId: Date.now(),
      productName: "Ovo Personalizado",
      productSlug: `personalizado-${selectedShellType.id}-${selectedShell.id}-${selectedFilling.toLowerCase().replace(/\s+/g, '-')}`,
      imageUrl: null,
      price: selectedWeight.price,
      weight: selectedWeight.weight,
      weightGrams: parseInt(selectedWeight.weight),
      flavor: `${getShellDescription()} - ${selectedFilling}`,
      quantity: 1,
    });
    handleClose();
  };

  if (!isOpen) return null;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">Monte seu Ovo</h2>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {step}/{totalSteps}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait" custom={step}>
            {/* Step 1: Weight */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-amber-900 mb-2">Escolha o Peso</h3>
                <p className="text-gray-600 mb-6">Selecione o tamanho ideal para você</p>
                
                <div className="grid grid-cols-3 gap-3">
                  {WEIGHTS.map((item) => (
                    <motion.button
                      key={item.weight}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedWeight(item)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedWeight?.weight === item.weight
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      {selectedWeight?.weight === item.weight && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                      <div className="text-2xl font-bold text-amber-900">{item.weight}</div>
                      <div className="text-amber-600 font-semibold mt-1">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Shell Type (Única ou Duo) */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-amber-900 mb-2">Tipo de Casca</h3>
                <p className="text-gray-600 mb-6">Escolha se quer cascas iguais ou diferentes</p>
                
                <div className="space-y-3">
                  {SHELL_TYPES.map((type) => (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedShellType(type);
                        // Reset shell selections when changing type
                        setSelectedShell(null);
                        setSelectedShell2(null);
                      }}
                      className={`relative w-full p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        selectedShellType?.id === type.id
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {type.id === "unica" ? (
                          <div className="w-14 h-14 rounded-full bg-[#8B4513] border-2 border-gray-300" />
                        ) : (
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-300 flex">
                            <div className="w-1/2 h-full bg-[#8B4513]" />
                            <div className="w-1/2 h-full bg-[#FFF8DC]" />
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-amber-900 text-lg">{type.name}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                      {selectedShellType?.id === type.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Shell Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {selectedShellType?.id === "duo" ? (
                  <>
                    <h3 className="text-xl font-bold text-amber-900 mb-2">Escolha as Cascas</h3>
                    <p className="text-gray-600 mb-6">Selecione dois chocolates diferentes</p>
                    
                    {/* First Shell */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-amber-800 mb-3">Primeira metade:</p>
                      <div className="space-y-2">
                        {SHELLS.map((shell) => (
                          <motion.button
                            key={`shell1-${shell.id}`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedShell(shell)}
                            disabled={selectedShell2?.id === shell.id}
                            className={`relative w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                              selectedShell?.id === shell.id
                                ? "border-amber-500 bg-amber-50"
                                : selectedShell2?.id === shell.id
                                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-200 hover:border-amber-300"
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: shell.color }}
                            />
                            <div className="text-left flex-1">
                              <div className="font-bold text-amber-900">{shell.name}</div>
                            </div>
                            {selectedShell?.id === shell.id && (
                              <Check className="w-5 h-5 text-amber-500" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Second Shell */}
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-3">Segunda metade:</p>
                      <div className="space-y-2">
                        {SHELLS.map((shell) => (
                          <motion.button
                            key={`shell2-${shell.id}`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedShell2(shell)}
                            disabled={selectedShell?.id === shell.id}
                            className={`relative w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                              selectedShell2?.id === shell.id
                                ? "border-amber-500 bg-amber-50"
                                : selectedShell?.id === shell.id
                                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-200 hover:border-amber-300"
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: shell.color }}
                            />
                            <div className="text-left flex-1">
                              <div className="font-bold text-amber-900">{shell.name}</div>
                            </div>
                            {selectedShell2?.id === shell.id && (
                              <Check className="w-5 h-5 text-amber-500" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-amber-900 mb-2">Escolha a Casca</h3>
                    <p className="text-gray-600 mb-6">Selecione o tipo de chocolate</p>
                    
                    <div className="space-y-3">
                      {SHELLS.map((shell) => (
                        <motion.button
                          key={shell.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedShell(shell)}
                          className={`relative w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                            selectedShell?.id === shell.id
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-amber-300"
                          }`}
                        >
                          <div
                            className="w-12 h-12 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: shell.color }}
                          />
                          <div className="text-left flex-1">
                            <div className="font-bold text-amber-900">{shell.name}</div>
                            <div className="text-sm text-gray-600">{shell.description}</div>
                          </div>
                          {selectedShell?.id === shell.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 4: Filling */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-amber-900 mb-2">Escolha o Recheio</h3>
                <p className="text-gray-600 mb-6">Selecione seu sabor favorito</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {FILLINGS.map((filling) => (
                    <motion.button
                      key={filling}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedFilling(filling)}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        selectedFilling === filling
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      <span className="font-medium text-amber-900">{filling}</span>
                      {selectedFilling === filling && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary Bar */}
        {selectedWeight && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-amber-50 border-t border-amber-200 px-6 py-3"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="text-amber-800">
                {selectedWeight && <span className="mr-2">{selectedWeight.weight}</span>}
                {selectedShellType && <span className="mr-2">• {selectedShellType.name}</span>}
                {selectedShell && <span className="mr-2">• {getShellDescription()}</span>}
                {selectedFilling && <span>• {selectedFilling}</span>}
              </div>
              <div className="font-bold text-amber-900">
                R$ {selectedWeight.price.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-white">
          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Observations field */}
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observações (opcional): mensagem especial, alergias..."
                className="w-full p-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={2}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!canProceed()}
                  variant="outline"
                  className="py-6 text-amber-700 border-amber-300 hover:bg-amber-50 rounded-xl"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Carrinho
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  disabled={!canProceed()}
                  className="py-6 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CustomizeEgg;
