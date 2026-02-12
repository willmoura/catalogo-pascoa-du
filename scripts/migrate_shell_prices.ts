import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { productPrices, products } from '../drizzle/schema';
import fs from 'fs';
import path from 'path';

// Load .env
config();

const DRY_RUN = !process.argv.includes('--execute');

// Target Products
const TARGET_IDS = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

// Fixed Prices per Shell Group
const PRICE_GROUP_1 = { // Ao Leite, Meio Amargo
    '400g': '99.90',
    '600g': '149.90',
    '800g': '189.90'
};

const PRICE_GROUP_2 = { // Meio a Meio, Branco
    '400g': '109.90',
    '600g': '164.90',
    '800g': '209.90'
};

const SHELLS_GROUP_1 = ['Ao Leite', 'Meio Amargo'];
const SHELLS_GROUP_2 = ['Meio a Meio', 'Branco'];

async function main() {
    console.log("Script starting...");
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    console.log(`Starting Shell Price Migration [${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}]`);

    let pool;
    try {
        pool = mysql.createPool(process.env.DATABASE_URL);
        const db = drizzle(pool);

        const operations: any[] = [];
        const auditLog: any[] = [];

        console.log("Connected to DB. Fetching products...");

        // 1. Get current prices for target products
        for (const productId of TARGET_IDS) {
            // Get product name for logging
            const product = await db.select().from(products).where(eq(products.id, productId));
            const productName = product[0]?.name || `Product ${productId}`;

            // We expect entries for 400g, 600g, 800g.
            const weights = ['400g', '600g', '800g'];

            for (const weight of weights) {
                // Group 1: Ao Leite, Meio Amargo
                for (const shell of SHELLS_GROUP_1) {
                    const price = PRICE_GROUP_1[weight as keyof typeof PRICE_GROUP_1];
                    operations.push({
                        productId,
                        productName,
                        weight,
                        shell,
                        price,
                        weightGrams: parseInt(weight) // 400, 600, 800
                    });
                }

                // Group 2: Meio a Meio, Branco
                for (const shell of SHELLS_GROUP_2) {
                    const price = PRICE_GROUP_2[weight as keyof typeof PRICE_GROUP_2];
                    operations.push({
                        productId,
                        productName,
                        weight,
                        shell,
                        price,
                        weightGrams: parseInt(weight)
                    });
                }
            }
        }

        console.log(`\nPrepared ${operations.length} price records for ${TARGET_IDS.length} products.`);

        if (DRY_RUN) {
            console.log('\nSample Plan (First 10 records):');
            operations.slice(0, 10).forEach(op => {
                console.log(`[PLAN] Insert/Update "${op.productName}" - ${op.weight} [${op.shell}]: R$ ${op.price}`);
            });
            console.log('...');
            console.log('\nTo execute, run with --execute');
        } else {
            console.log('\nExecuting changes...');
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                console.log('Cleaning up old generic prices...');
                // Safe delete
                await connection.query(
                    `DELETE FROM product_prices WHERE productId IN (${TARGET_IDS.join(',')})`
                );

                console.log('Inserting new shell-specific prices...');
                for (const op of operations) {
                    const [result] = await connection.execute(
                        `INSERT INTO product_prices (productId, weight, weightGrams, price, shell, isAvailable, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
                        [op.productId, op.weight, op.weightGrams, op.price, op.shell]
                    ) as any;

                    auditLog.push({ ...op, insertId: result.insertId });
                }

                await connection.commit();
                console.log('\nTransaction committed successfully.');

                const logFileName = `shell_migration_log_${Date.now()}.json`;
                fs.writeFileSync(path.join(process.cwd(), logFileName), JSON.stringify(auditLog, null, 2));
                console.log(`Audit log written to ${logFileName}`);

            } catch (err) {
                await connection.rollback();
                console.error('Transaction failed.', err);
                throw err;
            } finally {
                connection.release();
            }
        }

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
        console.log("Script finished.");
        process.exit(0);
    }
}

main();
