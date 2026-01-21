/*
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db } = require('./models/db');
const app = express();

// 1. GARANTIR QUE AS PASTAS EXISTAM (Essencial para o Render)
const pastas = [
    path.join(__dirname, 'data'),
    path.join(__dirname, 'public', 'imagens')
];

pastas.forEach(p => {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
        console.log(`Pasta criada: ${p}`);
    }
});

// 2. CONFIGURAÇÃO DO MULTER (Definindo a variável 'upload' antes das rotas)
const storage = multer.diskStorage({
    destination: (req, file, cb) => { 
        cb(null, path.join(__dirname, 'public', 'imagens')); 
    },
    filename: (req, file, cb) => { 
        cb(null, Date.now() + '-' + file.originalname); 
    }
});
const upload = multer({ storage: storage });

// 3. CONFIGURAÇÕES DO APP
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. IMPORTAÇÃO DE ROTAS EXTERNAS
const financeiroRoutes = require('./routes/financeiro');
app.use('/financeiro', financeiroRoutes);

// 5. ROTAS GERAIS
app.get('/', (req, res) => {
    res.render('index');
});

// --- GALERIA ---
app.get('/galeria', (req, res) => {
    const fotos = db.prepare("SELECT * FROM galeria ORDER BY data_postagem DESC").all();
    res.render('galeria', { fotos });
});

app.post('/galeria/adicionar', upload.single('foto_galeria'), (req, res) => {
    try {
        const { legenda } = req.body;
        const url_foto = req.file ? `/imagens/${req.file.filename}` : '/imagens/placeholder.jpeg';
        
        db.prepare("INSERT INTO galeria (legenda, url_foto) VALUES (?, ?)").run(legenda, url_foto);
        res.redirect('/galeria');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao postar foto.");
    }
});

app.post('/galeria/editar/:id', upload.single('foto_galeria_edit'), (req, res) => {
    try {
        const { legenda } = req.body;
        const fotoExistente = db.prepare("SELECT url_foto FROM galeria WHERE id = ?").get(req.params.id);
        const url_foto = req.file ? `/imagens/${req.file.filename}` : fotoExistente.url_foto;

        db.prepare("UPDATE galeria SET legenda = ?, url_foto = ? WHERE id = ?")
          .run(legenda, url_foto, req.params.id);
          
        res.redirect('/galeria');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao editar momento.");
    }
});

app.post('/galeria/deletar/:id', (req, res) => {
    db.prepare("DELETE FROM galeria WHERE id = ?").run(req.params.id);
    res.redirect('/galeria');
});

// --- MORADORAS ---
app.get('/moradoras', (req, res) => {
    const listaMoradoras = db.prepare("SELECT * FROM moradoras ORDER BY status ASC, nome ASC").all();
    res.render('moradoras', { moradoras: listaMoradoras });
});

app.post('/moradoras/adicionar', upload.single('foto_arquivo'), (req, res) => {
    try {
        const { nome, status, curso, entrada, saida, info, email, celular, pais } = req.body;
        const fotoPath = req.file ? `/imagens/${req.file.filename}` : '/imagens/default.jpeg';

        db.prepare(`
            INSERT INTO moradoras (nome, status, curso, entrada, saida, foto, info, email, celular, pais)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(nome, status, curso, entrada, saida, fotoPath, info, email, celular, pais);
        
        res.redirect('/moradoras');
    } catch (err) {
        console.error("Erro ao salvar moradora:", err);
        res.status(500).send("Erro ao salvar os dados.");
    }
});

app.post('/moradoras/deletar/:id', (req, res) => {
    db.prepare("DELETE FROM moradoras WHERE id = ?").run(req.params.id);
    res.redirect('/moradoras');
});

app.post('/moradoras/editar/:id', upload.single('foto_arquivo'), (req, res) => {
    try {
        const { nome, status, curso, entrada, saida, info, email, celular, pais } = req.body;
        const moradoraAtual = db.prepare("SELECT foto FROM moradoras WHERE id = ?").get(req.params.id);
        const foto = req.file ? `/imagens/${req.file.filename}` : moradoraAtual.foto;

        db.prepare(`
            UPDATE moradoras 
            SET nome=?, status=?, curso=?, entrada=?, saida=?, foto=?, info=?, email=?, celular=?, pais=?
            WHERE id = ?
        `).run(nome, status, curso, entrada, saida, foto, info, email, celular, pais, req.params.id);
        
        res.redirect('/moradoras');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao editar moradora.");
    }
});

// --- HISTÓRICO ---
app.get('/historico', (req, res) => {
    const historico = db.prepare("SELECT * FROM fechamentos ORDER BY mes_referencia DESC").all();
    res.render('historico', { historico });
});

app.get('/historico/detalhes/:id', (req, res) => {
    try {
        const detalhes = db.prepare(`
            SELECT nome, valor_pago as valor 
            FROM pagamentos_moradoras 
            WHERE fechamento_id = ?
        `).all(req.params.id);
        res.json(detalhes);
    } catch (err) {
        res.status(500).json({ erro: "Não foi possível carregar os detalhes" });
    }
});

app.post('/historico/deletar/:id', (req, res) => {
    try {
        const id = req.params.id;
        const deletarTudo = db.transaction(() => {
            db.prepare("DELETE FROM pagamentos_moradoras WHERE fechamento_id = ?").run(id);
            db.prepare("DELETE FROM fechamentos WHERE id = ?").run(id);
        });
        deletarTudo();
        res.redirect('/historico?removido=true');
    } catch (err) {
        console.error("Erro ao deletar histórico:", err);
        res.status(500).send("Erro ao remover o registro.");
    }
});

// --- ESTATÍSTICAS ---
app.get('/estatisticas', (req, res) => {
    try {
        const dadosLuz = db.prepare(`
            SELECT mes_referencia, valor_luz, valor_total_pago 
            FROM fechamentos 
            ORDER BY mes_referencia ASC 
            LIMIT 12
        `).all();

        const dadosPagamentos = db.prepare(`
            SELECT f.mes_referencia, p.nome, p.valor_pago
            FROM pagamentos_moradoras p
            JOIN fechamentos f ON p.fechamento_id = f.id
            ORDER BY f.mes_referencia ASC
        `).all();

        res.render('estatisticas', { dadosLuz, dadosPagamentos });
    } catch (err) {
        console.error(err);
        res.render('estatisticas', { dadosLuz: [], dadosPagamentos: [] });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

*/

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ObjectId } = require('mongodb'); 
const { connectDB } = require('./models/db'); 

const app = express();

// 1. GARANTIR QUE AS PASTAS EXISTAM
const pastas = [
    path.join(__dirname, 'public', 'imagens')
];
pastas.forEach(p => {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// 2. CONFIGURAÇÃO DO MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, path.join(__dirname, 'public', 'imagens')); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

// 3. CONFIGURAÇÕES DO APP
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. IMPORTAÇÃO DE ROTAS EXTERNAS
const financeiroRoutes = require('./routes/financeiro');
app.use('/financeiro', financeiroRoutes);

app.get('/', (req, res) => res.render('index'));

// --- GALERIA ---
app.get('/galeria', async (req, res) => {
    try {
        const db = await connectDB();
        const fotos = await db.collection('galeria').find().sort({ data_postagem: -1 }).toArray() || [];
        res.render('galeria', { fotos });
    } catch (err) {
        console.error("Erro ao carregar galeria:", err);
        res.render('galeria', { fotos: [] });
    }
});

app.post('/galeria/adicionar', upload.single('foto_galeria'), async (req, res) => {
    try {
        const { legenda } = req.body;
        const url_foto = req.file ? `/imagens/${req.file.filename}` : '/imagens/placeholder.jpeg';
        const db = await connectDB();
        await db.collection('galeria').insertOne({ legenda, url_foto, data_postagem: new Date() });
        res.redirect('/galeria');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao postar foto.");
    }
});

app.post('/galeria/editar/:id', upload.single('foto_galeria_edit'), async (req, res) => {
    try {
        const db = await connectDB();
        const { legenda } = req.body;
        const fotoExistente = await db.collection('galeria').findOne({ _id: new ObjectId(req.params.id) });
        const url_foto = req.file ? `/imagens/${req.file.filename}` : fotoExistente.url_foto;

        await db.collection('galeria').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { legenda, url_foto } }
        );
        res.redirect('/galeria');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao editar foto.");
    }
});

app.post('/galeria/deletar/:id', async (req, res) => {
    try {
        const db = await connectDB();
        await db.collection('galeria').deleteOne({ _id: new ObjectId(req.params.id) });
        res.redirect('/galeria');
    } catch (err) {
        res.status(500).send("Erro ao deletar foto.");
    }
});

// --- MORADORAS ---
app.get('/moradoras', async (req, res) => {
    try {
        const db = await connectDB();
        const listaMoradoras = await db.collection('moradoras').find().sort({ status: 1, nome: 1 }).toArray() || [];
        res.render('moradoras', { moradoras: listaMoradoras });
    } catch (err) {
        console.error("Erro ao buscar moradoras:", err);
        res.render('moradoras', { moradoras: [] });
    }
});

app.post('/moradoras/adicionar', upload.single('foto_arquivo'), async (req, res) => {
    try {
        const db = await connectDB();
        const fotoPath = req.file ? `/imagens/${req.file.filename}` : '/imagens/default.jpeg';
        // Criando o objeto com todos os campos do corpo da requisição
        const novaMoradora = { ...req.body, foto: fotoPath };
        await db.collection('moradoras').insertOne(novaMoradora);
        res.redirect('/moradoras');
    } catch (err) {
        console.error("Erro ao salvar moradora:", err);
        res.status(500).send("Erro ao salvar.");
    }
});

app.post('/moradoras/editar/:id', upload.single('foto_arquivo'), async (req, res) => {
    try {
        const db = await connectDB();
        const moradoraAtual = await db.collection('moradoras').findOne({ _id: new ObjectId(req.params.id) });
        const foto = req.file ? `/imagens/${req.file.filename}` : moradoraAtual.foto;

        await db.collection('moradoras').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { ...req.body, foto } }
        );
        res.redirect('/moradoras');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao editar moradora.");
    }
});

app.post('/moradoras/deletar/:id', async (req, res) => {
    try {
        const db = await connectDB();
        await db.collection('moradoras').deleteOne({ _id: new ObjectId(req.params.id) });
        res.redirect('/moradoras');
    } catch (err) {
        res.status(500).send("Erro ao deletar moradora.");
    }
});

// --- HISTORICO ---
app.get('/historico', async (req, res) => {
    try {
        const db = await connectDB();
        const historico = await db.collection('fechamentos').find().sort({ mes_referencia: -1 }).toArray() || [];
        res.render('historico', { historico });
    } catch (err) {
        res.render('historico', { historico: [] });
    }
});

app.get('/historico/detalhes/:id', async (req, res) => {
    try {
        const db = await connectDB();
        const item = await db.collection('fechamentos').findOne({ _id: new ObjectId(req.params.id) });
        res.json(item.detalhes_pagamentos || []); 
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar detalhes" });
    }
});

app.post('/historico/deletar/:id', async (req, res) => {
    try {
        const db = await connectDB();
        await db.collection('fechamentos').deleteOne({ _id: new ObjectId(req.params.id) });
        res.redirect('/historico?removido=true');
    } catch (err) {
        res.status(500).send("Erro ao deletar histórico.");
    }
});

// --- ESTATÍSTICAS ---
app.get('/estatisticas', async (req, res) => {
    try {
        const db = await connectDB();
        const fechamentos = await db.collection('fechamentos').find().sort({ mes_referencia: 1 }).toArray() || [];

        const dadosLuz = fechamentos.map(f => ({
            mes_referencia: f.mes_referencia,
            valor_luz: f.valor_luz,
            valor_total_pago: f.valor_total_pago
        }));

        let dadosPagamentos = [];
        fechamentos.forEach(f => {
            if (f.detalhes_pagamentos) {
                f.detalhes_pagamentos.forEach(p => {
                    dadosPagamentos.push({
                        mes_referencia: f.mes_referencia,
                        nome: p.nome,
                        valor_pago: parseFloat(p.valor)
                    });
                });
            }
        });

        res.render('estatisticas', { dadosLuz, dadosPagamentos });
    } catch (err) {
        console.error(err);
        res.render('estatisticas', { dadosLuz: [], dadosPagamentos: [] });
    }
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando no MongoDB Atlas na porta ${PORT}`);
});