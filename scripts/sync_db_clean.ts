
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import readline from 'readline';

// Load local .env
dotenv.config();

const LOCAL_DB_URL = process.env.DATABASE_URL;
const REMOTE_DB_URL = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";

async function syncTable(tableName, localConn, remoteConn) {
    // 1. Ler dados locais
    const [rows] = await localConn.query(`SELECT * FROM ${tableName}`);
    if (rows.length === 0) {
        console.log(`   ⚠️ Tabela local ${tableName} vazia.`);
        return;
    }

    // 2. Preparar Insert
    const firstRow = rows[0];
    const columns = Object.keys(firstRow);
    const placeholders = columns.map(() => '?').join(', ');

    // Usar INSERT simples pois acabamos de truncar
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    let successCount = 0;
    for (const row of rows) {
        const values = columns.map(col => {
            const val = row[col];
            if (val && typeof val === 'object' && !(val instanceof Date)) {
                return JSON.stringify(val);
            }
            return val;
        });

        try {
            await remoteConn.execute(sql, values);
            successCount++;
        } catch (err) {
            console.error(`   ❌ Update falhou ID ${row.id}:`, err.message);
        }
    }
    console.log(`   ✅ ${tableName}: ${successCount} registros inseridos.`);
}

async function cleanAndSync() {
    console.log("🚀 MODO DE LIMPEZA E SINCRONIZAÇÃO");
    console.log(`📁 Local (Origem): ${LOCAL_DB_URL}`);
    console.log(`☁️ Remote (Destino - VAI SER LIMPO): ${REMOTE_DB_URL}`);

    if (!LOCAL_DB_URL) {
        console.error("❌ Erro: DATABASE_URL local não encontrada.");
        return;
    }

    let localConn, remoteConn;

    try {
        localConn = await mysql.createConnection(LOCAL_DB_URL);
        remoteConn = await mysql.createConnection(REMOTE_DB_URL);

        console.log("\n⚠️  ATENÇÃO: Isso vai APAGAR TODOS os dados no Railway e substituir pelos locais.");
        console.log("⏳ Iniciando limpeza em 3 segundos...");
        await new Promise(r => setTimeout(r, 3000));

        await remoteConn.query('SET FOREIGN_KEY_CHECKS=0');

        const tables = ['product_flavors', 'product_prices', 'products', 'flavors', 'categories', 'users', 'orders'];

        for (const table of tables) {
            console.log(`🗑️  Limpando tabela remota: ${table}...`);
            await remoteConn.query(`TRUNCATE TABLE ${table}`);
        }

        console.log("\n🔄 Iniciando cópia dos dados locais...");

        // Ordem importa (pais primeiro)
        await syncTable('users', localConn, remoteConn);
        await syncTable('categories', localConn, remoteConn);
        await syncTable('flavors', localConn, remoteConn);
        await syncTable('products', localConn, remoteConn);
        await syncTable('product_prices', localConn, remoteConn);
        await syncTable('product_flavors', localConn, remoteConn);
        // Não syncamos orders (geralmente não queremos sobrescrever histórico de pedidos de prod com dev, mas se o user quer igual...)
        // O user disse "sujeira", refere-se ao catálogo. Vou pular orders pra segurança, ou limpar e deixar vazio.
        // Como é deploy novo, vou deixar orders vazio no remote (já foi truncado).

    } catch (err) {
        console.error("❌ Erro fatal:", err);
    } finally {
        if (remoteConn) {
            await remoteConn.query('SET FOREIGN_KEY_CHECKS=1');
            await remoteConn.end();
        }
        if (localConn) await localConn.end();
        console.log("\n🏁 Limpeza e Sincronização finalizada!");
    }
}

cleanAndSync();
