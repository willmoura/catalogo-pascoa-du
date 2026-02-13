import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";

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

async function diagnose() {
    console.log("Connecting to Railway DB...");
    const connection = await mysql.createConnection(RAILWAY_DB_URL);

    try {
        const [products] = await connection.execute("SELECT id, name, imageUrl FROM products");
        const cfImages = await listCloudflareImages();

        // Create a mapping proposal
        const mapping = {
            products: products,
            cfImages: cfImages.map(img => ({ id: img.id, filename: img.filename }))
        };

        fs.writeFileSync("migration-diagnosis.json", JSON.stringify(mapping, null, 2));
        console.log("Diagnosis written to migration-diagnosis.json");

    } catch (error) {
        console.error("Diagnosis failed:", error);
    } finally {
        await connection.end();
    }
}

diagnose();
