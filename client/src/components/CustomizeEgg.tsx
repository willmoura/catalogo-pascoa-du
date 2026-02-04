import { useState, useMemo } from "react";
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

const FINISH_TYPES = [
  { id: "pedacos", name: "Com Pedaços", description: "Casca com pedaços de castanhas ou amêndoas" },
  { id: "recheada", name: "Recheada", description: "Casca com recheio cremoso" },
];

// Pedaços disponíveis por tipo de casca
// Oreo e Laka Oreo só disponíveis para casca branca
const PIECES_OPTIONS_BASE = ["Avelã", "Castanha de Caju"];
const PIECES_OPTIONS_WHITE_ONLY = ["Laka Oreo"];

const getPiecesOptionsForShell = (shellId: string | undefined) => {
  if (shellId === "branco") {
    return [...PIECES_OPTIONS_BASE, ...PIECES_OPTIONS_WHITE_ONLY];
  }
  return PIECES_OPTIONS_BASE;
};

const FILLINGS = [
  "Franuí", "Kinder Bueno", "Ferrero Rocher", "Ninho com Nutella",
  "Maracujá com Nutella", "Maracujá", "Ovomaltine", "Strogonoff de Nozes",
  "Alpino", "Doce de Leite", "Prestígio", "Sensação", "Charge", "Trufa Tradicional",
  "Laka Oreo"
];

interface ShellConfig {
  shell: typeof SHELLS[0] | null;
  finishType: typeof FINISH_TYPES[0] | null;
  pieces: string | null;
  filling: string | null;
}

interface CustomizeEggProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomizeEgg({ isOpen, onClose }: CustomizeEggProps) {
  const [step, setStep] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<typeof WEIGHTS[0] | null>(null);
  const [selectedShellType, setSelectedShellType] = useState<typeof SHELL_TYPES[0] | null>(null);
  
  // Configuração para cada casca
  const [shell1Config, setShell1Config] = useState<ShellConfig>({
    shell: null,
    finishType: null,
    pieces: null,
    filling: null,
  });
  const [shell2Config, setShell2Config] = useState<ShellConfig>({
    shell: null,
    finishType: null,
    pieces: null,
    filling: null,
  });
  
  const [observations, setObservations] = useState("");
  const { addItem } = useCart();

  // Calcular se precisa de etapa de recheio
  const needsFillingStep = useMemo(() => {
    if (selectedShellType?.id === "duo") {
      return shell1Config.finishType?.id === "recheada" || shell2Config.finishType?.id === "recheada";
    }
    return shell1Config.finishType?.id === "recheada";
  }, [selectedShellType, shell1Config.finishType, shell2Config.finishType]);

  // Calcular total de etapas dinamicamente
  const totalSteps = useMemo(() => {
    // Etapa 1: Peso
    // Etapa 2: Tipo de Casca (Única ou Duo)
    // Etapa 3: Escolha das Cascas (chocolate)
    // Etapa 4: Tipo de Acabamento (pedaços ou recheada)
    // Etapa 5: Escolha de Pedaços (se aplicável)
    // Etapa 6: Escolha de Recheio (se aplicável)
    // Etapa Final: Resumo do Pedido
    
    let steps = 5; // Base: Peso, Tipo, Cascas, Acabamento + Resumo
    
    // Se alguma casca tem pedaços, adiciona etapa de pedaços
    const hasPieces = shell1Config.finishType?.id === "pedacos" || 
                      (selectedShellType?.id === "duo" && shell2Config.finishType?.id === "pedacos");
    if (hasPieces) steps++;
    
    // Se alguma casca é recheada, adiciona etapa de recheio
    if (needsFillingStep) steps++;
    
    return steps;
  }, [selectedShellType, shell1Config.finishType, shell2Config.finishType, needsFillingStep]);

  // Determinar qual é a etapa atual baseado no contexto
  const getStepContent = () => {
    const hasPieces = shell1Config.finishType?.id === "pedacos" || 
                      (selectedShellType?.id === "duo" && shell2Config.finishType?.id === "pedacos");
    
    switch (step) {
      case 1: return "weight";
      case 2: return "shellType";
      case 3: return "shells";
      case 4: return "finishType";
      case 5: {
        if (hasPieces) return "pieces";
        if (needsFillingStep) return "filling";
        return "summary";
      }
      case 6: {
        if (hasPieces && needsFillingStep) return "filling";
        return "summary";
      }
      case 7: return "summary";
      default: return "summary";
    }
  };

  const currentStepContent = getStepContent();

  const canProceed = () => {
    switch (currentStepContent) {
      case "weight": return selectedWeight !== null;
      case "shellType": return selectedShellType !== null;
      case "shells": 
        if (selectedShellType?.id === "duo") {
          return shell1Config.shell !== null && shell2Config.shell !== null && 
                 shell1Config.shell.id !== shell2Config.shell.id;
        }
        return shell1Config.shell !== null;
      case "finishType":
        if (selectedShellType?.id === "duo") {
          return shell1Config.finishType !== null && shell2Config.finishType !== null;
        }
        return shell1Config.finishType !== null;
      case "pieces": {
        const shell1NeedsPieces = shell1Config.finishType?.id === "pedacos";
        const shell2NeedsPieces = selectedShellType?.id === "duo" && shell2Config.finishType?.id === "pedacos";
        
        if (shell1NeedsPieces && !shell1Config.pieces) return false;
        if (shell2NeedsPieces && !shell2Config.pieces) return false;
        return true;
      }
      case "filling": {
        const shell1NeedsFilling = shell1Config.finishType?.id === "recheada";
        const shell2NeedsFilling = selectedShellType?.id === "duo" && shell2Config.finishType?.id === "recheada";
        
        if (shell1NeedsFilling && !shell1Config.filling) return false;
        if (shell2NeedsFilling && !shell2Config.filling) return false;
        return true;
      }
      default: return true;
    }
  };

  const isLastStep = () => {
    return step === totalSteps;
  };

  const handleNext = () => {
    if (canProceed() && !isLastStep()) {
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
    setShell1Config({ shell: null, finishType: null, pieces: null, filling: null });
    setShell2Config({ shell: null, finishType: null, pieces: null, filling: null });
    setObservations("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getShellDescription = () => {
    if (selectedShellType?.id === "duo" && shell1Config.shell && shell2Config.shell) {
      return `${shell1Config.shell.name} + ${shell2Config.shell.name}`;
    }
    return shell1Config.shell?.name || "";
  };

  const getFinishDescription = () => {
    if (selectedShellType?.id === "duo") {
      const finish1 = shell1Config.finishType?.id === "pedacos" 
        ? `${shell1Config.pieces}` 
        : shell1Config.filling;
      const finish2 = shell2Config.finishType?.id === "pedacos" 
        ? `${shell2Config.pieces}` 
        : shell2Config.filling;
      return `${finish1} / ${finish2}`;
    }
    return shell1Config.finishType?.id === "pedacos" 
      ? shell1Config.pieces 
      : shell1Config.filling;
  };

  const formatWhatsAppMessage = () => {
    if (!selectedWeight || !selectedShellType || !shell1Config.shell || !shell1Config.finishType) return "";
    
    let message = `*PEDIDO PERSONALIZADO - OVOS DE PÁSCOA DU*\n\n`;
    message += `*Meu Ovo Personalizado*\n\n`;
    message += `• Peso: ${selectedWeight.weight}\n`;
    message += `• Tipo: ${selectedShellType.name}\n`;
    message += `• Casca: ${getShellDescription()}\n`;
    
    if (selectedShellType.id === "duo") {
      message += `\n*Primeira metade (${shell1Config.shell.name}):*\n`;
      if (shell1Config.finishType.id === "pedacos") {
        message += `  - Com pedaços de ${shell1Config.pieces}\n`;
      } else {
        message += `  - Recheio: ${shell1Config.filling}\n`;
      }
      
      message += `\n*Segunda metade (${shell2Config.shell?.name}):*\n`;
      if (shell2Config.finishType?.id === "pedacos") {
        message += `  - Com pedaços de ${shell2Config.pieces}\n`;
      } else {
        message += `  - Recheio: ${shell2Config.filling}\n`;
      }
    } else {
      if (shell1Config.finishType.id === "pedacos") {
        message += `• Acabamento: Com pedaços de ${shell1Config.pieces}\n`;
      } else {
        message += `• Recheio: ${shell1Config.filling}\n`;
      }
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━\n`;
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
    if (!selectedWeight || !selectedShellType || !shell1Config.shell || !shell1Config.finishType) return;
    
    const finishDesc = getFinishDescription();
    
    addItem({
      productId: Date.now(),
      productName: "Ovo Personalizado",
      productSlug: `personalizado-${Date.now()}`,
      imageUrl: null,
      price: selectedWeight.price,
      weight: selectedWeight.weight,
      weightGrams: parseInt(selectedWeight.weight),
      flavor: `${getShellDescription()} - ${finishDesc}`,
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

  // Renderizar barra de progresso segmentada
  const renderProgressBar = () => {
    const segments = [];
    for (let i = 1; i <= totalSteps; i++) {
      segments.push(
        <div
          key={i}
          className={`flex-1 h-2 rounded-full transition-all duration-300 ${
            i <= step ? "bg-white" : "bg-white/30"
          }`}
        />
      );
    }
    return (
      <div className="flex gap-2 mt-4">
        {segments}
      </div>
    );
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
          
          {/* Progress Bar Segmentada */}
          {renderProgressBar()}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait" custom={step}>
            {/* Step: Weight */}
            {currentStepContent === "weight" && (
              <motion.div
                key="weight"
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

            {/* Step: Shell Type (Única ou Duo) */}
            {currentStepContent === "shellType" && (
              <motion.div
                key="shellType"
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
                        // Reset configs when changing type
                        setShell1Config({ shell: null, finishType: null, pieces: null, filling: null });
                        setShell2Config({ shell: null, finishType: null, pieces: null, filling: null });
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

            {/* Step: Shells Selection */}
            {currentStepContent === "shells" && (
              <motion.div
                key="shells"
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
                            onClick={() => setShell1Config(prev => ({ ...prev, shell }))}
                            disabled={shell2Config.shell?.id === shell.id}
                            className={`relative w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                              shell1Config.shell?.id === shell.id
                                ? "border-amber-500 bg-amber-50"
                                : shell2Config.shell?.id === shell.id
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
                            {shell1Config.shell?.id === shell.id && (
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
                            onClick={() => setShell2Config(prev => ({ ...prev, shell }))}
                            disabled={shell1Config.shell?.id === shell.id}
                            className={`relative w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                              shell2Config.shell?.id === shell.id
                                ? "border-amber-500 bg-amber-50"
                                : shell1Config.shell?.id === shell.id
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
                            {shell2Config.shell?.id === shell.id && (
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
                          onClick={() => setShell1Config(prev => ({ ...prev, shell }))}
                          className={`relative w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                            shell1Config.shell?.id === shell.id
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
                          {shell1Config.shell?.id === shell.id && (
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

            {/* Step: Finish Type (Pedaços ou Recheada) */}
            {currentStepContent === "finishType" && (
              <motion.div
                key="finishType"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-amber-900 mb-2">Tipo de Acabamento</h3>
                <p className="text-gray-600 mb-6">Escolha o acabamento para cada casca</p>
                
                {selectedShellType?.id === "duo" ? (
                  <>
                    {/* First Shell Finish */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-amber-800 mb-3">
                        {shell1Config.shell?.name}:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {FINISH_TYPES.map((finish) => (
                          <motion.button
                            key={`finish1-${finish.id}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShell1Config(prev => ({ 
                              ...prev, 
                              finishType: finish,
                              pieces: null,
                              filling: null 
                            }))}
                            className={`relative p-4 rounded-xl border-2 transition-all ${
                              shell1Config.finishType?.id === finish.id
                                ? "border-amber-500 bg-amber-50"
                                : "border-gray-200 hover:border-amber-300"
                            }`}
                          >
                            {shell1Config.finishType?.id === finish.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                            <div className="font-bold text-amber-900">{finish.name}</div>
                            <div className="text-xs text-gray-600 mt-1">{finish.description}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Second Shell Finish */}
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-3">
                        {shell2Config.shell?.name}:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {FINISH_TYPES.map((finish) => (
                          <motion.button
                            key={`finish2-${finish.id}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShell2Config(prev => ({ 
                              ...prev, 
                              finishType: finish,
                              pieces: null,
                              filling: null 
                            }))}
                            className={`relative p-4 rounded-xl border-2 transition-all ${
                              shell2Config.finishType?.id === finish.id
                                ? "border-amber-500 bg-amber-50"
                                : "border-gray-200 hover:border-amber-300"
                            }`}
                          >
                            {shell2Config.finishType?.id === finish.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                            <div className="font-bold text-amber-900">{finish.name}</div>
                            <div className="text-xs text-gray-600 mt-1">{finish.description}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {FINISH_TYPES.map((finish) => (
                      <motion.button
                        key={finish.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShell1Config(prev => ({ 
                          ...prev, 
                          finishType: finish,
                          pieces: null,
                          filling: null 
                        }))}
                        className={`relative p-5 rounded-xl border-2 transition-all ${
                          shell1Config.finishType?.id === finish.id
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-amber-300"
                        }`}
                      >
                        {shell1Config.finishType?.id === finish.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                        <div className="text-lg font-bold text-amber-900">{finish.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{finish.description}</div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step: Pieces Selection */}
            {currentStepContent === "pieces" && (
              <motion.div
                key="pieces"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-amber-900 mb-2">Escolha os Pedaços</h3>
                <p className="text-gray-600 mb-6">Selecione o tipo de pedaços para cada casca</p>
                
                {/* Shell 1 Pieces (if applicable) */}
                {shell1Config.finishType?.id === "pedacos" && (
                  <div className={selectedShellType?.id === "duo" && shell2Config.finishType?.id === "pedacos" ? "mb-6" : ""}>
                    {selectedShellType?.id === "duo" && (
                      <p className="text-sm font-semibold text-amber-800 mb-3">
                        {shell1Config.shell?.name}:
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {getPiecesOptionsForShell(shell1Config.shell?.id).map((piece) => (
                        <motion.button
                          key={`piece1-${piece}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShell1Config(prev => ({ ...prev, pieces: piece }))}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            shell1Config.pieces === piece
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-amber-300"
                          }`}
                        >
                          {shell1Config.pieces === piece && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                          <div className="font-bold text-amber-900">{piece}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shell 2 Pieces (if applicable) */}
                {selectedShellType?.id === "duo" && shell2Config.finishType?.id === "pedacos" && (
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-3">
                      {shell2Config.shell?.name}:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {getPiecesOptionsForShell(shell2Config.shell?.id).map((piece) => (
                        <motion.button
                          key={`piece2-${piece}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShell2Config(prev => ({ ...prev, pieces: piece }))}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            shell2Config.pieces === piece
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-amber-300"
                          }`}
                        >
                          {shell2Config.pieces === piece && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                          <div className="font-bold text-amber-900">{piece}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step: Filling Selection */}
            {currentStepContent === "filling" && (
              <motion.div
                key="filling"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-amber-900 mb-2">Escolha o Recheio</h3>
                <p className="text-gray-600 mb-6">Selecione o sabor do recheio</p>
                
                {/* Shell 1 Filling (if applicable) */}
                {shell1Config.finishType?.id === "recheada" && (
                  <div className={selectedShellType?.id === "duo" && shell2Config.finishType?.id === "recheada" ? "mb-6" : ""}>
                    {selectedShellType?.id === "duo" && (
                      <p className="text-sm font-semibold text-amber-800 mb-3">
                        {shell1Config.shell?.name}:
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {FILLINGS.map((filling) => (
                        <motion.button
                          key={`filling1-${filling}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShell1Config(prev => ({ ...prev, filling }))}
                          className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                            shell1Config.filling === filling
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-amber-300"
                          }`}
                        >
                          <span className="font-medium text-amber-900">{filling}</span>
                          {shell1Config.filling === filling && (
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
                  </div>
                )}

                {/* Shell 2 Filling (if applicable) */}
                {selectedShellType?.id === "duo" && shell2Config.finishType?.id === "recheada" && (
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-3">
                      {shell2Config.shell?.name}:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FILLINGS.map((filling) => (
                        <motion.button
                          key={`filling2-${filling}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShell2Config(prev => ({ ...prev, filling }))}
                          className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                            shell2Config.filling === filling
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-amber-300"
                          }`}
                        >
                          <span className="font-medium text-amber-900">{filling}</span>
                          {shell2Config.filling === filling && (
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
                  </div>
                )}
              </motion.div>
            )}

            {/* Step: Summary - Resumo do Pedido */}
            {currentStepContent === "summary" && (
              <motion.div
                key="summary"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-amber-900 mb-2">Resumo do Pedido</h3>
                <p className="text-gray-600 mb-4">Revise suas escolhas antes de finalizar</p>
                <p className="text-sm text-amber-700 bg-amber-100 p-3 rounded-lg mb-4">
                  Finalize pelo WhatsApp ou adicione ao carrinho se quiser escolher mais ovos.
                </p>
                
                <div className="bg-amber-50 rounded-xl p-4 space-y-4">
                  {/* Peso */}
                  <div className="flex justify-between items-center pb-3 border-b border-amber-200">
                    <span className="text-gray-600">Peso</span>
                    <span className="font-semibold text-amber-900">{selectedWeight?.weight}</span>
                  </div>
                  
                  {/* Tipo */}
                  <div className="flex justify-between items-center pb-3 border-b border-amber-200">
                    <span className="text-gray-600">Tipo</span>
                    <span className="font-semibold text-amber-900">{selectedShellType?.name}</span>
                  </div>
                  
                  {/* Casca(s) */}
                  <div className="flex justify-between items-center pb-3 border-b border-amber-200">
                    <span className="text-gray-600">Casca</span>
                    <span className="font-semibold text-amber-900">{getShellDescription()}</span>
                  </div>
                  
                  {/* Detalhes da Casca 1 */}
                  {selectedShellType?.id === "duo" ? (
                    <>
                      <div className="bg-white rounded-lg p-3 space-y-2">
                        <div className="text-sm font-semibold text-amber-800">Primeira metade ({shell1Config.shell?.name}):</div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Acabamento</span>
                          <span className="font-medium text-amber-900 text-sm">{shell1Config.finishType?.name}</span>
                        </div>
                        {shell1Config.finishType?.id === "pedacos" && shell1Config.pieces && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Pedaços</span>
                            <span className="font-medium text-amber-900 text-sm">{shell1Config.pieces}</span>
                          </div>
                        )}
                        {shell1Config.finishType?.id === "recheada" && shell1Config.filling && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Recheio</span>
                            <span className="font-medium text-amber-900 text-sm">{shell1Config.filling}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 space-y-2">
                        <div className="text-sm font-semibold text-amber-800">Segunda metade ({shell2Config.shell?.name}):</div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Acabamento</span>
                          <span className="font-medium text-amber-900 text-sm">{shell2Config.finishType?.name}</span>
                        </div>
                        {shell2Config.finishType?.id === "pedacos" && shell2Config.pieces && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Pedaços</span>
                            <span className="font-medium text-amber-900 text-sm">{shell2Config.pieces}</span>
                          </div>
                        )}
                        {shell2Config.finishType?.id === "recheada" && shell2Config.filling && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Recheio</span>
                            <span className="font-medium text-amber-900 text-sm">{shell2Config.filling}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center pb-3 border-b border-amber-200">
                        <span className="text-gray-600">Acabamento</span>
                        <span className="font-semibold text-amber-900">{shell1Config.finishType?.name}</span>
                      </div>
                      {shell1Config.finishType?.id === "pedacos" && shell1Config.pieces && (
                        <div className="flex justify-between items-center pb-3 border-b border-amber-200">
                          <span className="text-gray-600">Pedaços</span>
                          <span className="font-semibold text-amber-900">{shell1Config.pieces}</span>
                        </div>
                      )}
                      {shell1Config.finishType?.id === "recheada" && shell1Config.filling && (
                        <div className="flex justify-between items-center pb-3 border-b border-amber-200">
                          <span className="text-gray-600">Recheio</span>
                          <span className="font-semibold text-amber-900">{shell1Config.filling}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Total */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-amber-900">Total</span>
                    <span className="text-xl font-bold text-green-600">
                      R$ {selectedWeight?.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
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
              <div className="text-amber-800 truncate mr-2">
                {selectedWeight && <span>{selectedWeight.weight}</span>}
                {selectedShellType && <span> • {selectedShellType.name}</span>}
                {shell1Config.shell && <span> • {getShellDescription()}</span>}
                {shell1Config.finishType && (
                  <span> • {shell1Config.finishType.name}</span>
                )}
              </div>
              <div className="font-bold text-amber-900 whitespace-nowrap">
                R$ {selectedWeight.price.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-white">
          {!isLastStep() ? (
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
                  className="py-6 text-amber-700 border-amber-300 hover:bg-amber-50 rounded-xl flex flex-col items-center gap-1"
                >
                  <div className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Carrinho
                  </div>
                  <span className="text-xs text-gray-500 font-normal">Adicionar mais ovos</span>
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
