
const mysql = require('mysql2/promise');

async function check() {
    try {
        const connection = await mysql.createConnection({
            uri: 'mysql://root:BeMaNu2609@localhost:3306/pascoa_du_shop'
        });

        console.log("Connected to DB");

        const [rows] = await connection.execute('SELECT id, name FROM flavors WHERE name LIKE "%Ovoma%"');
        console.log("Flavors found:");
        console.log(JSON.stringify(rows, null, 2));

        await connection.end();
    } catch (err) {
        console.error("Error connecting to DB:", err);
    }
}

check().catch(console.error);
