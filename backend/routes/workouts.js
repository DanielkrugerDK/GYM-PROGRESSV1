// backend/routes/workouts.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/workouts/user/:userId - Buscar treinos de um usuário específico
router.get('/user/:userId', (req, res) => {
    // !!! INSEGURO: Recebendo userId diretamente pela URL !!!
    // Em produção, obter o userId do token de autenticação (ex: req.user.id)
    const { userId } = req.params;

    if (!userId) {
         return res.status(400).json({ error: 'ID do usuário é necessário.' });
    }

    const sql = "SELECT * FROM workouts WHERE user_id = ? ORDER BY createdAt DESC";

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error(`Erro ao buscar treinos para usuário ${userId}:`, err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar treinos.' });
        }

        // Parseia o JSON de exercícios antes de enviar
        const workouts = rows.map(w => {
            try {
                return {
                    ...w,
                    exercises: JSON.parse(w.exercises_json || '[]') // Trata null/undefined
                };
            } catch (parseError) {
                console.error(`Erro ao parsear JSON para treino ID ${w.id}:`, parseError);
                return { ...w, exercises: [], errorParsing: true }; // Retorna com erro indicado
            }
        });

        res.status(200).json(workouts);
    });
});

// POST /api/workouts - Criar novo treino montado para um usuário
router.post('/', (req, res) => {
    // !!! INSEGURO: Recebendo userId diretamente do corpo !!!
    const { id, name, exercises, userId } = req.body;

    if (!id || !name || !Array.isArray(exercises) || !userId) {
        return res.status(400).json({ error: 'Dados incompletos para criar treino (ID, Nome, Exercícios, UserID).' });
    }

    const exercisesJson = JSON.stringify(exercises); // Converte array de exercícios para JSON string

    const insertSql = "INSERT INTO workouts (id, user_id, name, exercises_json) VALUES (?, ?, ?, ?)";

    db.run(insertSql, [id, userId, name, exercisesJson], function(err) {
        if (err) {
            console.error(`Erro ao salvar treino para usuário ${userId}:`, err.message);
            // Verifica erro de chave estrangeira (usuário pode não existir)
            if (err.message.includes('FOREIGN KEY constraint failed')) {
                return res.status(400).json({ error: 'Usuário inválido.' });
            }
            return res.status(500).json({ error: 'Erro interno ao salvar treino.' });
        }
        console.log(`Treino '${name}' (ID: ${id}) salvo para usuário ${userId}`);
        res.status(201).json({ id, userId, name, exercises }); // Retorna o treino criado
    });
});

// DELETE /api/workouts/:id/user/:userId - Deletar um treino específico de um usuário
router.delete('/:id/user/:userId', (req, res) => {
    // !!! INSEGURO: Recebendo userId diretamente pela URL !!!
    const { id, userId } = req.params;

    if (!id || !userId) {
        return res.status(400).json({ error: 'ID do treino e ID do usuário são necessários.' });
    }

    // Garante que o usuário só pode deletar o seu próprio treino
    const sql = "DELETE FROM workouts WHERE id = ? AND user_id = ?";

    db.run(sql, [id, userId], function (err) {
        if (err) {
            console.error(`Erro ao deletar treino ${id} para usuário ${userId}:`, err.message);
            return res.status(500).json({ error: 'Erro interno ao deletar treino.' });
        }
        if (this.changes === 0) {
             // Ou o treino não existe ou não pertence a este usuário
             return res.status(404).json({ error: 'Treino não encontrado ou não autorizado.' });
        }
        console.log(`Treino ID ${id} deletado para usuário ${userId}`);
        res.status(200).json({ message: 'Treino deletado com sucesso.' });
    });
});

module.exports = router;