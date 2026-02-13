import "dotenv/config";
import mysql from "mysql2/promise";

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL missing!");
        process.exit(1);
    }

    console.log("Connecting to database...");
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        console.log("Creating `media` table...");
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS media (
        id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        provider enum('cloudflare') NOT NULL DEFAULT 'cloudflare',
        providerImageId varchar(255) NOT NULL,
        filename varchar(255),
        status enum('pending','active','orphaned') NOT NULL DEFAULT 'pending',
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

        console.log("Creating `product_media` table...");
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_media (
        id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        productId int NOT NULL,
        mediaId int NOT NULL,
        role enum('cover','gallery','detail') NOT NULL DEFAULT 'gallery',
        displayOrder int NOT NULL DEFAULT 0,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

        console.log("Migration completed successfully!");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migrate();
