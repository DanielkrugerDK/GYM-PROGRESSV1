// backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./database');

// Importa as rotas
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const workoutRoutes = require('./routes/workouts');
const historyRoutes = require('./routes/history'); // NOVO

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend Gym Progress Hub está funcionando! 💪' });
});

// Monta as rotas com seus prefixos
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/history', historyRoutes); // NOVO

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend server rodando na porta ${PORT}`);
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      if (err) { console.error("Erro check DB:", err.message); }
      else { console.log("Conexão SQLite OK."); }
  });
});