
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Manually load .env if dotenv default doesn't work
import fs from 'fs';
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function check() {
    console.log('Connecting to DB...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    console.log('Connected!');

    const [products] = await connection.execute('SELECT * FROM products WHERE id IN (33, 35)');
    console.log('Products:', JSON.stringify(products, null, 2));

    const [prices] = await connection.execute('SELECT * FROM product_prices WHERE productId IN (33, 35)');
    console.log('Prices:', JSON.stringify(prices, null, 2));

    const [productFlavors] = await connection.execute('SELECT * FROM product_flavors WHERE productId IN (33, 35)');
    console.log('ProductFlavors:', JSON.stringify(productFlavors, null, 2));

    // Get flavors names
    const [flavors] = await connection.execute('SELECT * FROM flavors WHERE isActive = 1');
    console.log('All Flavors:', JSON.stringify(flavors, null, 2));

    await connection.end();
}

check().catch(console.error);
