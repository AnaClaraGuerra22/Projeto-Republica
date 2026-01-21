/*
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
*/

require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

// Função para conectar ao banco
async function connectDB() {
    if (db) return db;
    try {
        await client.connect();
        console.log("✅ Conectado ao MongoDB Atlas!");
        db = client.db('republica_db');
        return db;
    } catch (error) {
        console.error("❌ Erro ao conectar ao MongoDB:", error);
        throw error;
    }
}

// Adaptando a função de salvar fechamento
async function salvarFechamento(dados) {
    const database = await connectDB();
    
    // No MongoDB, salvamos o objeto inteiro, o que é muito mais simples que no SQL
    const fechamentoParaSalvar = {
        mes_referencia: dados.mes,
        valor_luz: dados.luz,
        valor_condominio: dados.condominio,
        despesas_proprietario: dados.despesa_prop,
        valor_total_pago: dados.totalGeral,
        detalhes_pagamentos: dados.detalhes, // Aqui salvamos a lista de moradoras direto no objeto
        data_criacao: new Date()
    };

    const result = await database.collection('fechamentos').insertOne(fechamentoParaSalvar);
    return result;
}

// Exportamos a função de conexão e a de salvar
module.exports = { connectDB, salvarFechamento };