// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../database'); // Importa a conexão com o banco

// Rota POST para Registrar Novo Usuário: /api/auth/register
router.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Validação básica de entrada
  if (!username || !password) {
    return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  }
  if (password.length < 4) { // Exemplo de validação mínima
    return res.status(400).json({ error: 'A senha deve ter pelo menos 4 caracteres.' });
  }

  // Verifica se o username já existe
  const checkSql = "SELECT id FROM users WHERE username = ?";
  db.get(checkSql, [username], (err, row) => {
    if (err) {
      console.error("Erro ao verificar usuário:", err.message);
      return res.status(500).json({ error: 'Erro interno do servidor ao verificar usuário.' });
    }
    if (row) {
      // Usuário já existe
      return res.status(409).json({ error: 'Nome de usuário já está em uso.' }); // 409 Conflict
    }

    // Se não existe, insere o novo usuário
    // !!! IMPORTANTE: Armazenando senha em texto puro - NÃO FAÇA ISSO EM PRODUÇÃO !!!
    // Em produção, use bcrypt para gerar um hash da senha antes de inserir.
    // Ex (com bcrypt): const hashedPassword = await bcrypt.hash(password, 10);
    //                  db.run(insertSql, [username, hashedPassword], function(err) { ... });
    const insertSql = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.run(insertSql, [username, password], function(err) { // Usar function() para ter acesso ao 'this.lastID'
      if (err) {
        console.error("Erro ao registrar usuário:", err.message);
        return res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
      }
      // Sucesso
      console.log(`Usuário '${username}' registrado com ID: ${this.lastID}`);
      // Retorna o usuário criado (sem a senha)
      res.status(201).json({ // 201 Created
        message: 'Usuário registrado com sucesso!',
        user: {
          id: this.lastID,
          username: username
        }
      });
    });
  });
});

// Rota POST para Login de Usuário: /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.get(sql, [username], (err, user) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err.message);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
    if (!user) {
      // Usuário não encontrado
      console.log(`Tentativa de login falhou: Usuário '${username}' não encontrado.`);
      return res.status(401).json({ error: 'Credenciais inválidas.' }); // 401 Unauthorized
    }

    // !!! IMPORTANTE: Comparando senha em texto puro !!!
    // Em produção, use bcrypt.compare para verificar a senha com o hash armazenado.
    // Ex (com bcrypt): const match = await bcrypt.compare(password, user.password);
    //                  if (match) { ... } else { ... }
    if (password === user.password) {
      // Senha correta
      console.log(`Usuário '${username}' logado com sucesso.`);
      // Em um app real, você geraria um Token JWT aqui e o enviaria de volta
      // Por agora, retornamos os dados do usuário (sem a senha)
      res.status(200).json({
        message: 'Login bem-sucedido!',
        user: {
          id: user.id,
          username: user.username
          // Não envie a senha de volta!
        }
        // token: 'SEU_TOKEN_JWT_AQUI' // Futuramente
      });
    } else {
      // Senha incorreta
      console.log(`Tentativa de login falhou: Senha incorreta para usuário '${username}'.`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
  });
});

module.exports = router; // Exporta o router para ser usado no server.js