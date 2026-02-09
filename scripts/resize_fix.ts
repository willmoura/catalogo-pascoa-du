
import sharp from "sharp";
import path from "path";
import fs from "fs";

const DIR = path.join(process.cwd(), "client/public/products");
const filesToResize = [
    { name: "franui.png", size: 600 },
    { name: "laka_oreo_nutella.jpeg", size: 600 },
    { name: "prestigio.png", size: 600 }
];

async function resizeImages() {
    console.log("Resizing specific images...");
    for (const item of filesToResize) {
        const filePath = path.join(DIR, item.name);
        if (!fs.existsSync(filePath)) {
            console.log(`${item.name}: NOT FOUND`);
            continue;
        }

        // Create temp file
        const tempPath = path.join(DIR, `temp_${item.name}`);

        try {
            await sharp(filePath)
                .resize(item.size, item.size, { fit: 'inside', withoutEnlargement: true })
                .toFile(tempPath);

            // Replace original
            fs.renameSync(tempPath, filePath);
            console.log(`${item.name}: Resized to fit ${item.size}x${item.size}`);
        } catch (e) {
            console.error(`${item.name}: Error resizing`, e);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
}

resizeImages().catch(console.error);
