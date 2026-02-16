import { motion } from "framer-motion";

const gourmetFlavors = [
  "Franuí",
  "Kinder Bueno",
  "Ferrero Rocher",
  "Ninho com Nutella",
  "Maracujá com Nutella",
  "Maracujá",
  "Ovomaltine",
  "Strogonoff de Nozes",
  "Alpino",
  "Doce de Leite",
  "Prestígio",
  "Sensação",
  "Charge",
  "Trufa Tradicional",
  "Laka Oreo",
];

interface LinhaGourmetSectionProps {
  onSelectProduct: (slug: string) => void;
  isVisible?: boolean;
}

export default function LinhaGourmetSection({ onSelectProduct, isVisible = true }: LinhaGourmetSectionProps) {
  if (!isVisible) return null;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--chocolate)] mb-3">
            Linha Trufada Gourmet
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ovos generosamente recheados com os sabores mais desejados
          </p>
        </div>

        {/* Availability Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[var(--chocolate)] rounded-2xl p-6 md:p-8 mb-8 max-w-3xl mx-auto"
        >
          <h3 className="text-[var(--gold)] font-semibold mb-4">Disponível em:</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="px-4 py-2 bg-[var(--cream)] text-[var(--chocolate)] rounded-full font-medium">
              Chocolate ao Leite
            </span>
            <span className="px-4 py-2 bg-[var(--cream)] text-[var(--chocolate)] rounded-full font-medium">
              Chocolate Branco
            </span>
          </div>
          <p className="text-[var(--cream)]/80 text-sm">
            Tamanhos: 200g | 400g | 600g
          </p>
        </motion.div>

        {/* Flavors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
          {gourmetFlavors.map((flavor, index) => (
            <motion.button
              key={flavor}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectProduct("ovo-trufado-gourmet")}
              className="px-4 py-3 bg-[var(--cream)] hover:bg-[var(--gold)]/20 border border-border rounded-xl text-[var(--chocolate)] font-medium transition-colors text-sm md:text-base"
            >
              <span className="notranslate" translate="no">{flavor}</span>
            </motion.button>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-muted-foreground text-sm mt-8 max-w-2xl mx-auto">
          Cada sabor é cuidadosamente selecionado para proporcionar uma experiência única.
          Todos os recheios são feitos com ingredientes premium e muito carinho.
        </p>
      </div>
    </section>
  );
}
