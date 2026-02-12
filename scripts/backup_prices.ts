import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    uri: process.env.DATABASE_URL
};

const ids = [6, 17, 8, 10];

async function backup() {
    if (!dbConfig.uri) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }
    const connection = await mysql.createConnection(dbConfig.uri);
    try {
        console.log(`Backing up prices for products: ${ids.join(', ')}`);
        const [rows] = await connection.execute(
            `SELECT * FROM product_prices WHERE productId IN (${ids.join(',')})`
        );
        await fs.writeFile('product_prices_backup_before_update.json', JSON.stringify(rows, null, 2));
        console.log(`Backup saved to product_prices_backup_before_update.json (${(rows as any[]).length} records)`);
    } catch (err) {
        console.error("Backup failed:", err);
    } finally {
        await connection.end();
    }
}

backup();
