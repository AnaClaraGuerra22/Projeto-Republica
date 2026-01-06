const express = require('express');
const path = require('path');
const { db } = require('./models/db');
const app = express();
const multer = require('multer');


const fs = require('fs');

// usar Render
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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// onde salvar as fotos
/*
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'public/imagens/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });
*/

// ajuste para render
const storage = multer.diskStorage({
    destination: (req, file, cb) => { 
        cb(null, path.join(__dirname, 'public', 'imagens')); 
    },
    filename: (req, file, cb) => { 
        cb(null, Date.now() + '-' + file.originalname); 
    }
});


const financeiroRoutes = require('./routes/financeiro');
app.use('/financeiro', financeiroRoutes);

app.get('/', (req, res) => {
    res.render('index');
});


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
/*

app.get('/moradoras', (req, res) => {
    const listaMoradoras = [
        { 
            nome: "Ana", 
            status: "Ativo", 
            curso: "Ciência da Computação", 
            entrada: "08/2022", 
            saida: "-", 
            foto: "/imagens/ana.jpeg",
            info: "Suíte",
            email: "ana.torres1@ufv.br",
            celular: "(31) 99435-3574",
            pais: "(31) 99400-3574"
        },
        { 
            nome: "Maria Cecilia", 
            status: "Inativo", 
            curso: "Eng Produção", 
            entrada: "2021", 
            saida: "2023", 
            foto: "/imagens/Maria.jpeg",
            info: "-",
            email: "maria@email.com",
            celular: "-",
            pais: "-"
        },
        { 
            nome: "Maria Clara", 
            status: "Ativo", 
            curso: "Biologia", 
            entrada: "2025", 
            saida: "-", 
            foto: "/imagens/MariaClara.jpeg",
            info: "-",
            email: "mclara@email.com",
            celular: "(31) 99999-0002",
            pais: "(31) 98888-0002"
        },
        { 
            nome: "Eduarda", 
            status: "Ativo", 
            curso: "Zootecnia", 
            entrada: "2025", 
            saida: "-", 
            foto: "/imagens/duda.jpeg",
            info: "Quarto Maior",
            email: "duda@email.com",
            celular: "(31) 99999-0003",
            pais: "(31) 98888-0003"
        },
        { 
            nome: "Julia", 
            status: "Ativo", 
            curso: "Direito", 
            entrada: "2021", 
            saida: "-", 
            foto: "/imagens/julia.jpeg",
            info: "IPTU ja pago",
            email: "julia@email.com",
            celular: "(31) 99999-0004",
            pais: "(31) 98888-0004"
        },
        { 
            nome: "Luna", 
            status: "Ativo", 
            curso: "Veterinária", 
            entrada: "2024", 
            saida: "-", 
            foto: "/imagens/luna.jpeg",
            info: "-",
            email: "luna@email.com",
            celular: "(31) 99999-0005",
            pais: "(31) 98888-0005"
        },
        { 
            nome: "Isadora", 
            status: "Inativo", 
            curso: "Direito", 
            entrada: "2021", 
            saida: "2024", 
            foto: "/imagens/isa.jpeg",
            info: "-",
            email: "isa@email.com",
            celular: "-",
            pais: "-"
        }
    ];
    res.render('moradoras', { moradoras: listaMoradoras });
});
*/



app.get('/moradoras', (req, res) => {
    const listaMoradoras = db.prepare("SELECT * FROM moradoras ORDER BY status ASC, nome ASC").all();
    res.render('moradoras', { moradoras: listaMoradoras });
});



app.post('/moradoras/adicionar', upload.single('foto_arquivo'), (req, res) => {
    try {
        const { nome, status, curso, entrada, saida, info, email, celular, pais } = req.body;

        const fotoPath = req.file ? `/imagens/${req.file.filename}` : '/imagens/default.jpeg';

        const stmt = db.prepare(`
            INSERT INTO moradoras (nome, status, curso, entrada, saida, foto, info, email, celular, pais)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(nome, status, curso, entrada, saida, fotoPath, info, email, celular, pais);
        
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

/*
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
*/

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});