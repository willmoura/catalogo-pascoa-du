
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load local .env
dotenv.config();

const LOCAL_DB_URL = process.env.DATABASE_URL;
// Hardcoded Railway URL for this script since it's not in .env yet
const REMOTE_DB_URL = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";

async function syncTable(tableName, localConn, remoteConn) {
    console.log(`\n🔄 Sincronizando tabela: ${tableName}...`);

    // 1. Ler dados locais
    const [rows] = await localConn.query(`SELECT * FROM ${tableName}`);
    if (rows.length === 0) {
        console.log(`   ⚠️ Tabela local vazia. Pulando.`);
        return;
    }
    console.log(`   📦 Lidos ${rows.length} registros locais.`);

    // 2. Preparar Query de Insert/Update
    const firstRow = rows[0];
    const columns = Object.keys(firstRow);
    const placeholders = columns.map(() => '?').join(', ');
    const updateClause = columns.map(col => `${col} = VALUES(${col})`).join(', ');

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;

    // 3. Inserir no Remoto
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
        const values = columns.map(col => {
            const val = row[col];
            // Fix JSON fields if returned as string/object discrepancy (mysql2 usually handles this but good to be safe)
            if (val && typeof val === 'object' && !(val instanceof Date)) {
                return JSON.stringify(val);
            }
            return val;
        });

        try {
            await remoteConn.execute(sql, values);
            successCount++;
        } catch (err) {
            console.error(`   ❌ Falha no ID ${row.id || '?'}:`, err.message);
            errorCount++;
        }
    }

    console.log(`   ✅ Sucesso: ${successCount} | ❌ Erros: ${errorCount}`);
}

async function sync() {
    console.log("🚀 Iniciando Sincronização LOCAL -> RAILWAY");
    console.log(`📁 Local: ${LOCAL_DB_URL}`);
    console.log(`☁️ Remote: ${REMOTE_DB_URL}`);

    if (!LOCAL_DB_URL) {
        console.error("❌ Erro: DATABASE_URL local não encontrada no .env");
        return;
    }

    let localConn, remoteConn;

    try {
        localConn = await mysql.createConnection(LOCAL_DB_URL);
        remoteConn = await mysql.createConnection(REMOTE_DB_URL);

        // Desabilitar verificação de FK temporariamente para permitir sync em qualquer ordem (se necessário), 
        // mas vamos tentar manter a ordem correta.
        await remoteConn.query('SET FOREIGN_KEY_CHECKS=0');

        // Ordem de Dependência:
        // 1. Categories
        // 2. Flavors
        // 3. Products (depende de Categories)
        // 4. ProductPrices (depende de Products)
        // 5. ProductFlavors (depende de Products e Flavors)
        // 6. Users (Admin)

        await syncTable('categories', localConn, remoteConn);
        await syncTable('flavors', localConn, remoteConn);
        await syncTable('products', localConn, remoteConn);
        await syncTable('product_prices', localConn, remoteConn);
        await syncTable('product_flavors', localConn, remoteConn);
        await syncTable('users', localConn, remoteConn);

    } catch (err) {
        console.error("❌ Erro fatal na sincronização:", err);
    } finally {
        if (remoteConn) {
            await remoteConn.query('SET FOREIGN_KEY_CHECKS=1');
            await remoteConn.end();
        }
        if (localConn) await localConn.end();
        console.log("\n🏁 Sincronização finalizada!");
    }
}

sync();
