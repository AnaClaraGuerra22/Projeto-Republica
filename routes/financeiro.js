
    // (Com caixinha de 50,00 total: +10,00 cada)
    // Julia: Base + 10
    // Meninas: Base + 10 + 18.47 (IPTU)
    // Eduarda: Base + 30 + 18.47 (Quarto maior +20)
    // Ana: Base + 50 + 18.47 (Suíte +40)

    // IPTU
    // 10 parcelas de 18.47
    // INICIO: JULHO 2025
    // FINAL: ABRIL 2026

const express = require('express');
const router = express.Router();
const { salvarFechamento } = require('../models/db'); // Garanta que o caminho está correto

router.post('/calcular', (req, res) => {
    // valores fixos
    const ALUGUEL = 3200.00;
    const INTERNET = 99.90;
    const SEGURO = 23.53;
    
    // boletos
    const luz = parseFloat(req.body.luz) || 0;
    const condominio = parseFloat(req.body.condominio) || 0;
    const despesa_prop = parseFloat(req.body.despesa_prop) || 0;
    const mes = req.body.mes; 

    let valorIptuAtual = 0;
    if (mes <= "2026-04") {
        valorIptuAtual = 18.47;
    }

    const pagarTotal = ALUGUEL + condominio - despesa_prop + luz + INTERNET + SEGURO;
    
    const pagarComAjuste = pagarTotal - 60;
    const indvBase = pagarComAjuste / 5.0;

    const vMalu = indvBase + 10 + valorIptuAtual;
    const vJulia = indvBase + 10; 
    const vEduarda = indvBase + 30 + valorIptuAtual;
    const vAna = indvBase + 50 + valorIptuAtual;

    const resultado = {
        mes: mes,
        luz: luz,               
        condominio: condominio, 
        despesa_prop: despesa_prop, 
        totalGeral: pagarTotal.toFixed(2),
        imobiliaria: (ALUGUEL + SEGURO - despesa_prop).toFixed(2),
        detalhes: [
            { 
                nome: "MENINAS", 
                valor: vMalu.toFixed(2),
                nota: valorIptuAtual > 0 ? "+ IPTU" : "IPTU Finalizado" 
            },
            { 
                nome: "JULIA", 
                valor: vJulia.toFixed(2), 
                nota: "Sem IPTU" 
            },
            { 
                nome: "EDUARDA", 
                valor: vEduarda.toFixed(2), 
                nota: valorIptuAtual > 0 ? "Quarto Maior + IPTU" : "Quarto Maior" 
            },
            { 
                nome: "ANA", 
                valor: vAna.toFixed(2), 
                nota: valorIptuAtual > 0 ? "Suíte + IPTU" : "Suíte" 
            }
        ]
    };

    res.render('resultado', { resultado });
});

router.post('/salvar', (req, res) => {
    try {
        const dadosParaSalvar = JSON.parse(req.body.dadosEscondidos);
        salvarFechamento(dadosParaSalvar);
        res.redirect('/historico?sucesso=true');
    } catch (err) {
        console.error(err);
        res.send("Erro ao salvar os dados.");
    }
});

module.exports = router;
