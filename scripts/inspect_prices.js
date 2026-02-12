import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'BeMaNu2609',
    database: 'pascoa_du_shop'
};

const ids = [6, 17, 8, 10];

async function inspect() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(
            `SELECT * FROM product_prices WHERE productId IN (${ids.join(',')}) ORDER BY productId, weightGrams`
        );
        await fs.writeFile('prices_dump.json', JSON.stringify(rows, null, 2));
        console.log('Dumped to prices_dump.json');
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

inspect();
