import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function addMissingProducts() {
  console.log("🌱 Adding missing products...");

  // 1. Add Talentino category
  console.log("📁 Adding Talentino category...");
  await connection.execute(
    `INSERT INTO categories (name, slug, description, displayOrder, isActive) 
     VALUES ('Talentino', 'talentino', 'Ao leite com castanha de caju ou avelã - sofisticação em cada mordida', 6, true)
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`
  );

  // Get Talentino category ID
  const [catRows] = await connection.execute("SELECT id FROM categories WHERE slug = 'talentino'");
  const talentinoId = catRows[0]?.id;

  if (talentinoId) {
    // Add Talentino products
    console.log("🌰 Adding Talentino products...");
    
    // Talentino Castanha de Caju
    await connection.execute(
      `INSERT INTO products (categoryId, name, slug, description, shortDescription, isFeatured, isActive, displayOrder)
       VALUES (?, 'Talentino Castanha de Caju', 'talentino-castanha-caju', 'Ovo de chocolate ao leite com castanhas de caju crocantes. Sofisticação em cada mordida.', 'Com castanha de caju', true, true, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
      [talentinoId]
    );

    // Talentino Avelã
    await connection.execute(
      `INSERT INTO products (categoryId, name, slug, description, shortDescription, isFeatured, isActive, displayOrder)
       VALUES (?, 'Talentino Avelã', 'talentino-avela', 'Ovo de chocolate ao leite com avelãs crocantes. Uma combinação clássica e irresistível.', 'Com avelã', true, true, 2)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
      [talentinoId]
    );

    // Get product IDs and add prices
    const [prodRows] = await connection.execute(
      "SELECT id, slug FROM products WHERE categoryId = ?",
      [talentinoId]
    );

    for (const prod of prodRows) {
      // Delete existing prices
      await connection.execute("DELETE FROM product_prices WHERE productId = ?", [prod.id]);
      
      // Add prices for Talentino (same as Ao Leite)
      const prices = [
        { weight: "150g", weightGrams: 150, price: "42.90" },
        { weight: "350g", weightGrams: 350, price: "75.90" },
        { weight: "500g", weightGrams: 500, price: "105.90" },
        { weight: "1kg", weightGrams: 1000, price: "181.90" },
      ];

      for (const price of prices) {
        await connection.execute(
          `INSERT INTO product_prices (productId, weight, weightGrams, price, isAvailable)
           VALUES (?, ?, ?, ?, true)`,
          [prod.id, price.weight, price.weightGrams, price.price]
        );
      }
    }
  }

  // 2. Add Linha Trufada Gourmet category
  console.log("📁 Adding Linha Trufada Gourmet category...");
  await connection.execute(
    `INSERT INTO categories (name, slug, description, displayOrder, isActive) 
     VALUES ('Linha Trufada Gourmet', 'linha-trufada-gourmet', 'Ovos generosamente recheados com os sabores mais desejados', 7, true)
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`
  );

  // Get Linha Trufada Gourmet category ID
  const [trufadaCatRows] = await connection.execute("SELECT id FROM categories WHERE slug = 'linha-trufada-gourmet'");
  const trufadaGourmetId = trufadaCatRows[0]?.id;

  if (trufadaGourmetId) {
    console.log("✨ Adding Linha Trufada Gourmet products...");
    
    // Single product for Linha Trufada Gourmet with multiple flavors
    await connection.execute(
      `INSERT INTO products (categoryId, name, slug, description, shortDescription, isFeatured, isActive, displayOrder)
       VALUES (?, 'Ovo Trufado Gourmet', 'ovo-trufado-gourmet', 'Ovos generosamente recheados com os sabores mais desejados. Disponível em chocolate ao leite ou chocolate branco.', 'Recheios gourmet selecionados', true, true, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
      [trufadaGourmetId]
    );

    // Get product ID
    const [gourmetProdRows] = await connection.execute(
      "SELECT id FROM products WHERE slug = 'ovo-trufado-gourmet'"
    );
    const gourmetProductId = gourmetProdRows[0]?.id;

    if (gourmetProductId) {
      // Delete existing prices
      await connection.execute("DELETE FROM product_prices WHERE productId = ?", [gourmetProductId]);
      
      // Add prices (Trufado prices)
      const prices = [
        { weight: "200g", weightGrams: 200, price: "79.90" },
        { weight: "400g", weightGrams: 400, price: "99.90" },
        { weight: "600g", weightGrams: 600, price: "149.90" },
      ];

      for (const price of prices) {
        await connection.execute(
          `INSERT INTO product_prices (productId, weight, weightGrams, price, isAvailable)
           VALUES (?, ?, ?, ?, true)`,
          [gourmetProductId, price.weight, price.weightGrams, price.price]
        );
      }

      // Add gourmet flavors
      const gourmetFlavors = [
        { name: "Franuii", description: "Framboesa com chocolate" },
        { name: "Kinder Bueno", description: "Sabor Kinder Bueno" },
        { name: "Ferrero Rocher", description: "Sabor Ferrero Rocher" },
        { name: "Ninho com Nutella", description: "Leite Ninho com Nutella" },
        { name: "Maracujá com Nutella", description: "Maracujá com Nutella" },
        { name: "Maracujá", description: "Maracujá cremoso" },
        { name: "Ovomaltine", description: "Sabor Ovomaltine" },
        { name: "Strogonoff de Nozes", description: "Strogonoff de Nozes" },
        { name: "Alpino", description: "Sabor Alpino" },
        { name: "Doce de Leite", description: "Doce de leite cremoso" },
        { name: "Prestígio", description: "Coco com chocolate" },
        { name: "Sensação", description: "Morango com chocolate" },
        { name: "Charge", description: "Sabor Charge" },
        { name: "Trufa Tradicional", description: "Trufa de chocolate" },
      ];

      for (let i = 0; i < gourmetFlavors.length; i++) {
        const flavor = gourmetFlavors[i];
        // Insert flavor
        await connection.execute(
          `INSERT INTO flavors (name, description, displayOrder, isActive)
           VALUES (?, ?, ?, true)
           ON DUPLICATE KEY UPDATE description = VALUES(description)`,
          [flavor.name, flavor.description, i + 10]
        );

        // Get flavor ID
        const [flavorRows] = await connection.execute(
          "SELECT id FROM flavors WHERE name = ?",
          [flavor.name]
        );
        const flavorId = flavorRows[0]?.id;

        if (flavorId) {
          // Link flavor to product
          await connection.execute(
            `INSERT IGNORE INTO product_flavors (productId, flavorId, additionalPrice)
             VALUES (?, ?, '0.00')`,
            [gourmetProductId, flavorId]
          );
        }
      }
    }
  }

  // 3. Update Mini Ovos with detailed flavors
  console.log("🎁 Updating Mini Ovos with detailed flavors...");
  
  // Get Mini Ovos category ID
  const [miniOvosCatRows] = await connection.execute("SELECT id FROM categories WHERE slug = 'mini-ovos'");
  const miniOvosId = miniOvosCatRows[0]?.id;

  if (miniOvosId) {
    // Update Kit Mini Ovos Sortidos description
    await connection.execute(
      `UPDATE products SET description = 'Caixa com 6 unidades. Perfeito para presentear ou degustar diversos sabores de uma vez. Sabores inclusos: Kinder Bueno, Ferrero Rocher, Ninho com Nutella, Maracujá, Ovomaltine e Alpino. Ideal para presentes especiais, degustar vários sabores, festas e eventos, e lembrancinhas premium.' WHERE slug = 'kit-mini-ovos-sortidos'`
    );

    // Update prices for Mini Ovos to match original
    const [miniOvosProducts] = await connection.execute(
      "SELECT id FROM products WHERE slug = 'kit-mini-ovos-sortidos'"
    );
    
    if (miniOvosProducts[0]?.id) {
      await connection.execute("DELETE FROM product_prices WHERE productId = ?", [miniOvosProducts[0].id]);
      await connection.execute(
        `INSERT INTO product_prices (productId, weight, weightGrams, price, isAvailable)
         VALUES (?, 'Caixa 6un', 150, '59.90', true)`,
        [miniOvosProducts[0].id]
      );
    }

    // Link mini ovos flavors
    const miniOvosFlavors = ["Kinder Bueno", "Ferrero Rocher", "Ninho com Nutella", "Maracujá", "Ovomaltine", "Alpino"];
    
    for (const flavorName of miniOvosFlavors) {
      const [flavorRows] = await connection.execute(
        "SELECT id FROM flavors WHERE name = ?",
        [flavorName]
      );
      
      if (flavorRows[0]?.id && miniOvosProducts[0]?.id) {
        await connection.execute(
          `INSERT IGNORE INTO product_flavors (productId, flavorId, additionalPrice)
           VALUES (?, ?, '0.00')`,
          [miniOvosProducts[0].id, flavorRows[0].id]
        );
      }
    }
  }

  console.log("✅ Missing products added!");
  await connection.end();
}

addMissingProducts().catch(console.error);
