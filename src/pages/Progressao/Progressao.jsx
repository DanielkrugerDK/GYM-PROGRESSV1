// src/pages/Progressao/Progressao.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion'; // Importa motion
import { useAuth } from '../../contexts/AuthContext';
import styles from './Progressao.module.css'; // Usaremos este CSS (precisa ter estilos do filtro)

const API_BASE_URL = 'http://localhost:3001/api';

// Variantes de animação da página (igual ao CadastroExercicios)
const pageVariants = {
  initial: { opacity: 0, x: "-5vw" },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: "5vw" }
};
const pageTransition = {
  type: "tween", ease: "anticipate", duration: 0.4
};

function Progressao() {
    const { user } = useAuth();
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exercicioSelecionadoId, setExercicioSelecionadoId] = useState('');
    // Estado para filtro da tabela (Passo 21)
    const [filtroTabela, setFiltroTabela] = useState('');

    // Função para buscar histórico (Mantida - usa snake_case internamente)
    const fetchHistorico = useCallback(async () => {
        if (!user?.id) { setHistorico([]); setExercicioSelecionadoId(''); setLoading(false); return; }
        setLoading(true); setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/history/user/${user.id}`);
            if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || `Falha fetch histórico (${response.status})`); }
            let historicoCarregado = await response.json();
            if (!Array.isArray(historicoCarregado)) { historicoCarregado = []; }
            else {
                if (historicoCarregado.length > 0) { console.log("[P] Estrutura PRIMEIRO registro:", JSON.stringify(historicoCarregado[0])); }
                historicoCarregado.sort((a, b) => a.timestamp - b.timestamp); // Ordena antigo -> novo
            }
            setHistorico(historicoCarregado);
             // Define seleção inicial (só se não tiver uma válida)
             setExercicioSelecionadoId(prevId => {
                 const primeiroValido = historicoCarregado.find(h => h && typeof h.exercise_id === 'string' && h.exercise_id.trim() !== '');
                 return (prevId && historicoCarregado.some(h => h && h.exercise_id === prevId)) ? prevId : (primeiroValido?.exercise_id || '');
             });
        } catch (err) { console.error("[P] ERRO API:", err); setError(err.message || 'Erro histórico.'); setHistorico([]); setExercicioSelecionadoId('');
        } finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { fetchHistorico(); }, [fetchHistorico]);

    // Funções de formatação (Mantidas)
    const formatarDataGrafico = (timestamp) => !timestamp ? '' : new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const formatarDataTabela = (timestamp) => !timestamp ? 'Inválida' : new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Memoização de exercícios únicos (Usa snake_case)
    const exerciciosUnicos = useMemo(() => {
        const mapa = new Map();
        historico.forEach((reg) => {
            if (reg && typeof reg.exercise_id === 'string' && reg.exercise_id.trim() !== '') {
                if (!mapa.has(reg.exercise_id)) {
                    const nomeExercicio = (typeof reg.exercise_name === 'string' && reg.exercise_name.trim() !== '') ? reg.exercise_name : `ID:${reg.exercise_id}`;
                    mapa.set(reg.exercise_id, { id: reg.exercise_id, nome: nomeExercicio });
                }
            }
        });
        return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [historico]);

    // Memoização dos dados do gráfico (Usa snake_case)
    const dadosGrafico = useMemo(() => {
        if (!exercicioSelecionadoId || historico.length === 0) return [];
        return historico
            .filter(reg => reg.exercise_id === exercicioSelecionadoId && reg.timestamp && typeof reg.load_used === 'number' && typeof reg.reps_performed === 'number')
            .map(reg => ({ data: formatarDataGrafico(reg.timestamp), timestamp: reg.timestamp, Carga: reg.load_used, Reps: reg.reps_performed, }));
    }, [historico, exercicioSelecionadoId]);

    // Memoiza o histórico filtrado para a tabela (Passo 21)
    const historicoFiltradoTabela = useMemo(() => {
        if (!filtroTabela) return historico; // Usa o histórico completo (já ordenado cronologicamente)
        const termoFiltroLower = filtroTabela.toLowerCase();
        return historico.filter(reg =>
            // Usa snake_case para filtrar
            (reg.exercise_name && reg.exercise_name.toLowerCase().includes(termoFiltroLower)) ||
            (reg.workout_name && reg.workout_name.toLowerCase().includes(termoFiltroLower)) ||
            formatarDataTabela(reg.timestamp).includes(termoFiltroLower)
        );
    }, [historico, filtroTabela]); // Recalcula se histórico ou filtro da tabela mudar

    const nomeExercicioSelecionado = exerciciosUnicos?.find(ex => ex.id === exercicioSelecionadoId)?.nome || '';

    // --- Renderização ---
    if (loading && historico.length === 0) { return <div className={styles.loading}>Carregando histórico...</div>; }

    return (
        // Aplica animação de página (Passo 22)
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={styles.progressaoContainer}
        >
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
                        {exercicioSelecionadoId && dadosGrafico.length >= 2 ? ( <ResponsiveContainer width="100%" height={350}> <LineChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} > <CartesianGrid strokeDasharray="3 3" stroke="#555" /> <XAxis dataKey="data" stroke="#ccc" /> <YAxis stroke="#ccc" domain={['auto', 'auto']} label={{ value: 'Carga (Kg)', angle: -90, position: 'insideLeft', fill: '#ccc', dx: -5 }} /> <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }} labelStyle={{ color: '#eee', fontWeight: 'bold' }} itemStyle={{ color: '#8884d8' }} formatter={(value, name, props) => [`${value} Kg (${props.payload.Reps} reps)`, name]} labelFormatter={(label) => `Data: ${label}`} /> <Legend wrapperStyle={{ color: '#ccc' }} /> <Line type="monotone" dataKey="Carga" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} dot={{ strokeWidth: 1, r: 4 }} /> </LineChart> </ResponsiveContainer> ) : ( <p className={styles.avisoGrafico}> {!exercicioSelecionadoId ? 'Selecione um exercício.' : dadosGrafico.length === 0 ? `Nenhum registro válido para "${nomeExercicioSelecionado}".` : `Pelo menos 2 registros válidos de "${nomeExercicioSelecionado}" são necessários.` } </p> )}
                    </>
                 ) : ( !loading && !error && <p>Nenhum histórico encontrado para gerar gráficos.</p> )
                }
            </div>

            {/* Seção da Tabela */}
            <div className={styles.historicoList}>
                <h2>Últimas Séries Concluídas (Tabela)</h2>

                {/* Input de Filtro da Tabela (Passo 21) */}
                {!loading && !error && historico.length > 0 && (
                    <div className={styles.filtroInputContainer}>
                         <input
                            type="text"
                            placeholder="Filtrar por exercício, treino ou data..."
                            value={filtroTabela}
                            onChange={(e) => setFiltroTabela(e.target.value)}
                            className={styles.filtroInput} // Reutiliza estilo
                        />
                    </div>
                )}

                 {loading && <p>Atualizando tabela...</p>}
                 {!loading && error && <p className={styles.errorApi}>Erro ao carregar tabela.</p>}
                 {!loading && !error && historico.length === 0 && (<p>Nenhum registro encontrado.</p>)}
                 {/* Mensagem se filtro não encontrar nada */}
                 {!loading && !error && historico.length > 0 && historicoFiltradoTabela.length === 0 && (<p>Nenhum registro encontrado com este filtro.</p>)}

                 {/* Tabela renderiza a lista FILTRADA */}
                 {!loading && !error && historicoFiltradoTabela.length > 0 && (
                    <table>
                      <thead><tr><th>Data</th><th>Treino</th><th>Exercício</th><th>Reps</th><th>Carga (Kg)</th></tr></thead>
                      <tbody>
                        {/* Ordena o array filtrado para exibição (mais recente primeiro) */}
                        {[...historicoFiltradoTabela].sort((a, b) => b.timestamp - a.timestamp).map((registro, index) => (
                          // Usa snake_case para acessar os dados
                          <tr key={registro.id || registro.series_instance_id || `hist-${index}`}>
                            <td data-label="Data:">{formatarDataTabela(registro.timestamp)}</td>
                            <td data-label="Treino:">{registro.workout_name || '-'}</td>
                            <td data-label="Exercício:">{registro.exercise_name || exerciciosUnicos?.find(ex => ex.id === registro.exercise_id)?.nome || (registro.exercise_id ? `ID:${registro.exercise_id}`: '-') }</td>
                            <td data-label="Reps:">{!isNaN(parseFloat(registro.reps_performed)) ? registro.reps_performed : '?'}</td>
                            <td data-label="Carga (Kg):">{!isNaN(parseFloat(registro.load_used)) ? `${registro.load_used} Kg` : '?'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                )}
                {/* Contagem do filtro */}
                {!loading && !error && historico.length > 0 && filtroTabela && (
                    <p className={styles.contagemFiltro}>Mostrando {historicoFiltradoTabela.length} de {historico.length} registros.</p>
                )}
            </div>
        </motion.div> // Fecha o motion.div principal
    );
}
export default Progressao;