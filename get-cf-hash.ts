import "dotenv/config";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function getHash() {
    if (!ACCOUNT_ID || !API_TOKEN) {
        console.error("Missing credentials");
        return;
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2?page=1&per_page=1`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });

        const data = await response.json();

        if (data.success && data.result.images.length > 0) {
            const img = data.result.images[0];
            if (img.variants && img.variants.length > 0) {
                const variantUrl = img.variants[0];
                // format: https://imagedelivery.net/<HASH>/<ID>/<VARIANT>
                const parts = variantUrl.split('/');
                // parts[0] = "https:", parts[1] = "", parts[2] = "imagedelivery.net", parts[3] = HASH
                console.log("HASH_FOUND:", parts[3]);
            } else {
                console.log("No variants found on image.");
            }
        } else {
            console.log("No images found to extract hash.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

getHash();
