import "dotenv/config";
import mysql from "mysql2/promise";

// Railway DB URL provided by user
const RAILWAY_DB_URL = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function listCloudflareImages() {
    const images = [];
    let page = 1;
    while (true) {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1?page=${page}&per_page=100`,
            {
                headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
            }
        );
        const data = await response.json();
        if (!data.success) break;
        const list = data.result.images;
        if (list.length === 0) break;
        images.push(...list);
        page++;
    }
    return images;
}

async function migrate() {
    console.log("Connecting to Railway DB...");
    const connection = await mysql.createConnection(RAILWAY_DB_URL);

    try {
        const [products] = await connection.execute("SELECT id, name, imageUrl FROM products");
        const cfImages = await listCloudflareImages();

        console.log(`Products: ${products.length}, CF Images: ${cfImages.length}`);

        let updatedCount = 0;

        for (const product of (products as any[])) {
            // Logic from BulkImageMigration.tsx
            const normalizedName = product.name
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .replace(/ovo de /g, "")
                .replace(/ovo /g, "")
                .replace(/ /g, "_")
                .trim();

            const match = cfImages.find(img => {
                const filename = img.filename.toLowerCase();
                return filename.includes(normalizedName) && !filename.includes("placeholder");
            });

            if (match) {
                // Check if needs update
                if (product.imageUrl !== match.id) {
                    console.log(`[UPDATE] ${product.name} -> ${match.filename} (${match.id})`);
                    await connection.execute(
                        "UPDATE products SET imageUrl = ? WHERE id = ?",
                        [match.id, product.id]
                    );
                    updatedCount++;
                } else {
                    // console.log(`[SKIP] ${product.name} already linked.`);
                }
            } else {
                // console.log(`[NO MACH] ${product.name} (norm: ${normalizedName})`);
            }
        }

        console.log(`Migration Complete! Updated ${updatedCount} products.`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migrate();
