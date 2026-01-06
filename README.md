Republica 804 - Sistema de Gestao

Sistema web desenvolvido para a gestao financeira e administrativa da Republica 804. O projeto automatiza a divisao de contas mensais e centraliza informacoes sobre as moradoras e eventos da casa.

Link de Acesso
O sistema pode ser acessado em: https://projeto-republica.onrender.com/

Principais Funcionalidades
- Calculo de Gastos: Divisao automatica de aluguel e contas de consumo, considerando variaveis individuais (variação dos quartos, impostos e taxas especificas de condominio).
- Historico Financeiro: Registro de fechamentos mensais com consulta de detalhes individuais.
- Gestao de Moradoras: Banco de dados com informacoes de curso, contato e status de ocupacao.
- Galeria de Fotos: Upload e gerenciamento de imagens dos momentos da republica.
- Dashboard de Estatisticas: Graficos de evolucao de gastos totais, individuais e consumo de energia.

Tecnologias
- Linguagem: JavaScript (Node.js)
- Framework Web: Express
- Motor de View: EJS
- Banco de Dados: SQLite (better-sqlite3)
- Gerenciamento de Upload: Multer
- Graficos: Chart.js

Instalacao e Execucao Local
- Clone o repositorio
- Execute npm install para instalar as dependencias
- Inicie o servidor com npm start
- Acesse http://localhost:3000 no navegador

Observacao sobre Hospedagem
O projeto esta hospedado no plano gratuito do Render. Por utilizar SQLite como banco de dados em arquivo local, os dados sao resetados a cada reinicializacao do servidor. 
Previsao de atualizacao: Migracao para MongoDB Atlas para persistencia de dados permanente.