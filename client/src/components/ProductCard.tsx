import { motion } from "framer-motion";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveImage } from "@/components/ui/responsive-image";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    shortDescription: string | null;
    imageUrl: string | null;
    isFeatured: boolean;
    prices: Array<{
      weight: string;
      price: string;
    }>;
  };
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const lowestPrice = product.prices.length > 0
    ? Math.min(...product.prices.map((p) => parseFloat(p.price)))
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        {product.imageUrl ? (
          <ResponsiveImage
            imageId={product.imageUrl}
            alt={product.name}
            className="w-full h-full bg-secondary/30"
            imageClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--chocolate)] to-[var(--gold)] opacity-50" />
          </div>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <Badge className="absolute top-2 left-2 bg-[var(--gold)] text-[var(--chocolate)] border-0">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Destaque
          </Badge>
        )}

        {/* Quick Add Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Button
            size="icon"
            className="rounded-full bg-primary shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1 mb-1 notranslate" translate="no">
          {product.name}
        </h3>
        {product.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.shortDescription}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">A partir de</span>
            <p className="text-lg font-bold text-primary">
              R$ {lowestPrice.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            Ver opções
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
