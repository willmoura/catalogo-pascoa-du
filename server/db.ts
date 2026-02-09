import { eq, and, like, or, asc, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  categories, InsertCategory, Category,
  products, InsertProduct, Product,
  productPrices, InsertProductPrice, ProductPrice,
  flavors, InsertFlavor, Flavor,
  productFlavors, InsertProductFlavor,
  orders, InsertOrder, Order
} from "../drizzle/schema";
import { ENV } from './_core/env';

import mysql from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    console.log("[Database] Initializing connection pool...");
    try {
      const pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(pool);
      console.log("[Database] Connection pool initialized successfully.");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  } else if (!_db) {
    console.warn("[Database] DATABASE_URL is missing!");
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CATEGORY FUNCTIONS ============

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.displayOrder));
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);

  return result[0] || null;
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(categories).values(data);
}

// ============ PRODUCT FUNCTIONS ============

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.displayOrder));
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
    .orderBy(asc(products.displayOrder));
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  return result[0] || null;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(products)
    .where(eq(products.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(products)
    .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
    .orderBy(asc(products.displayOrder));
}

export async function searchProducts(query: string) {
  const db = await getDb();
  if (!db) return [];

  const searchTerm = `%${query}%`;
  return db.select().from(products)
    .where(and(
      eq(products.isActive, true),
      or(
        like(products.name, searchTerm),
        like(products.description, searchTerm),
        like(products.shortDescription, searchTerm)
      )
    ))
    .orderBy(asc(products.displayOrder));
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

// ============ PRODUCT PRICE FUNCTIONS ============

export async function getProductPrices(productId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(productPrices)
    .where(and(eq(productPrices.productId, productId), eq(productPrices.isAvailable, true)))
    .orderBy(asc(productPrices.weightGrams));
}

export async function createProductPrice(data: InsertProductPrice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(productPrices).values(data);
}

export async function bulkCreateProductPrices(data: InsertProductPrice[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.length > 0) {
    await db.insert(productPrices).values(data);
  }
}

// ============ FLAVOR FUNCTIONS ============

export async function getAllFlavors() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(flavors)
    .where(eq(flavors.isActive, true))
    .orderBy(asc(flavors.displayOrder));
}

export async function getProductFlavors(productId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    flavor: flavors,
    additionalPrice: productFlavors.additionalPrice
  })
    .from(productFlavors)
    .innerJoin(flavors, eq(productFlavors.flavorId, flavors.id))
    .where(and(eq(productFlavors.productId, productId), eq(flavors.isActive, true)))
    .orderBy(asc(flavors.displayOrder));

  return result;
}

export async function createFlavor(data: InsertFlavor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(flavors).values(data);
  return result[0].insertId;
}

export async function linkProductFlavor(data: InsertProductFlavor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(productFlavors).values(data);
}

// ============ ORDER FUNCTIONS ============

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(orders).values(data);
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  return result[0] || null;
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders)
    .orderBy(desc(orders.createdAt));
}

// ============ FULL PRODUCT WITH DETAILS ============

export async function getProductWithDetails(productId: number) {
  const db = await getDb();
  if (!db) return null;

  const product = await getProductById(productId);
  if (!product) return null;

  const prices = await getProductPrices(productId);
  const productFlavorsList = await getProductFlavors(productId);

  return {
    ...product,
    prices,
    flavors: []
  };
}

export async function getProductWithDetailsBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const product = await getProductBySlug(slug);
  if (!product) return null;

  const prices = await getProductPrices(product.id);
  const productFlavorsList = await getProductFlavors(product.id);

  return {
    ...product,
    prices,
    flavors: []
  };
}

// ============ CATALOG DATA ============

export async function getFullCatalog() {
  const db = await getDb();
  if (!db) return { categories: [], products: [], flavors: [] };

  const allCategories = await getAllCategories();
  const allProducts = await getAllProducts();
  const allFlavors = await getAllFlavors();

  // Get prices for all products
  const productsWithPrices = await Promise.all(
    allProducts.map(async (product) => {
      const prices = await getProductPrices(product.id);
      return {
        ...product,
        prices,
        flavors: []
      };
    })
  );

  return {
    categories: allCategories,
    products: productsWithPrices,
    flavors: allFlavors
  };
}
