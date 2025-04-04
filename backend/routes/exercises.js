// backend/routes/exercises.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/exercises - Buscar todos os exercícios
router.get('/', (req, res) => {
    const sql = "SELECT * FROM exercises ORDER BY name ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar exercícios:", err.message);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        res.status(200).json(rows); // Retorna a lista de exercícios
    });
});

// POST /api/exercises - Adicionar novo exercício
router.post('/', (req, res) => {
    const { id, name, muscleGroup } = req.body;

    if (!id || !name) {
        return res.status(400).json({ error: 'ID e Nome do exercício são obrigatórios.' });
    }

    // Verifica se ID já existe (só para garantir, embora o frontend deva gerar único)
    db.get("SELECT id FROM exercises WHERE id = ?", [id], (err, row) => {
         if (err) { console.error("Erro check ID exercício:", err.message); return res.status(500).json({ error: 'Erro interno.' }); }
         if (row) { return res.status(409).json({ error: 'ID de exercício já existe.' }); }

         // Insere o novo exercício
         const insertSql = "INSERT INTO exercises (id, name, muscleGroup) VALUES (?, ?, ?)";
         db.run(insertSql, [id, name, muscleGroup || null], function (err) {
             if (err) {
                 console.error("Erro ao inserir exercício:", err.message);
                 return res.status(500).json({ error: 'Erro ao salvar exercício.' });
             }
             console.log(`Exercício '${name}' adicionado com ID: ${id}`);
             // Retorna o exercício adicionado
             res.status(201).json({ id, name, muscleGroup: muscleGroup || null });
         });
    });
});

// DELETE /api/exercises/:id - Remover exercício
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM exercises WHERE id = ?";
    db.run(sql, [id], function (err) { // Usa function() para ter this.changes
        if (err) {
            console.error("Erro ao deletar exercício:", err.message);
            return res.status(500).json({ error: 'Erro ao deletar exercício.' });
        }
        if (this.changes === 0) {
            // Nenhum exercício foi deletado (ID não encontrado)
             return res.status(404).json({ error: 'Exercício não encontrado.' });
        }
        console.log(`Exercício com ID: ${id} deletado.`);
        res.status(200).json({ message: 'Exercício deletado com sucesso.' }); // Ou 204 No Content
    });
});

// Poderíamos adicionar PUT /api/exercises/:id para editar exercícios depois

module.exports = router;