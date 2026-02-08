
import { getDb } from "./db";
import { categories, products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const db = await getDb();
    if (!db) {
        console.error("DB not connected");
        process.exit(1);
    }

    const categoryId = 30002;
    const productId = 30003;

    console.log(`Deactivating Category ID: ${categoryId}`);
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, categoryId));

    console.log(`Deactivating Product ID: ${productId}`);
    await db.update(products).set({ isActive: false }).where(eq(products.id, productId));

    console.log("Deactivation complete.");
    process.exit(0);
}

main();
