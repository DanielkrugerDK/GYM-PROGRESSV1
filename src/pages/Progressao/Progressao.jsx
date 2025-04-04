// src/pages/Progressao/Progressao.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Progressao.module.css';

const API_BASE_URL = 'http://localhost:3001/api';

function Progressao() {
    const { user } = useAuth();
    const [historico, setHistorico] = useState([]); // Guarda os dados brutos da API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exercicioSelecionadoId, setExercicioSelecionadoId] = useState(''); // Guarda o ID (string) do exercício selecionado

    // Função para buscar histórico
    const fetchHistorico = useCallback(async () => {
        // Usa user.id que vem do useAuth()
        if (!user?.id) { setHistorico([]); setExercicioSelecionadoId(''); setLoading(false); return; }
        console.log("[P] Buscando histórico user", user.id); setLoading(true); setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/history/user/${user.id}`);
            if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || `Falha fetch histórico (${response.status})`); }
            let historicoCarregado = await response.json();
            if (!Array.isArray(historicoCarregado)) { console.warn("[P] API não retornou array!"); historicoCarregado = []; }
            else {
                console.log("[P] Histórico API Recebido (Total:", historicoCarregado.length, ")");
                if (historicoCarregado.length > 0) { console.log("[P] Estrutura PRIMEIRO registro:", JSON.stringify(historicoCarregado[0])); }
                // Ordena antigo -> novo para uso interno e gráfico
                historicoCarregado.sort((a, b) => a.timestamp - b.timestamp);
                setHistorico(historicoCarregado); // Define o histórico completo

                // Define seleção inicial/padrão (usando exercise_id)
                 setExercicioSelecionadoId(prevId => {
                     // Verifica se o ID anterior ainda existe nos dados carregados
                     const idAindaValido = historicoCarregado.some(h => h && h.exercise_id === prevId);
                     if (prevId && idAindaValido) { return prevId; }
                     // Se não, pega o primeiro ID válido encontrado
                     const primeiroValido = historicoCarregado.find(h => h && typeof h.exercise_id === 'string' && h.exercise_id.trim() !== '');
                     return primeiroValido?.exercise_id || ''; // Retorna o ID ou vazio
                 });
            }
        } catch (err) { console.error("[P] ERRO API:", err); setError(err.message || 'Erro histórico.'); setHistorico([]); setExercicioSelecionadoId('');
        } finally { setLoading(false); console.log("[P] Busca finalizada."); }
    }, [user?.id]); // Depende apenas do user.id

    useEffect(() => { fetchHistorico(); }, [fetchHistorico]);

    // Funções de formatação
    const formatarDataGrafico = (timestamp) => !timestamp ? '' : new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const formatarDataTabela = (timestamp) => !timestamp ? 'Inválida' : new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // --- CORRIGIDO: Usa exercise_id e exercise_name ---
    const exerciciosUnicos = useMemo(() => {
        console.log("[P] Recalculando exerciciosUnicos...");
        const mapa = new Map();
        historico.forEach((reg) => {
            // *** USA exercise_id ***
            if (reg && typeof reg.exercise_id === 'string' && reg.exercise_id.trim() !== '') {
                if (!mapa.has(reg.exercise_id)) {
                    // *** USA exercise_name ***
                    const nomeExercicio = (typeof reg.exercise_name === 'string' && reg.exercise_name.trim() !== '')
                        ? reg.exercise_name
                        : `ID:${reg.exercise_id}`;
                    mapa.set(reg.exercise_id, { id: reg.exercise_id, nome: nomeExercicio });
                }
            } else {
                 console.warn(`[P] Registro ignorado para lista (exercise_id inválido):`, reg);
            }
        });
        const lista = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
        console.log("[P] exerciciosUnicos final:", lista);
        return lista;
    }, [historico]);

    // --- CORRIGIDO: Usa exercise_id, load_used, reps_performed ---
    const dadosGrafico = useMemo(() => {
        if (!exercicioSelecionadoId || historico.length === 0) return [];
        console.log(`[P] Recalculando dadosGrafico para ID: ${exercicioSelecionadoId}`);
        const dadosFiltrados = historico
            .filter(reg =>
                // *** USA exercise_id ***
                reg.exercise_id === exercicioSelecionadoId &&
                reg.timestamp && typeof reg.timestamp === 'number' &&
                // *** USA load_used e reps_performed ***
                typeof reg.load_used === 'number' && !isNaN(reg.load_used) &&
                typeof reg.reps_performed === 'number' && !isNaN(reg.reps_performed)
            )
            // Ordenação já feita no estado 'historico'
            .map(reg => ({
                data: formatarDataGrafico(reg.timestamp),
                timestamp: reg.timestamp,
                 // *** USA load_used e reps_performed ***
                Carga: reg.load_used,
                Reps: reg.reps_performed,
            }));
        if(historico.filter(reg => reg.exercise_id === exercicioSelecionadoId).length > 0 && dadosFiltrados.length === 0){ console.warn(`[P] Registros para ${exercicioSelecionadoId} filtrados para gráfico (dados inválidos).`); }
        console.log("[P] dadosGrafico calculados:", dadosFiltrados);
        return dadosFiltrados;
    }, [historico, exercicioSelecionadoId]);

    // Nome para título (usa exerciciosUnicos corrigido)
    const nomeExercicioSelecionado = exerciciosUnicos?.find(ex => ex.id === exercicioSelecionadoId)?.nome || '';

    // --- Renderização ---
    if (loading && historico.length === 0) { return <div className={styles.loading}>Carregando histórico...</div>; }

    return (
        <div className={styles.progressaoContainer}>
            <h1>Histórico e Progressão</h1>
            {error && <p className={styles.errorApi}>{error}</p>}

            {/* Seção de Gráficos */}
            <div className={styles.graficosContainer}>
                <h2>Gráfico de Progressão de Carga</h2>
                {loading && <p>Atualizando gráfico...</p>}
                {!loading && !error && historico.length > 0 && exerciciosUnicos.length > 0 ? (
                    <>
                        <div className={styles.seletorGrafico}>
                            <label htmlFor="exercicioGraficoSelect">Exercício:</label>
                            <select id="exercicioGraficoSelect" value={exercicioSelecionadoId} onChange={(e) => setExercicioSelecionadoId(e.target.value)} className={styles.exercicioSelect} >
                                <option value="" disabled={!!exercicioSelecionadoId}>-- Selecione --</option>
                                {exerciciosUnicos.map((ex) => ( <option key={ex.id} value={ex.id}>{ex.nome}</option> ))}
                            </select>
                        </div>
                        {exercicioSelecionadoId && dadosGrafico.length >= 2 ? ( <ResponsiveContainer width="100%" height={350}> <LineChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} > <CartesianGrid strokeDasharray="3 3" stroke="#555" /> <XAxis dataKey="data" stroke="#ccc" /> <YAxis stroke="#ccc" domain={['auto', 'auto']} label={{ value: 'Carga (Kg)', angle: -90, position: 'insideLeft', fill: '#ccc', dx: -5 }} /> <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }} labelStyle={{ color: '#eee', fontWeight: 'bold' }} itemStyle={{ color: '#8884d8' }} formatter={(value, name, props) => [`${value} Kg (${props.payload.Reps} reps)`, name]} labelFormatter={(label) => `Data: ${label}`} /> <Legend wrapperStyle={{ color: '#ccc' }} /> <Line type="monotone" dataKey="Carga" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} dot={{ strokeWidth: 1, r: 4 }} /> </LineChart> </ResponsiveContainer> ) : ( <p className={styles.avisoGrafico}> {!exercicioSelecionadoId ? 'Selecione um exercício.' : dadosGrafico.length === 0 ? `Nenhum registro válido para "${nomeExercicioSelecionado}".` : `Pelo menos 2 registros válidos de "${nomeExercicioSelecionado}" são necessários para o gráfico.` } </p> )}
                    </>
                 ) : ( !loading && !error && <p>Nenhum histórico encontrado para gerar gráficos.</p> )
                }
            </div>

            {/* Seção da Tabela */}
            <div className={styles.historicoList}>
                <h2>Últimas Séries Concluídas (Tabela)</h2>
                 {loading && <p>Atualizando tabela...</p>}
                 {!loading && error && <p className={styles.errorApi}>Erro ao carregar tabela.</p>}
                 {!loading && !error && historico.length === 0 && (<p>Nenhum registro encontrado.</p>)}
                 {!loading && !error && historico.length > 0 && (
                    <table>
                      <thead><tr><th>Data</th><th>Treino</th><th>Exercício</th><th>Reps</th><th>Carga (Kg)</th></tr></thead>
                      <tbody>
                        {/* Ordena mais recente primeiro para tabela */}
                        {[...historico].sort((a, b) => b.timestamp - a.timestamp).map((registro, index) => (
                          // *** CORRIGIDO: Usa os nomes de campo com underscore vindos da API ***
                          <tr key={registro.id || registro.series_instance_id || `hist-${index}`}>
                            <td data-label="Data:">{formatarDataTabela(registro.timestamp)}</td>
                            <td data-label="Treino:">{registro.workout_name || '-'}</td>
                            {/* Usa exercise_name se existir, senão tenta achar nome em exerciciosUnicos pelo exercise_id */}
                            <td data-label="Exercício:">{registro.exercise_name || exerciciosUnicos?.find(ex => ex.id === registro.exercise_id)?.nome || (registro.exercise_id ? `ID:${registro.exercise_id}`: '-') }</td>
                            <td data-label="Reps:">{!isNaN(parseFloat(registro.reps_performed)) ? registro.reps_performed : '?'}</td>
                            <td data-label="Carga (Kg):">{!isNaN(parseFloat(registro.load_used)) ? `${registro.load_used} Kg` : '?'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
export default Progressao;