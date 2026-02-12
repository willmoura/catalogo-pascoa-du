
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function check() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    const [products] = await connection.execute('SELECT * FROM products WHERE id IN (33, 35)');
    const [prices] = await connection.execute('SELECT * FROM product_prices WHERE productId IN (33, 35)');
    const [flavors] = await connection.execute('SELECT * FROM flavors WHERE isActive = 1 ORDER BY name');

    const output = {
        products,
        prices,
        flavors
    };

    fs.writeFileSync('product_data_dump.json', JSON.stringify(output, null, 2));
    await connection.end();
}

check().catch(console.error);
