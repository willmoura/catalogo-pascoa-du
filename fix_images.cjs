
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fix() {
    const connection = await mysql.createConnection({
        uri: 'mysql://root:BeMaNu2609@localhost:3306/pascoa_du_shop'
    });

    const [products] = await connection.execute('SELECT id, name, imageUrl FROM products');

    const publicDir = path.join(__dirname, 'client', 'public', 'products');
    let files = [];
    try {
        files = fs.readdirSync(publicDir);
    } catch (e) {
        console.error("Could not read public directory:", e.message);
        await connection.end();
        return;
    }

    let updates = 0;

    for (const p of products) {
        if (!p.imageUrl) {
            // normalized name logic from diagnose
            let slugName = p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '_');

            // Try exact match with extension
            let match = files.find(f => f.startsWith(slugName + '.') || f === slugName + '.png' || f === slugName + '.jpg');

            // Try containing
            if (!match) {
                const simpleName = slugName.split('_')[0];
                match = files.find(f => f.includes(simpleName) && !f.includes('ref'));
            }

            if (match) {
                const newUrl = `/products/${match}`;
                console.log(`[UPDATE] ID ${p.id} (${p.name}): NULL -> ${newUrl}`);
                await connection.execute('UPDATE products SET imageUrl = ? WHERE id = ?', [newUrl, p.id]);
                updates++;
            } else {
                console.log(`[SKIP] ID ${p.id} (${p.name}): No matching file found.`);
            }
        }
    }

    console.log(`\nFixed ${updates} products.`);
    await connection.end();
}

fix().catch(console.error);
