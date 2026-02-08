
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

async function run() {
    try {
        console.log("Connecting to DB...");
        const conn = await mysql.createConnection(process.env.DATABASE_URL);
        console.log("Connected. Fetching flavors...");
        const [rows] = await conn.execute('SELECT * FROM flavors WHERE isActive = true ORDER BY displayOrder ASC');
        console.log("--- RESULT ---");
        console.log(JSON.stringify(rows, null, 2));
        await conn.end();
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
