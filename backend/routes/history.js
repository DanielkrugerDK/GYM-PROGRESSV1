// backend/routes/history.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// POST /api/history - Adicionar um novo registro de série concluída
router.post('/', (req, res) => {
    // !!! INSEGURO: Confiar nos dados enviados pelo cliente, incluindo userId !!!
    const {
        userId,
        timestamp,
        workoutId,
        workoutName,
        exerciseId,
        exerciseName,
        seriesInstanceId, // ID único da instância da série
        repsPerformed,
        loadUsed
    } = req.body;

    // Validação básica
    if (
        !userId ||
        !timestamp ||
        !exerciseId ||
        !seriesInstanceId ||
        typeof repsPerformed === 'undefined' || // Permite 0 reps? Ajustar se necessário
        typeof loadUsed === 'undefined' // Permite 0 carga? Ajustar se necessário
    ) {
        return res.status(400).json({ error: 'Dados incompletos para registrar histórico (userId, timestamp, exerciseId, seriesInstanceId, reps, load).' });
    }

    // Verifica se a instância da série já foi registrada (previne duplicados exatos)
    const checkSql = "SELECT id FROM series_history WHERE series_instance_id = ?";
    db.get(checkSql, [seriesInstanceId], (err, row) => {
        if (err) {
            console.error("Erro ao verificar histórico existente:", err.message);
            return res.status(500).json({ error: 'Erro interno ao verificar histórico.' });
        }
        if (row) {
            // Registro já existe, pode ser um clique duplo ou re-submit
            console.warn(`Tentativa de inserir registro duplicado para series_instance_id: ${seriesInstanceId}`);
            // Pode retornar 200 OK ou 409 Conflict, dependendo da semântica desejada
            return res.status(200).json({ message: 'Registro já existe.', existingId: row.id });
        }

        // Insere o novo registro
        const insertSql = `
            INSERT INTO series_history (
                user_id, timestamp, workout_id, workout_name, exercise_id,
                exercise_name, series_instance_id, reps_performed, load_used
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            userId, timestamp, workoutId || null, workoutName || null, exerciseId,
            exerciseName || null, seriesInstanceId, repsPerformed, loadUsed
        ];

        db.run(insertSql, params, function (err) {
            if (err) {
                console.error(`Erro ao inserir histórico para usuário ${userId}:`, err.message);
                 if (err.message.includes('FOREIGN KEY constraint failed')) {
                    // Provavelmente userId inválido
                    return res.status(400).json({ error: 'Usuário inválido.' });
                }
                return res.status(500).json({ error: 'Erro interno ao salvar histórico.' });
            }
            console.log(`Registro de histórico (ID: ${this.lastID}) salvo para usuário ${userId}, série ${seriesInstanceId}`);
            // Retorna o registro criado (opcional)
            res.status(201).json({
                id: this.lastID,
                userId, timestamp, workoutId, workoutName, exerciseId, exerciseName,
                seriesInstanceId, repsPerformed, loadUsed
            });
        });
    });
});


// GET /api/history/user/:userId - Buscar histórico de um usuário específico
router.get('/user/:userId', (req, res) => {
    // !!! INSEGURO: Recebendo userId diretamente pela URL !!!
    const { userId } = req.params;

    if (!userId) {
         return res.status(400).json({ error: 'ID do usuário é necessário.' });
    }

    // Ordena por timestamp (mais recente primeiro ou mais antigo?)
    // Para exibição em tabela geralmente é mais recente primeiro.
    // Para gráficos, mais antigo primeiro. Vamos buscar mais recente primeiro.
    const sql = "SELECT * FROM series_history WHERE user_id = ? ORDER BY timestamp DESC";

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error(`Erro ao buscar histórico para usuário ${userId}:`, err.message);
            return res.status(500).json({ error: 'Erro interno ao buscar histórico.' });
        }
        res.status(200).json(rows); // Retorna a lista de registros
    });
});


// DELETE /api/history/:id/user/:userId - Deletar um registro específico (opcional)
router.delete('/:id/user/:userId', (req, res) => {
    // !!! INSEGURO: Recebendo userId diretamente pela URL !!!
    const { id, userId } = req.params; // id aqui é o ID da tabela series_history

    if (!id || !userId) {
        return res.status(400).json({ error: 'ID do registro e ID do usuário são necessários.' });
    }

    const sql = "DELETE FROM series_history WHERE id = ? AND user_id = ?";

    db.run(sql, [id, userId], function (err) {
        if (err) {
            console.error(`Erro ao deletar histórico ${id} para usuário ${userId}:`, err.message);
            return res.status(500).json({ error: 'Erro interno ao deletar registro.' });
        }
        if (this.changes === 0) {
             return res.status(404).json({ error: 'Registro não encontrado ou não autorizado.' });
        }
        console.log(`Registro de histórico ID ${id} deletado para usuário ${userId}`);
        res.status(200).json({ message: 'Registro deletado com sucesso.' });
    });
});


module.exports = router;