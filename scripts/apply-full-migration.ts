import "dotenv/config";
import mysql from "mysql2/promise";
import path from "path";

// Railway DB URL provided by user
const RAILWAY_DB_URL = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Helper to get basename from URL/path
function getBasename(urlOrPath: string | null): string | null {
    if (!urlOrPath) return null;
    // If it's already a UUID (no slashes, length > 20), assume it's done or ignore
    if (!urlOrPath.includes("/") && urlOrPath.length > 20) return null;
    return path.basename(urlOrPath);
}

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
        const [products] = await connection.execute("SELECT id, name, imageUrl, galleryImages FROM products");
        const cfImages = await listCloudflareImages();

        console.log(`Products: ${products.length}, CF Images: ${cfImages.length}`);

        // Create lookup map for faster access: filename -> id
        const cfMap = new Map();
        cfImages.forEach(img => {
            cfMap.set(img.filename, img.id);
        });

        let updatedCount = 0;

        for (const product of (products as any[])) {
            let needsUpdate = false;
            let newImageUrl = product.imageUrl;
            let newGalleryImages = product.galleryImages;

            // 1. Update Main Image
            const mainBase = getBasename(product.imageUrl);
            if (mainBase && cfMap.has(mainBase)) {
                const cfId = cfMap.get(mainBase);
                if (newImageUrl !== cfId) {
                    console.log(`[MAIN MATCH] ${product.name}: ${mainBase} -> ${cfId}`);
                    newImageUrl = cfId;
                    needsUpdate = true;
                }
            }

            // 2. Update Gallery Images
            if (product.galleryImages) {
                try {
                    const gallery = JSON.parse(product.galleryImages);
                    if (Array.isArray(gallery) && gallery.length > 0) {
                        const newGallery = gallery.map(imgUrl => {
                            const base = getBasename(imgUrl);
                            if (base && cfMap.has(base)) {
                                const cfId = cfMap.get(base);
                                if (imgUrl !== cfId) {
                                    console.log(`[GALLERY MATCH] ${product.name}: ${base} -> ${cfId}`);
                                    needsUpdate = true;
                                    return cfId;
                                }
                            }
                            return imgUrl;
                        });

                        if (needsUpdate) {
                            newGalleryImages = JSON.stringify(newGallery);
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to parse gallery for product ${product.id}`);
                }
            }

            if (needsUpdate) {
                await connection.execute(
                    "UPDATE products SET imageUrl = ?, galleryImages = ? WHERE id = ?",
                    [newImageUrl, newGalleryImages, product.id]
                );
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
