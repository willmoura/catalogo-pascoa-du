import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const dbConfig = {
    uri: "mysql://root:BeMaNu2609@localhost:3306/pascoa_du_shop"
};

const ids = [15];

async function backup() {
    const connection = await mysql.createConnection(dbConfig.uri);
    try {
        console.log(`Backing up prices for product: ${ids.join(', ')}`);
        const [rows] = await connection.execute(
            `SELECT * FROM product_prices WHERE productId IN (${ids.join(',')})`
        );
        await fs.writeFile('product_prices_backup_id15.json', JSON.stringify(rows, null, 2));
        console.log(`Backup saved to product_prices_backup_id15.json (${(rows as any[]).length} records)`);
    } catch (err) {
        console.error("Backup failed:", err);
    } finally {
        await connection.end();
    }
}

backup();
