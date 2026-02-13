import "dotenv/config";
import mysql from "mysql2/promise";

async function checkProducts() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL missing!");
        process.exit(1);
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        const [rows] = await connection.execute("SELECT id, name, imageUrl FROM products WHERE imageUrl NOT LIKE '%/%' AND imageUrl IS NOT NULL LIMIT 5");
        console.log("Products with Cloudflare IDs (sample):");
        console.table(rows);

        const [rows2] = await connection.execute("SELECT count(*) as count FROM products WHERE imageUrl NOT LIKE '%/%' AND imageUrl IS NOT NULL");
        console.log("Total products migrated:", (rows2 as any)[0].count);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

checkProducts();
