// backend/database.js
const sqlite3 = require('sqlite3').verbose(); // verbose() para mensagens de erro mais detalhadas

// Nome do arquivo do banco de dados
const DB_SOURCE = "gym_progress.db";

// Conecta ao banco de dados (ou cria o arquivo se não existir)
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      // Não pode abrir banco
      console.error("Erro ao conectar/criar banco de dados:", err.message);
      throw err; // Lança erro para parar a aplicação se o DB não puder ser aberto
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // Usa serialize para garantir que os comandos rodem em ordem
        db.serialize(() => {
            // --- Criação das Tabelas ---
            // (Usamos 'IF NOT EXISTS' para não dar erro se já existirem)

            // Tabela de Usuários
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL, -- Em um app real, NUNCA guarde senha em texto puro! Use hash.
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error("Erro ao criar tabela users:", err.message);
                else console.log("Tabela 'users' verificada/criada.");
            });

            // Tabela de Exercícios (Globais ou por usuário? Vamos começar global)
            // Se fosse por usuário, adicionaria uma coluna user_id FOREIGN KEY
            db.run(`CREATE TABLE IF NOT EXISTS exercises (
                id TEXT PRIMARY KEY, -- Usaremos o ID gerado no frontend/backend
                name TEXT NOT NULL,
                muscleGroup TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                -- user_id INTEGER,
                -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) console.error("Erro ao criar tabela exercises:", err.message);
                else console.log("Tabela 'exercises' verificada/criada.");
            });

            // Tabela de Treinos Montados (Vinculada a um usuário)
            db.run(`CREATE TABLE IF NOT EXISTS workouts (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                exercises_json TEXT NOT NULL, -- Armazena a estrutura dos exercícios do treino como JSON
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) console.error("Erro ao criar tabela workouts:", err.message);
                else console.log("Tabela 'workouts' verificada/criada.");
            });

            // Tabela de Histórico de Séries (Vinculada a um usuário e exercício)
            db.run(`CREATE TABLE IF NOT EXISTS series_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                timestamp INTEGER NOT NULL, -- Unix timestamp (ms)
                workout_id TEXT, -- ID do treino montado (opcional, mas útil)
                workout_name TEXT,
                exercise_id TEXT NOT NULL, -- ID do exercício base
                exercise_name TEXT,
                series_instance_id TEXT UNIQUE, -- ID único da instância da série no treino executado
                reps_performed INTEGER NOT NULL,
                load_used REAL NOT NULL, -- Usar REAL para permitir decimais
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                -- Poderia adicionar FOREIGN KEY para exercise_id se quisesse garantir integridade
            )`, (err) => {
                if (err) console.error("Erro ao criar tabela series_history:", err.message);
                else console.log("Tabela 'series_history' verificada/criada.");
            });
        });
    }
});

// Exporta a instância do banco de dados para ser usada em outros módulos
module.exports = db;