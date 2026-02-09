
import sharp from "sharp";
import path from "path";
import fs from "fs";

const DIR = path.join(process.cwd(), "client/public/products");
const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 788;

async function smartResize() {
    console.log(`Smart resizing ALL images in ${DIR} to ${TARGET_WIDTH}x${TARGET_HEIGHT} with TRIM...`);

    const files = fs.readdirSync(DIR).filter(f => f.match(/\.(png|jpg|jpeg)$/i));

    for (const file of files) {
        const filePath = path.join(DIR, file);
        const tempPath = path.join(DIR, `temp_${file}`);

        try {
            // 1. Load image
            let pipeline = sharp(filePath);

            // 2. TRIM transparent borders (if any) to get bounding box of content
            // For JPEGs (no transparency), this might not work well unless background is uniform color.
            // But for PNGs it's crucial.
            // We'll use a threshold for trim to catch near-white/black if needed, but default is exact.
            pipeline = pipeline.trim();

            // 3. Resize to fit inside target box
            pipeline = pipeline.resize(TARGET_WIDTH, TARGET_HEIGHT, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background for the padding
            });

            await pipeline.toFile(tempPath);

            fs.renameSync(tempPath, filePath);
            console.log(`${file}: PROCESSED`);
        } catch (e) {
            console.error(`${file}: FAILED`, e);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
}

smartResize().catch(console.error);
