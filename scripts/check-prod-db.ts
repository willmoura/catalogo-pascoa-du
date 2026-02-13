import "dotenv/config";
import mysql from "mysql2/promise";

const RAILWAY_DB_URL = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";

async function check() {
    const connection = await mysql.createConnection(RAILWAY_DB_URL);
    try {
        const [rows] = await connection.execute("SELECT id, name, imageUrl FROM products LIMIT 10");
        console.table(rows);
    } catch (e) {
        console.error(e);
    } finally {
        connection.end();
    }
}
check();
