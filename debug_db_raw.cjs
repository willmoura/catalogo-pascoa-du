
const mysql = require('mysql2/promise');

async function check() {
    const connection = await mysql.createConnection({
        uri: 'mysql://root:BeMaNu2609@localhost:3306/pascoa_du_shop'
    });

    const [rows] = await connection.execute('SELECT id, name, imageUrl FROM products WHERE imageUrl IS NOT NULL LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
}

check().catch(console.error);
