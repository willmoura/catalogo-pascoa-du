import "dotenv/config";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log("--- START TEST ---");
console.log("Account ID:", ACCOUNT_ID);
console.log("API Token Length:", API_TOKEN ? API_TOKEN.length : "MISSING");

async function testList() {
    if (!ACCOUNT_ID || !API_TOKEN) {
        console.error("ERROR: Missing credentials in .env");
        return;
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2?page=1&per_page=5`;
    console.log("Fetching URL:", url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
            },
        });

        console.log("HTTP Status:", response.status);

        const data = await response.json(); // Parse response as JSON

        if (data.result && data.result.images) {
            console.log("--------------------------------------------------");
            console.log("IMAGES FOUND:", data.result.images.length);
            console.log("--------------------------------------------------");
            if (data.result.images.length > 0) {
                console.log("Sample ID:", data.result.images[0].id);
                console.log("Sample Filename:", data.result.images[0].filename);
            }
        } else {
            console.log("No images found or unexpected response structure.");
            console.log("Raw Response Body:");
            console.log(JSON.stringify(data, null, 2)); // Log the full data if structure is unexpected
        }

    } catch (e) {
        console.error("Fetch Exception:", e);
    }
    console.log("--- END TEST ---");
}

testList();
