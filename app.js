const express = require('express');
const path = require('path');
const { db } = require('./models/db');
const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const financeiroRoutes = require('./routes/financeiro');

app.use('/financeiro', financeiroRoutes);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/galeria', (req, res) => {
    res.render('galeria');
});

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

app.get('/historico', (req, res) => {
    const historico = db.prepare("SELECT * FROM fechamentos ORDER BY mes_referencia DESC").all();
    res.render('historico', { historico });
});

app.get('/estatisticas', (req, res) => {
    try {
        const dadosLuz = db.prepare(`
            SELECT mes_referencia, valor_luz 
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});