
import { getDb } from "./db";
import { categories, products } from "../drizzle/schema";
import { eq, like } from "drizzle-orm";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const db = await getDb();
    if (!db) {
        console.error("DB not connected");
        process.exit(1);
    }

    const categoryName = "Linha Trufada Gourmet";
    console.log(`Searching for Category: ${categoryName}`);

    const foundCategories = await db.select().from(categories).where(like(categories.name, `%${categoryName}%`));

    if (foundCategories.length === 0) {
        console.log("Category not found.");
    } else {
        for (const cat of foundCategories) {
            console.log("--- Category ---");
            console.log(cat);

            const catProducts = await db.select().from(products).where(eq(products.categoryId, cat.id));
            console.log(`--- Products in Category ${cat.name} (${cat.id}) ---`);
            catProducts.forEach(p => console.log(`[${p.id}] ${p.name} (Active: ${p.isActive})`));
        }
    }
    process.exit(0);
}

main();
