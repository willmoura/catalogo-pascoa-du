
import mysql from 'mysql2/promise';

const dbUrl = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";

async function countProducts() {
    console.log('📊 Verificando contagem de produtos...');
    try {
        const connection = await mysql.createConnection(dbUrl);
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM products');
        console.log('📦 Total de produtos:', rows[0].count);

        const [activeRows] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE isActive = 1');
        console.log('✅ Total de produtos ativos:', activeRows[0].count);

        await connection.end();
    } catch (err) {
        console.error('❌ Erro:', err);
    }
}

countProducts();
