
import mysql from 'mysql2/promise';

const dbUrl = "mysql://root:yJqtRzVHnNQJsLVxewEAXDtZWixelwzR@hopper.proxy.rlwy.net:36342/railway";

async function testConnection() {
  console.log('Tentando conectar em:', dbUrl);
  try {
    const connection = await mysql.createConnection(dbUrl);
    console.log('✅ Conectado com sucesso!');

    const [rows] = await connection.execute('SHOW TABLES');
    console.log('📋 Tabelas existentes:', rows);

    console.log('🛠 Criando tabela de teste...');
    await connection.execute('CREATE TABLE IF NOT EXISTS teste_conexao (id INT PRIMARY KEY, mensagem VARCHAR(255))');
    console.log('✅ Tabela teste_conexao criada/verificada.');
    
    const [rowsAfter] = await connection.execute('SHOW TABLES');
    console.log('📋 Tabelas após criação:', rowsAfter);

    await connection.end();
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

testConnection();
