
import { getAllFlavors } from "./db";
import { config } from "dotenv";
import path from "path";

// Load .env from root
config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    try {
        const flavors = await getAllFlavors();
        console.log(JSON.stringify(flavors, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error fetching flavors:", error);
        process.exit(1);
    }
}

main();
