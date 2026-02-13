import "dotenv/config";

const url = "https://imagedelivery.net/BIvRyidbDBOIzzsESnsR5g/10d689cd-c5cd-4f5f-d02b-3a8721cc6f00/public";

async function testFetch() {
    console.log("Fetching:", url);
    try {
        const response = await fetch(url);
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}

testFetch();
