const express = require('express');
const cors = require('cors');
const os = require('os');
const db = require('./database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Rota para pegar o IP local da máquina
app.get('/api/ip', (req, res) => {
  const interfaces = os.networkInterfaces();
  let localIp = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
  }
  res.json({ ip: localIp });
});

const PORT = 3001;

// --- Rotas de Produtos ---

// Listar produtos
app.get('/api/produtos', (req, res) => {
    db.all('SELECT * FROM produtos', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Criar produto
app.post('/api/produtos', (req, res) => {
    const { nome, descricao, categoria, estoque_minimo, quantidade } = req.body;
    const qtd = quantidade || 0;
    const min = estoque_minimo || 10;
    
    db.run(
        'INSERT INTO produtos (nome, descricao, categoria, quantidade, estoque_minimo) VALUES (?, ?, ?, ?, ?)',
        [nome, descricao, categoria, qtd, min],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, nome, descricao, categoria, quantidade: qtd, estoque_minimo: min });
        }
    );
});

// --- Rotas de Movimentações ---

// Listar movimentações
app.get('/api/movimentacoes', (req, res) => {
    const query = `
        SELECT m.id, m.tipo, m.quantidade, m.responsavel, m.doador, m.data, p.nome as produto_nome 
        FROM movimentacoes m 
        JOIN produtos p ON m.produto_id = p.id
        ORDER BY m.data DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Criar movimentação (Entrada/Saída)
app.post('/api/movimentacoes', (req, res) => {
    const { produto_id, tipo, quantidade, responsavel, doador } = req.body;

    if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido. Use ENTRADA ou SAIDA.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            'INSERT INTO movimentacoes (produto_id, tipo, quantidade, responsavel, doador) VALUES (?, ?, ?, ?, ?)',
            [produto_id, tipo, quantidade, responsavel || null, doador || null],
            function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                // Atualiza o estoque do produto
                const sinal = tipo === 'ENTRADA' ? '+' : '-';
                db.run(
                    `UPDATE produtos SET quantidade = quantidade ${sinal} ? WHERE id = ?`,
                    [quantidade, produto_id],
                    function (errUpdate) {
                        if (errUpdate) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: errUpdate.message });
                        }
                        db.run('COMMIT');
                        res.status(201).json({ message: 'Movimentação registrada com sucesso!' });
                    }
                );
            }
        );
    });
});

// --- Rotas de Dashboard ---
app.get('/api/dashboard', (req, res) => {
    const queries = {
        totalProdutos: new Promise((resolve, reject) => {
            db.get('SELECT SUM(quantidade) as total FROM produtos', [], (err, row) => {
                if (err) reject(err); else resolve(row.total || 0);
            });
        }),
        saidasRecentes: new Promise((resolve, reject) => {
            db.all(`
                SELECT m.quantidade, m.responsavel, p.nome 
                FROM movimentacoes m 
                JOIN produtos p ON m.produto_id = p.id 
                WHERE m.tipo = 'SAIDA' 
                ORDER BY m.data DESC LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        }),
        movimentacoes: new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    SUM(CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE 0 END) as entradas,
                    SUM(CASE WHEN tipo = 'SAIDA' THEN quantidade ELSE 0 END) as saidas
                FROM movimentacoes
            `, [], (err, row) => {
                if (err) reject(err); else resolve({
                    entradas: row.entradas || 0,
                    saidas: row.saidas || 0
                });
            });
        }),
        estoqueBaixo: new Promise((resolve, reject) => {
            db.all('SELECT nome, quantidade, estoque_minimo FROM produtos WHERE quantidade <= estoque_minimo LIMIT 10', [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        }),
        categorias: new Promise((resolve, reject) => {
            db.all('SELECT categoria, SUM(quantidade) as total FROM produtos GROUP BY categoria', [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        })
    };

    Promise.all([queries.totalProdutos, queries.saidasRecentes, queries.movimentacoes, queries.estoqueBaixo, queries.categorias])
        .then(([totalProdutos, saidasRecentes, movimentacoes, estoqueBaixo, categorias]) => {
            res.json({
                total_produtos_ativos: totalProdutos,
                saidas_recentes: saidasRecentes,
                movimentacoes,
                alertas_estoque: estoqueBaixo,
                categorias_chart: categorias
            });
        })
        .catch(err => res.status(500).json({ error: err.message }));
});

// --- Rota de IA (Google Gemini) ---
app.post('/api/chat', async (req, res) => {
    const { message, apiKey, chatHistory } = req.body;

    if (!apiKey) {
        return res.status(401).json({ error: 'Chave de API (Gemini) não fornecida.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Define a ferramenta (função) que a IA pode usar para registrar saídas/entradas
        const tool_registrarMovimentacao = {
            name: "registrar_movimentacao",
            description: "Registra a entrada ou saída de um produto no banco de dados. Use esta função sempre que o usuário pedir para registrar, dar baixa ou repor um produto.",
            parameters: {
                type: "object",
                properties: {
                    produto_id: { type: "number", description: "O ID numérico do produto." },
                    tipo: { type: "string", description: "O tipo de movimentação. Exatamente 'ENTRADA' ou 'SAIDA'." },
                    quantidade: { type: "number", description: "A quantidade sendo movimentada." },
                    responsavel: { type: "string", description: "O nome de quem retirou (se for SAIDA). Opcional." },
                    doador: { type: "string", description: "O nome de quem doou (se for ENTRADA). Opcional." }
                },
                required: ["produto_id", "tipo", "quantidade"]
            }
        };

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            tools: [{ functionDeclarations: [tool_registrarMovimentacao] }]
        });

        // Buscar dados do estoque para contextualizar a IA
        const estoque = await new Promise((resolve, reject) => {
            db.all('SELECT id, nome, categoria, quantidade, estoque_minimo FROM produtos', [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const systemInstruction = `Você é o assistente virtual inteligente de um Almoxarifado de Quermesse.
Aqui está o estoque atual: ${JSON.stringify(estoque)}.
Se o usuário perguntar sobre o estoque, use esses dados.
Se o usuário pedir para registrar uma movimentação, use a ferramenta registrar_movimentacao informando o produto_id correto baseado na lista de estoque.
Responda de forma clara, amigável e direta.`;

        // Prepara o histórico
        const contents = chatHistory ? chatHistory : [];
        if (contents.length === 0) {
           contents.push({ role: 'user', parts: [{ text: systemInstruction + "\\n\\n" + message }] });
        } else {
           contents.push({ role: 'user', parts: [{ text: message }] });
        }

        const result = await model.generateContent({ contents });
        const response = result.response;
        
        let aiText = response.text();
        let actionResult = null;

        // Verifica se a IA decidiu chamar a função
        const call = response.functionCalls ? response.functionCalls() : null;
        if (call && call.length > 0) {
            const func = call[0];
            if (func.name === 'registrar_movimentacao') {
                const { produto_id, tipo, quantidade, responsavel, doador } = func.args;
                
                // Executar no banco de dados local
                await new Promise((resolve, reject) => {
                    db.serialize(() => {
                        db.run('BEGIN TRANSACTION');
                        db.run(
                            'INSERT INTO movimentacoes (produto_id, tipo, quantidade, responsavel, doador) VALUES (?, ?, ?, ?, ?)',
                            [produto_id, tipo, quantidade, responsavel || null, doador || null],
                            function(err) {
                                if (err) { db.run('ROLLBACK'); return reject(err); }
                                const sinal = tipo === 'ENTRADA' ? '+' : '-';
                                db.run(`UPDATE produtos SET quantidade = quantidade ${sinal} ? WHERE id = ?`, [quantidade, produto_id], function(err2) {
                                    if (err2) { db.run('ROLLBACK'); return reject(err2); }
                                    db.run('COMMIT');
                                    resolve();
                                });
                            }
                        );
                    });
                });
                
                actionResult = {
                   type: 'function_call',
                   message: `Movimentação registrada com sucesso: ${tipo} de ${quantidade} unidades (Produto ID: ${produto_id})!`
                };
                aiText = "Acabei de registrar isso no sistema para você!";
            }
        }

        res.json({ text: aiText, action: actionResult });
        
    } catch (error) {
        console.error('Erro na IA:', error);
        res.status(500).json({ error: 'Erro ao comunicar com a IA. Verifique sua chave.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Node.js rodando na porta ${PORT}`);
});
