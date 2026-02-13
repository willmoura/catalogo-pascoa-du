
import mysql from 'mysql2/promise';

const dbUrl = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";

async function deepDebug() {
    console.log('🔍 Iniciando debug profundo...');
    console.log('🔗 URL:', dbUrl);

    try {
        const connection = await mysql.createConnection(dbUrl);

        // 1. Verificar banco atual
        const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
        console.log('database_selecionada:', dbResult[0].current_db);

        // 2. Listar todos os bancos
        const [databases] = await connection.execute('SHOW DATABASES');
        console.log('🗄 Bancos disponíveis:', databases.map(d => d.Database));

        // 3. Listar tabelas explicitamente no banco "railway"
        console.log('📋 Buscando tabelas em "railway"...');
        const [tables] = await connection.execute('SHOW TABLES FROM railway');
        console.log('Tabelas:', tables);

        await connection.end();
    } catch (err) {
        console.error('❌ Erro:', err);
    }
}

deepDebug();
