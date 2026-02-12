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
    33: [ // Kinder Ovo
        { weightGrams: 550, weightLabel: "550g", price: 129.90 },
        { weightGrams: 750, weightLabel: "750g", price: 169.90 },
        { weightGrams: 1000, weightLabel: "1kg", price: 239.90 }
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
            if (processedIds.length > 0) {
                const [delResult]: any = await connection.execute(
                    `DELETE FROM product_prices WHERE productId = ? AND id NOT IN (${processedIds.join(',')})`,
                    [productId]
                );
                if (delResult.affectedRows > 0) {
                    console.log(`  Deleted ${delResult.affectedRows} old price records.`);
                }
            } else {
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
