
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection, { schema, mode: 'default' });

async function check() {
    console.log('Checking products 33 and 35...');

    const productsResult = await db.query.products.findMany({
        where: inArray(schema.products.id, [33, 35]),
        with: {
            category: true
        }
    });

    const productPrices = await db.query.productPrices.findMany({
        where: inArray(schema.productPrices.productId, [33, 35])
    });

    const productFlavors = await db.query.productFlavors.findMany({
        where: inArray(schema.productFlavors.productId, [33, 35]),
        with: {
            flavor: true
        }
    });

    console.log('Products:', JSON.stringify(productsResult, null, 2));
    console.log('Prices:', JSON.stringify(productPrices, null, 2));
    console.log('Flavors:', JSON.stringify(productFlavors, null, 2));

    await connection.end();
}

check().catch(console.error);
