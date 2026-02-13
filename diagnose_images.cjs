
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function diagnose() {
    const connection = await mysql.createConnection({
        uri: 'mysql://root:BeMaNu2609@localhost:3306/pascoa_du_shop'
    });

    const [products] = await connection.execute('SELECT id, name, imageUrl FROM products');
    await connection.end();

    const publicDir = path.join(__dirname, 'client', 'public', 'products');
    let files = [];
    try {
        files = fs.readdirSync(publicDir);
    } catch (e) {
        console.error("Could not read public directory:", e.message);
        return;
    }

    const report = {
        ok: [],
        missingFile: [],
        nullUrlWithPossibleMatch: [],
        nullUrlNoMatch: [],
        badFormat: []
    };

    products.forEach(p => {
        if (p.imageUrl) {
            // Check format
            if (!p.imageUrl.startsWith('/')) {
                report.badFormat.push({ id: p.id, name: p.name, url: p.imageUrl });
            }

            const filename = path.basename(p.imageUrl);
            if (files.includes(filename)) {
                report.ok.push({ id: p.id, name: p.name, url: p.imageUrl });
            } else {
                report.missingFile.push({ id: p.id, name: p.name, url: p.imageUrl, expectedFile: filename });
            }
        } else {
            // Try to find a match fuzzy
            // normalized name: remove accents, lower case, replace spaces with underscores
            let slugName = p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '_');

            // Try exact match with extension
            let match = files.find(f => f.startsWith(slugName + '.') || f === slugName + '.png' || f === slugName + '.jpg');

            // Try containing
            if (!match) {
                const simpleName = slugName.split('_')[0]; // e.g., 'maracuja' from 'ovo_trufado_maracuja'
                match = files.find(f => f.includes(simpleName) && !f.includes('ref'));
            }

            if (match) {
                report.nullUrlWithPossibleMatch.push({ id: p.id, name: p.name, suggestedFile: match });
            } else {
                report.nullUrlNoMatch.push({ id: p.id, name: p.name });
            }
        }
    });

    console.log("=== DIAGNOSTIC REPORT ===");
    console.log(`Total Products: ${products.length}`);
    console.log(`OK: ${report.ok.length}`);
    console.log(`Missing File (404 risk): ${report.missingFile.length}`);
    console.log(`Null URL (Placeholder): ${report.nullUrlWithPossibleMatch.length} (with possible matches)`);

    if (report.missingFile.length > 0) {
        console.log("\n[MISSING FILES] URL exists but file not found:");
        report.missingFile.forEach(x => console.log(`  ID ${x.id} (${x.name}): ${x.url}`));
    }

    if (report.badFormat.length > 0) {
        console.log("\n[BAD FORMAT] URL does not start with /:");
        report.badFormat.forEach(x => console.log(`  ID ${x.id} (${x.name}): ${x.url}`));
    }

    if (report.nullUrlWithPossibleMatch.length > 0) {
        console.log("\n[NULL URL] Products with no URL but found potential image:");
        report.nullUrlWithPossibleMatch.forEach(x => console.log(`  ID ${x.id} (${x.name}) -> Found: ${x.suggestedFile}`));
    }
}

diagnose().catch(console.error);
