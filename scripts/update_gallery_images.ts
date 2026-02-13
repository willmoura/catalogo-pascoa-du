
import { eq } from "drizzle-orm";
// import { db } from "../server/src/db"; // Removed to avoid path issues
import { products } from "../drizzle/schema"; // Corrected path
import * as schema from "../drizzle/schema"; // Import all for drizzle constructor if needed
import { sql } from "drizzle-orm";
import * as dotenv from 'dotenv';
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import path from 'path';

// Load environment variables from specific path to ensure it finds .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Script to update galleryImages for specific products
// Source data from user request

const updates = [
    { id: 4, name: "Ovo Trufado Maracujá", imageUrl2: "/products/maracuja_ref.png" },
    { id: 6, name: "Ovo ao Leite Clássico", imageUrl2: "/products/ref_chocolate_ao_leite.png" },
    { id: 7, name: "Ovo ao Leite com Castanhas", imageUrl2: "" },
    { id: 8, name: "Ovo Meio a Meio", imageUrl2: "" },
    { id: 10, name: "Ovo Meio Amargo", imageUrl2: "/products/ref_meio amargo.png" },
    { id: 12, name: "Mini Kit com 4 Ovo de Colher", imageUrl2: "" },
    { id: 13, name: "Mini Kit com 6 Ovo de Colher", imageUrl2: "" },
    { id: 17, name: "Ovo de Chocolate Branco", imageUrl2: "/products/ref_chocolate_branco.png" },
    { id: 18, name: "Ovo Trufado Alpino", imageUrl2: "/products/alpino_ref.png" },
    { id: 19, name: "Ovo Trufado Charge", imageUrl2: "/products/charge_ref.png" },
    { id: 20, name: "Ovo Trufado Doce de Leite", imageUrl2: "/products/doce de leite_ref.png" },
    { id: 21, name: "Ovo Trufado Ferrero Rocher", imageUrl2: "/products/ferrero rocher_ref.png" },
    { id: 22, name: "Ovo Trufado Franuí", imageUrl2: "" },
    { id: 23, name: "Ovo Trufado Kinder Bueno", imageUrl2: "" },
    { id: 24, name: "Ovo Trufado Laka Oreo com Nutella", imageUrl2: "" },
    { id: 25, name: "Ovo Trufado Ninho com Nutella", imageUrl2: "/products/ninho_nutella_ref.png" },
    { id: 26, name: "Ovo Trufado Ovomaltine", imageUrl2: "/products/ovomaltine_ref.png" },
    { id: 27, name: "Ovo Trufado Pistache", imageUrl2: "/products/ref_pistache.png" },
    { id: 28, name: "Ovo Trufado Prestígio", imageUrl2: "" },
    { id: 29, name: "Ovo Trufado Strogonoff de Nozes", imageUrl2: "/products/ref_strogonoff_nozes.png" },
    { id: 30, name: "Ovo Trufado Sensação", imageUrl2: "/products/ref_sensacao.png" },
    { id: 31, name: "Ovo Trufado Maracujá com Nutella", imageUrl2: "/products/ref_maracuja_nutella.png" },
    { id: 32, name: "Ovo Trufado Ninho com Morango", imageUrl2: "/products/ref_ninho_morango.png" },
    { id: 33, name: "Kinder Ovo", imageUrl2: "" },
    { id: 34, name: "Kit com 3 Ovos de Colher", imageUrl2: "" },
    { id: 35, name: "Ovo de Colher", imageUrl2: "" },
];

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found in environment variables.");
        process.exit(1);
    }

    console.log("Connecting to database...");
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection, { schema, mode: 'default' });

    console.log("Starting gallery images update...");

    for (const item of updates) {
        // Prepare galleryImages JSON. 
        // Logic: if imageUrl2 exists, it becomes the single item in the array for now.
        // As per plan, galleryImages contains secondary images.

        let galleryImagesPayload: string | null = null;

        if (item.imageUrl2 && item.imageUrl2.trim() !== '') {
            galleryImagesPayload = JSON.stringify([item.imageUrl2.trim()]);
        }

        // We update even if null to ensure clean state if previously set to something else? 
        // User said "Populate", implies setting values. 
        // Safety: let's update where id matches.

        // Skip if payload is null, unless we want to clear it (which is safer to ensure consistency)
        // Let's clear it if empty string was provided, just in case.

        console.log(`Updating Product ID ${item.id} (${item.name})... Payload: ${galleryImagesPayload}`);

        await db.update(products)
            .set({ galleryImages: galleryImagesPayload })
            .where(eq(products.id, item.id));
    }

    console.log("Update complete.");
    await connection.end();
}

main().catch((err) => {
    console.error("Error running script:", err);
    process.exit(1);
});
