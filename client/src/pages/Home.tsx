import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import LinhaGourmetSection from "@/components/LinhaGourmetSection";

export default function Home() {
  const productsRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);

  // Fetch catalog data
  const { data: catalog, isLoading } = trpc.catalog.full.useQuery();

  // Fetch selected product details
  const { data: selectedProduct } = trpc.products.getBySlug.useQuery(
    { slug: selectedProductSlug || "" },
    { enabled: !!selectedProductSlug }
  );

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    if (!catalog?.products) return [];

    let products = catalog.products;

    // Filter by category
    if (selectedCategory !== null) {
      products = products.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.shortDescription?.toLowerCase().includes(query)
      );
    }

    return products;
  }, [catalog?.products, selectedCategory, searchQuery]);

  // Get category name for section title
  const categoryName = useMemo(() => {
    if (selectedCategory === null) return "Todos os Produtos";
    const category = catalog?.categories.find((c) => c.id === selectedCategory);
    return category?.name || "Produtos";
  }, [selectedCategory, catalog?.categories]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    if (query.trim()) {
      scrollToProducts();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      
      <Hero onScrollToProducts={scrollToProducts} />

      {/* Categories */}
      <div ref={productsRef}>
        <Categories
          categories={catalog?.categories || []}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Linha Trufada Gourmet Section */}
      <LinhaGourmetSection onSelectProduct={setSelectedProductSlug} />

      {/* Products Section */}
      <section className="py-8 md:py-12">
        <div className="container">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {searchQuery ? `Resultados para "${searchQuery}"` : categoryName}
              </h2>
              <p className="text-muted-foreground mt-1">
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProductSlug(product.slug)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-muted-foreground">
                Tente buscar por outro termo ou selecione outra categoria.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-secondary/30">
        <div className="container text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--chocolate)] to-[var(--gold)] flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">Ovos de Páscoa Du</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ovos de Páscoa feitos com amor
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 Ovos de Páscoa Du. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct || null}
        isOpen={!!selectedProductSlug}
        onClose={() => setSelectedProductSlug(null)}
      />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
}
