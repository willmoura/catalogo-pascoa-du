
import sharp from "sharp";
import path from "path";
import fs from "fs";

const SOURCE_DIR = "C:\\Users\\dayan\\Downloads\\Imagens Catálogo";
const DEST_DIR = path.join(process.cwd(), "client/public/products");

async function revertImages() {
    console.log("Reverting specific images using original logic...");

    // 1. Revert Pistache: Standard resize to 800x800 (no trim, no force fit)
    try {
        const sourcePistache = path.join(SOURCE_DIR, "pistache.png");
        const destPistache = path.join(DEST_DIR, "pistache.png");

        console.log(`Processing Pistache (Standard 800x800)...`);
        await sharp(sourcePistache)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFile(destPistache);
        console.log("Pistache reverted.");
    } catch (e) {
        console.error("Error reverting Pistache:", e);
    }

    // 2. Revert Laka Oreo: Keep ORIGINAL (no resize)
    try {
        const sourceLaka = path.join(SOURCE_DIR, "laka_oreo_nutella.jpeg");
        const destLaka = path.join(DEST_DIR, "laka_oreo_nutella.jpeg");

        console.log(`Processing Laka Oreo (Original - No Resize)...`);
        fs.copyFileSync(sourceLaka, destLaka);
        console.log("Laka Oreo reverted.");
    } catch (e) {
        console.error("Error reverting Laka Oreo:", e);
    }
}

revertImages().catch(console.error);
