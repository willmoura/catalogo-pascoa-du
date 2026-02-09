
import sharp from "sharp";
import path from "path";
import fs from "fs";

const DIR = path.join(process.cwd(), "client/public/products");
const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 788;

async function forceResizeAll() {
    console.log(`Force resizing ALL images in ${DIR} to ${TARGET_WIDTH}x${TARGET_HEIGHT}...`);

    const files = fs.readdirSync(DIR).filter(f => f.match(/\.(png|jpg|jpeg)$/i));

    for (const file of files) {
        const filePath = path.join(DIR, file);
        const tempPath = path.join(DIR, `temp_${file}`);

        try {
            // Use 'contain' to ensure exact dimensions without cropping or stretching
            // Background is transparent for PNGs, black (default) for JPEGs usually, but we can set it.
            // Since most are PNGs with likely transparent backgrounds, we want transparent fill.
            await sharp(filePath)
                .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
                })
                .toFile(tempPath);

            fs.renameSync(tempPath, filePath);
            console.log(`${file}: SUCCESS`);
        } catch (e) {
            console.error(`${file}: FAILED`, e);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
}

forceResizeAll().catch(console.error);
