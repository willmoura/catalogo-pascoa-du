
import { getDb } from "./db";
import { products, productPrices } from "../drizzle/schema";
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

    const productName = "Ovo Trufado Gourmet";
    console.log(`Searching for: ${productName}`);

    const foundProducts = await db.select().from(products).where(like(products.name, `%${productName}%`));

    if (foundProducts.length === 0) {
        console.log("Product not found.");
    } else {
        for (const prod of foundProducts) {
            console.log("--- Product ---");
            console.log(prod);
            const prices = await db.select().from(productPrices).where(eq(productPrices.productId, prod.id));
            console.log("--- Prices ---");
            console.log(prices);
        }
    }
    process.exit(0);
}

main();
