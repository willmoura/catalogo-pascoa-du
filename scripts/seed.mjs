import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Categories
const categoriesData = [
  { name: "Ovos Trufados", slug: "ovos-trufados", description: "Ovos recheados com trufas artesanais cremosas", displayOrder: 1 },
  { name: "Ao Leite", slug: "ao-leite", description: "Chocolate ao leite tradicional, cremoso e irresistível", displayOrder: 2 },
  { name: "Duo", slug: "duo", description: "Metade ao leite, metade branco - o melhor dos dois mundos", displayOrder: 3 },
  { name: "Amargo", slug: "amargo", description: "Para os amantes do chocolate intenso e sofisticado", displayOrder: 4 },
  { name: "Mini Ovos", slug: "mini-ovos", description: "Kits com mini ovos sortidos, perfeitos para presentear", displayOrder: 5 },
];

// Products with their prices
const productsData = [
  // Trufados
  {
    categorySlug: "ovos-trufados",
    name: "Ovo Trufado Tradicional",
    slug: "ovo-trufado-tradicional",
    description: "Nosso clássico ovo de chocolate ao leite recheado com trufa cremosa de chocolate. Uma explosão de sabor que derrete na boca.",
    shortDescription: "Trufa cremosa de chocolate ao leite",
    isFeatured: true,
    prices: [
      { weight: "400g", weightGrams: 400, price: "99.90" },
      { weight: "600g", weightGrams: 600, price: "149.90" },
      { weight: "800g", weightGrams: 800, price: "189.90" },
    ],
  },
  {
    categorySlug: "ovos-trufados",
    name: "Ovo Trufado Maracujá",
    slug: "ovo-trufado-maracuja",
    description: "Chocolate ao leite com recheio de trufa de maracujá. O equilíbrio perfeito entre o doce do chocolate e o azedinho do maracujá.",
    shortDescription: "Trufa cremosa de maracujá",
    isFeatured: true,
    prices: [
      { weight: "400g", weightGrams: 400, price: "99.90" },
      { weight: "600g", weightGrams: 600, price: "149.90" },
      { weight: "800g", weightGrams: 800, price: "189.90" },
    ],
  },
  {
    categorySlug: "ovos-trufados",
    name: "Ovo Trufado Morango",
    slug: "ovo-trufado-morango",
    description: "Delicioso ovo de chocolate com recheio de trufa de morango. Romântico e irresistível.",
    shortDescription: "Trufa cremosa de morango",
    isFeatured: false,
    prices: [
      { weight: "400g", weightGrams: 400, price: "99.90" },
      { weight: "600g", weightGrams: 600, price: "149.90" },
      { weight: "800g", weightGrams: 800, price: "189.90" },
    ],
  },
  {
    categorySlug: "ovos-trufados",
    name: "Ovo Trufado Limão",
    slug: "ovo-trufado-limao",
    description: "Chocolate ao leite com recheio de trufa de limão siciliano. Refrescante e sofisticado.",
    shortDescription: "Trufa cremosa de limão siciliano",
    isFeatured: false,
    prices: [
      { weight: "400g", weightGrams: 400, price: "99.90" },
      { weight: "600g", weightGrams: 600, price: "149.90" },
      { weight: "800g", weightGrams: 800, price: "189.90" },
    ],
  },
  // Ao Leite
  {
    categorySlug: "ao-leite",
    name: "Ovo ao Leite Clássico",
    slug: "ovo-ao-leite-classico",
    description: "O tradicional ovo de chocolate ao leite, feito com cacau selecionado. Cremoso e irresistível.",
    shortDescription: "Chocolate ao leite tradicional",
    isFeatured: true,
    prices: [
      { weight: "150g", weightGrams: 150, price: "42.90" },
      { weight: "350g", weightGrams: 350, price: "75.90" },
      { weight: "500g", weightGrams: 500, price: "105.90" },
      { weight: "1kg", weightGrams: 1000, price: "181.90" },
    ],
  },
  {
    categorySlug: "ao-leite",
    name: "Ovo ao Leite com Castanhas",
    slug: "ovo-ao-leite-castanhas",
    description: "Chocolate ao leite com pedaços crocantes de castanhas selecionadas. Uma combinação perfeita.",
    shortDescription: "Com castanhas crocantes",
    isFeatured: false,
    prices: [
      { weight: "150g", weightGrams: 150, price: "42.90" },
      { weight: "350g", weightGrams: 350, price: "75.90" },
      { weight: "500g", weightGrams: 500, price: "105.90" },
      { weight: "1kg", weightGrams: 1000, price: "181.90" },
    ],
  },
  // Duo
  {
    categorySlug: "duo",
    name: "Ovo Duo Clássico",
    slug: "ovo-duo-classico",
    description: "Metade chocolate ao leite, metade chocolate branco. O melhor dos dois mundos em um único ovo.",
    shortDescription: "Meio ao leite, meio branco",
    isFeatured: true,
    prices: [
      { weight: "150g", weightGrams: 150, price: "57.90" },
      { weight: "350g", weightGrams: 350, price: "107.90" },
      { weight: "500g", weightGrams: 500, price: "127.90" },
      { weight: "1kg", weightGrams: 1000, price: "217.90" },
    ],
  },
  {
    categorySlug: "duo",
    name: "Ovo Duo com Cookies",
    slug: "ovo-duo-cookies",
    description: "Chocolate duo com pedaços de cookies crocantes. Uma experiência única de texturas.",
    shortDescription: "Com pedaços de cookies",
    isFeatured: false,
    prices: [
      { weight: "150g", weightGrams: 150, price: "57.90" },
      { weight: "350g", weightGrams: 350, price: "107.90" },
      { weight: "500g", weightGrams: 500, price: "127.90" },
      { weight: "1kg", weightGrams: 1000, price: "217.90" },
    ],
  },
  // Amargo
  {
    categorySlug: "amargo",
    name: "Ovo Amargo 70% Cacau",
    slug: "ovo-amargo-70",
    description: "Para os verdadeiros apreciadores de chocolate. 70% cacau, intenso e sofisticado.",
    shortDescription: "70% cacau, intenso",
    isFeatured: true,
    prices: [
      { weight: "150g", weightGrams: 150, price: "49.90" },
      { weight: "350g", weightGrams: 350, price: "99.90" },
      { weight: "500g", weightGrams: 500, price: "119.90" },
      { weight: "1kg", weightGrams: 1000, price: "194.90" },
    ],
  },
  {
    categorySlug: "amargo",
    name: "Ovo Amargo com Laranja",
    slug: "ovo-amargo-laranja",
    description: "Chocolate amargo com toque de laranja. Uma combinação clássica e elegante.",
    shortDescription: "Com toque de laranja",
    isFeatured: false,
    prices: [
      { weight: "150g", weightGrams: 150, price: "49.90" },
      { weight: "350g", weightGrams: 350, price: "99.90" },
      { weight: "500g", weightGrams: 500, price: "119.90" },
      { weight: "1kg", weightGrams: 1000, price: "194.90" },
    ],
  },
  // Mini Ovos
  {
    categorySlug: "mini-ovos",
    name: "Kit Mini Ovos Sortidos",
    slug: "kit-mini-ovos-sortidos",
    description: "Caixa com 12 mini ovos de diferentes sabores. Perfeito para presentear ou degustar aos poucos.",
    shortDescription: "12 mini ovos sortidos",
    isFeatured: true,
    prices: [
      { weight: "Caixa 12un", weightGrams: 300, price: "89.90" },
      { weight: "Caixa 24un", weightGrams: 600, price: "159.90" },
    ],
  },
  {
    categorySlug: "mini-ovos",
    name: "Kit Mini Ovos Trufados",
    slug: "kit-mini-ovos-trufados",
    description: "Mini ovos recheados com trufa cremosa. Cada mordida é uma explosão de sabor.",
    shortDescription: "Mini ovos com trufa",
    isFeatured: false,
    prices: [
      { weight: "Caixa 12un", weightGrams: 300, price: "99.90" },
      { weight: "Caixa 24un", weightGrams: 600, price: "179.90" },
    ],
  },
];

// Flavors for truffled eggs
const flavorsData = [
  { name: "Chocolate Tradicional", description: "Trufa cremosa de chocolate ao leite", displayOrder: 1 },
  { name: "Maracujá", description: "Trufa com toque cítrico de maracujá", displayOrder: 2 },
  { name: "Morango", description: "Trufa com sabor de morango fresco", displayOrder: 3 },
  { name: "Limão Siciliano", description: "Trufa refrescante de limão", displayOrder: 4 },
  { name: "Coco", description: "Trufa cremosa de coco", displayOrder: 5 },
  { name: "Café", description: "Trufa com café gourmet", displayOrder: 6 },
  { name: "Pistache", description: "Trufa premium de pistache", displayOrder: 7 },
  { name: "Avelã", description: "Trufa com avelã crocante", displayOrder: 8 },
];

async function seed() {
  console.log("🌱 Starting seed...");

  // Insert categories
  console.log("📁 Creating categories...");
  for (const cat of categoriesData) {
    await connection.execute(
      `INSERT INTO categories (name, slug, description, displayOrder, isActive) VALUES (?, ?, ?, ?, true)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), displayOrder = VALUES(displayOrder)`,
      [cat.name, cat.slug, cat.description, cat.displayOrder]
    );
  }

  // Get category IDs
  const [catRows] = await connection.execute("SELECT id, slug FROM categories");
  const categoryMap = {};
  for (const row of catRows) {
    categoryMap[row.slug] = row.id;
  }

  // Insert products and prices
  console.log("🍫 Creating products...");
  for (const prod of productsData) {
    const categoryId = categoryMap[prod.categorySlug];
    if (!categoryId) {
      console.warn(`Category not found: ${prod.categorySlug}`);
      continue;
    }

    // Insert product
    await connection.execute(
      `INSERT INTO products (categoryId, name, slug, description, shortDescription, isFeatured, isActive, displayOrder)
       VALUES (?, ?, ?, ?, ?, ?, true, 0)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), shortDescription = VALUES(shortDescription), isFeatured = VALUES(isFeatured)`,
      [categoryId, prod.name, prod.slug, prod.description, prod.shortDescription, prod.isFeatured]
    );

    // Get product ID
    const [prodRows] = await connection.execute("SELECT id FROM products WHERE slug = ?", [prod.slug]);
    const productId = prodRows[0]?.id;

    if (productId) {
      // Delete existing prices and insert new ones
      await connection.execute("DELETE FROM product_prices WHERE productId = ?", [productId]);
      
      for (const price of prod.prices) {
        await connection.execute(
          `INSERT INTO product_prices (productId, weight, weightGrams, price, isAvailable)
           VALUES (?, ?, ?, ?, true)`,
          [productId, price.weight, price.weightGrams, price.price]
        );
      }
    }
  }

  // Insert flavors
  console.log("🍓 Creating flavors...");
  for (const flavor of flavorsData) {
    await connection.execute(
      `INSERT INTO flavors (name, description, displayOrder, isActive)
       VALUES (?, ?, ?, true)
       ON DUPLICATE KEY UPDATE description = VALUES(description), displayOrder = VALUES(displayOrder)`,
      [flavor.name, flavor.description, flavor.displayOrder]
    );
  }

  // Link flavors to truffled products
  console.log("🔗 Linking flavors to products...");
  const [flavorRows] = await connection.execute("SELECT id FROM flavors");
  const [trufadoProducts] = await connection.execute(
    "SELECT p.id FROM products p JOIN categories c ON p.categoryId = c.id WHERE c.slug = 'ovos-trufados'"
  );

  for (const product of trufadoProducts) {
    for (const flavor of flavorRows) {
      await connection.execute(
        `INSERT IGNORE INTO product_flavors (productId, flavorId, additionalPrice)
         VALUES (?, ?, '0.00')`,
        [product.id, flavor.id]
      );
    }
  }

  console.log("✅ Seed completed!");
  await connection.end();
}

seed().catch(console.error);
