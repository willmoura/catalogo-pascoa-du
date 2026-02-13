import "dotenv/config";
import mysql from "mysql2/promise";

// Railway DB URL provided by user
const RAILWAY_DB_URL = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_HASH = process.env.VITE_CF_ACCOUNT_HASH;

async function listCloudflareImages() {
    const images = [];
    let page = 1;
    while (true) {
        console.log(`Fetching Cloudflare images page ${page}...`);
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1?page=${page}&per_page=100`,
            {
                headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
            }
        );
        const data = await response.json();
        if (!data.success) {
            console.error("CF Error:", data.errors);
            break;
        }
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
        // 1. Get Products
        const [products] = await connection.execute("SELECT id, name, imageUrl FROM products");
        console.log(`Found ${products.length} products in DB.`);

        // 2. Get Cloudflare Images
        const cfImages = await listCloudflareImages();
        console.log(`Found ${cfImages.length} images in Cloudflare.`);

        let updatedCount = 0;

        // 3. Match and Update
        for (const product of (products as any[])) {
            // Prepare normalized names for matching
            const pName = product.name.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .replace(/[^a-z0-9]/g, ""); // remove special chars

            // Find match
            const match = cfImages.find(img => {
                const fname = img.filename.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, "");
                return fname.includes(pName) || pName.includes(fname);
            });

            if (match) {
                // Check if already updated (starts with Cloudflare UUID typically, or just doesn't start with /)
                // But checking if it MATCHES the found ID is better.
                if (product.imageUrl === match.id) {
                    // already up to date
                    continue;
                }

                console.log(`Matching '${product.name}' -> '${match.filename}'`);

                // UPDATE
                await connection.execute(
                    "UPDATE products SET imageUrl = ? WHERE id = ?",
                    [match.id, product.id]
                );

                // Also insert into media/product_media tables if you want full correctness, 
                // but for "speed" (loading), updating products.imageUrl is the critical path for the storefront.

                updatedCount++;
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
