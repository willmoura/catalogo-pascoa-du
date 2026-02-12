
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function verify() {
    console.log('Verifying Product 35...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    // Check Price
    const [prices] = await connection.execute(
        'SELECT * FROM product_prices WHERE productId = 35 AND isAvailable = 1'
    );
    console.log('Product 35 Prices:', JSON.stringify(prices, null, 2));

    // Check Flavors
    const [flavors] = await connection.execute(`
    SELECT f.name 
    FROM product_flavors pf 
    JOIN flavors f ON pf.flavorId = f.id 
    WHERE pf.productId = 35
    ORDER BY f.name
  `);
    console.log('Product 35 Flavors:', JSON.stringify(flavors, null, 2));

    await connection.end();
}

verify().catch(console.error);
