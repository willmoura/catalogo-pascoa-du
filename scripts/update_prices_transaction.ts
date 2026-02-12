import mysql from 'mysql2/promise';

const dbConfig = {
    uri: "mysql://root:BeMaNu2609@localhost:3306/pascoa_du_shop"
};

interface PriceConfig {
    weightGrams: number;
    weightLabel: string;
    price: number;
}

const targetPrices: Record<number, PriceConfig[]> = {
    6: [ // Ovo ao Leite Clássico
        { weightGrams: 150, weightLabel: "150g", price: 42.90 },
        { weightGrams: 350, weightLabel: "350g", price: 75.90 },
        { weightGrams: 500, weightLabel: "500g", price: 105.90 },
        { weightGrams: 1000, weightLabel: "1kg", price: 181.90 }
    ],
    17: [ // Ovo de Chocolate Branco
        { weightGrams: 150, weightLabel: "150g", price: 49.90 },
        { weightGrams: 350, weightLabel: "350g", price: 89.90 },
        { weightGrams: 500, weightLabel: "500g", price: 124.90 },
        { weightGrams: 1000, weightLabel: "1kg", price: 209.90 }
    ],
    8: [ // Ovo Meio a Meio
        { weightGrams: 150, weightLabel: "150g", price: 57.90 },
        { weightGrams: 350, weightLabel: "350g", price: 107.90 },
        { weightGrams: 500, weightLabel: "500g", price: 127.90 },
        { weightGrams: 1000, weightLabel: "1kg", price: 217.90 }
    ],
    10: [ // Ovo Meio Amargo
        { weightGrams: 150, weightLabel: "150g", price: 49.90 },
        { weightGrams: 350, weightLabel: "350g", price: 99.90 },
        { weightGrams: 500, weightLabel: "500g", price: 119.90 },
        { weightGrams: 1000, weightLabel: "1kg", price: 194.90 }
    ]
};

async function updatePrices() {
    const connection = await mysql.createConnection(dbConfig.uri);

    try {
        await connection.beginTransaction();
        console.log("Transaction started...");

        for (const [productIdStr, configs] of Object.entries(targetPrices)) {
            const productId = parseInt(productIdStr);
            console.log(`Processing Product ID ${productId}...`);

            // 1. Fetch existing prices
            const [existingRows]: any = await connection.execute(
                'SELECT id, weightGrams, weight FROM product_prices WHERE productId = ?',
                [productId]
            );

            const processedIds: number[] = [];

            for (const config of configs) {
                // Find match by weightGrams OR by old weight label (e.g. if we want to reuse a row)
                // But here we rely on weightGrams primarily. If weightGrams matches, we update.
                // If not, we check if there's a record with this label (unlikely if grams changed).
                // Let's stick to weightGrams as unique key logic.

                let match = existingRows.find((r: any) => r.weightGrams === config.weightGrams);

                if (match) {
                    // UPDATE
                    console.log(`  Update ID ${match.id}: ${config.weightLabel} (${config.weightGrams}g) -> R$ ${config.price}`);
                    await connection.execute(
                        'UPDATE product_prices SET price = ?, weight = ?, weightGrams = ?, updatedAt = NOW() WHERE id = ?',
                        [config.price, config.weightLabel, config.weightGrams, match.id]
                    );
                    processedIds.push(match.id);
                } else {
                    // INSERT
                    console.log(`  Insert: ${config.weightLabel} (${config.weightGrams}g) -> R$ ${config.price}`);
                    const [result]: any = await connection.execute(
                        'INSERT INTO product_prices (productId, weight, weightGrams, price, isAvailable, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())',
                        [productId, config.weightLabel, config.weightGrams, config.price]
                    );
                    processedIds.push(result.insertId);
                }
            }

            // 3. DELETE residuals
            // Get all IDs for this product explicitly again or verify from our list
            // Safer: Delete where productId = ? AND id NOT IN (processedIds)
            if (processedIds.length > 0) {
                const [delResult]: any = await connection.execute(
                    `DELETE FROM product_prices WHERE productId = ? AND id NOT IN (${processedIds.join(',')})`,
                    [productId]
                );
                if (delResult.affectedRows > 0) {
                    console.log(`  Deleted ${delResult.affectedRows} old price records.`);
                }
            } else {
                // Should not happen as we always insert, but safety check
                console.warn(`  No prices processed for ${productId}? Skipping delete to be safe.`);
            }
        }

        await connection.commit();
        console.log("Transaction COMMITTED successfully.");

    } catch (err) {
        console.error("Error during update:", err);
        await connection.rollback();
        console.log("Transaction ROLLED BACK.");
    } finally {
        await connection.end();
    }
}

updatePrices();
