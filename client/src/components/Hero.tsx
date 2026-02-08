import { motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onScrollToProducts: () => void;
  onCustomize?: () => void;
}

export default function Hero({ onScrollToProducts, onCustomize }: HeroProps) {
  return (
    <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--cream)] via-background to-secondary/30">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--chocolate)]/20 to-[var(--gold)]/20 blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-gradient-to-br from-[var(--gold)]/20 to-[var(--chocolate)]/20 blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-primary/10 blur-lg"
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Páscoa 2026</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
          >
            <span className="gradient-text">Ovos de</span>
            <br />
            <span className="text-foreground">Páscoa</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto"
          >
            Ovos de Páscoa feitos com amor e ingredientes selecionados.
            Cada mordida é uma experiência única de sabor e qualidade.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              size="lg"
              className="w-full min-w-0 rounded-full px-8 gap-2 shadow-lg shadow-primary/25 whitespace-nowrap overflow-hidden"
              onClick={onScrollToProducts}
            >
              <span className="truncate">Ver Catálogo</span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </Button>
            {onCustomize && (
              <Button
                size="lg"
                variant="outline"
                className="w-full min-w-0 rounded-full px-8 gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white whitespace-nowrap overflow-hidden"
                onClick={onCustomize}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="truncate">Monte seu Ovo</span>
              </Button>
            )}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
