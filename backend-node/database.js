const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Inicializar tabelas
db.serialize(() => {
    // Tabela de Produtos (Quermesse)
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            categoria TEXT NOT NULL,
            quantidade INTEGER DEFAULT 0,
            estoque_minimo INTEGER DEFAULT 10,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabela de Movimentações (Entrada/Saída)
    db.run(`
        CREATE TABLE IF NOT EXISTS movimentacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER,
            tipo TEXT CHECK(tipo IN ('ENTRADA', 'SAIDA')) NOT NULL,
            quantidade INTEGER NOT NULL,
            responsavel TEXT,
            doador TEXT,
            data DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(produto_id) REFERENCES produtos(id)
        )
    `);
});

module.exports = db;
