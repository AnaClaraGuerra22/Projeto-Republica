const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs'); 

const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'gastos.db');

// erro do render
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);


// fechamento mensal historico
db.exec(`
CREATE TABLE IF NOT EXISTS fechamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes_referencia TEXT NOT NULL,
    valor_luz REAL,
    valor_condominio REAL,
    despesas_proprietario REAL,
    valor_total_pago REAL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// pagamento individual
db.exec(`
CREATE TABLE IF NOT EXISTS pagamentos_moradoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fechamento_id INTEGER,
    nome TEXT,
    valor_pago REAL,
    FOREIGN KEY(fechamento_id) REFERENCES fechamentos(id)
);
`);

// fotos
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

// moradoras
db.prepare(`
    CREATE TABLE IF NOT EXISTS moradoras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT, 
        status TEXT, 
        curso TEXT, 
        entrada TEXT, 
        saida TEXT, 
        foto TEXT, 
        info TEXT, 
        email TEXT, 
        celular TEXT, 
        pais TEXT
    )
`).run();


module.exports = { db, salvarFechamento };

//module.exports = db;