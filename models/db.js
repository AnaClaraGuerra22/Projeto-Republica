const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../data', 'gastos.db');
const db = new Database(dbPath);

// fechamento mensal geral
db.exec(`
CREATE TABLE IF NOT EXISTS fechamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes_referencia TEXT NOT NULL, -- Ex: "Janeiro 2026"
    valor_luz REAL,
    valor_condominio REAL,
    despesas_proprietario REAL,
    valor_total_pago REAL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// moradoras pro historico individual
db.exec(`
CREATE TABLE IF NOT EXISTS pagamentos_moradoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fechamento_id INTEGER,
    nome TEXT,
    valor_pago REAL,
    FOREIGN KEY(fechamento_id) REFERENCES fechamentos(id)
);
`);

// fotos galeria
db.exec(`
CREATE TABLE IF NOT EXISTS galeria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    legenda TEXT,
    url_foto TEXT,
    data_postagem DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);


function salvarFechamento(dados) {
    const insertFechamento = db.prepare(`
        INSERT INTO fechamentos (mes_referencia, valor_luz, valor_condominio, despesas_proprietario, valor_total_pago)
        VALUES (?, ?, ?, ?, ?)
    `);

    const insertPagamento = db.prepare(`
        INSERT INTO pagamentos_moradoras (fechamento_id, nome, valor_pago)
        VALUES (?, ?, ?)
    `);

    const transacao = db.transaction((dados) => {
        const info = insertFechamento.run(
            dados.mes, 
            dados.luz, 
            dados.condominio, 
            dados.despesa_prop, 
            dados.totalGeral
        );
        
        const fechamentoId = info.lastInsertRowid;

        dados.detalhes.forEach(m => {
            insertPagamento.run(fechamentoId, m.nome, m.valor);
        });
    });

    transacao(dados);
}

module.exports = { db, salvarFechamento };

//module.exports = db;