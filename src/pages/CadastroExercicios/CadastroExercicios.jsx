// src/pages/CadastroExercicios/CadastroExercicios.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Adicionado useMemo
import { useAuth } from '../../contexts/AuthContext';
import styles from './CadastroExercicios.module.css';

const API_BASE_URL = 'http://localhost:3001/api';

function CadastroExercicios() {
    const { user } = useAuth();
    const [exercicios, setExercicios] = useState([]);
    const [treinosMontados, setTreinosMontados] = useState([]);
    const [novoExercicioNome, setNovoExercicioNome] = useState('');
    const [novoExercicioGrupo, setNovoExercicioGrupo] = useState('');
    const [nomeNovoTreino, setNomeNovoTreino] = useState('');
    const [exerciciosNovoTreino, setExerciciosNovoTreino] = useState([]);
    const [loadingExercicios, setLoadingExercicios] = useState(false);
    const [loadingTreinos, setLoadingTreinos] = useState(false);
    const [errorExercicios, setErrorExercicios] = useState('');
    const [errorTreinos, setErrorTreinos] = useState('');
    const [savingTreino, setSavingTreino] = useState(false);
    // Estado para o filtro de exercícios disponíveis
    const [filtroExercicio, setFiltroExercicio] = useState('');

    // Busca todos os exercícios (globais)
    const fetchExercicios = useCallback(async () => {
        setLoadingExercicios(true); setErrorExercicios('');
        try {
            const response = await fetch(`${API_BASE_URL}/exercises`);
            if (!response.ok) throw new Error('Falha ao buscar exercícios.');
            const data = await response.json();
            setExercicios(data);
        } catch (error) { console.error("Erro buscando exercícios:", error); setErrorExercicios(error.message || 'Não foi possível carregar os exercícios.');
        } finally { setLoadingExercicios(false); }
    }, []);

    // Busca os treinos montados DO USUÁRIO LOGADO
    const fetchTreinosMontados = useCallback(async () => {
        if (!user?.id) return; setLoadingTreinos(true); setErrorTreinos('');
        try {
            const response = await fetch(`${API_BASE_URL}/workouts/user/${user.id}`);
            if (!response.ok) throw new Error('Falha ao buscar treinos.');
            const data = await response.json();
            setTreinosMontados(data);
        } catch (error) { console.error("Erro buscando treinos:", error); setErrorTreinos(error.message || 'Não foi possível carregar treinos.');
        } finally { setLoadingTreinos(false); }
    }, [user?.id]);

    // Efeitos para Carregamento Inicial
    useEffect(() => { fetchExercicios(); }, [fetchExercicios]);
    useEffect(() => { if (user?.id) fetchTreinosMontados(); else setTreinosMontados([]); }, [user?.id, fetchTreinosMontados]);

    // Adicionar Exercício via API
    const handleAdicionarExercicio = async (event) => {
        event.preventDefault(); if (!novoExercicioNome.trim()) { alert('Digite o nome.'); return; }
        const novoExercicio = { id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name: novoExercicioNome.trim(), muscleGroup: novoExercicioGrupo.trim() || null };
        setErrorExercicios('');
        try {
            const response = await fetch(`${API_BASE_URL}/exercises`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoExercicio) });
            const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Erro API.');
            setExercicios(prev => [...prev, data]); // Adiciona retornado
            setNovoExercicioNome(''); setNovoExercicioGrupo(''); console.log('Add Exercício API OK:', data);
        } catch (error) { console.error("Erro add exercício:", error); setErrorExercicios(error.message); }
    };

    // Remover Exercício via API
    const handleRemoverExercicio = async (idParaRemover) => {
        if (!window.confirm("Remover exercício da base?")) return; setErrorExercicios('');
        try {
            const response = await fetch(`${API_BASE_URL}/exercises/${idParaRemover}`, { method: 'DELETE' });
            const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Erro API.');
            setExercicios(prev => prev.filter(ex => ex.id !== idParaRemover));
            setExerciciosNovoTreino(prev => prev.filter(ex => ex.idExercicio !== idParaRemover));
            console.log('Del Exercício API OK:', idParaRemover);
        } catch(error) { console.error("Erro del exercício:", error); setErrorExercicios(error.message); }
    };

    // Salvar Novo Treino Montado via API
    const handleSalvarNovoTreino = async () => {
        if (!user?.id) { alert("Usuário não logado."); return; }
        if (!nomeNovoTreino.trim()) { alert("Nome do treino?"); return; }
        if (exerciciosNovoTreino.length === 0) { alert("Adicione exercícios."); return; }
        const repInvalida = exerciciosNovoTreino.some(ex => ex.series.some(s => !s.reps || isNaN(parseInt(s.reps)) || parseInt(s.reps) <= 0));
        if (repInvalida) { alert("Preencha reps válidas."); return; }
        const novoTreinoParaSalvar = { id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId: user.id, name: nomeNovoTreino.trim(), exercises: exerciciosNovoTreino.map(ex => ({ idExercicio: ex.idExercicio, nome: ex.nomeExercicio, series: ex.series.map(s => ({ reps: parseInt(s.reps) })), anotacoes: ex.anotacoes || undefined })) };
        setSavingTreino(true); setErrorTreinos('');
        try {
            const response = await fetch(`${API_BASE_URL}/workouts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoTreinoParaSalvar) });
            const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Erro API.');
            setTreinosMontados(prev => [...prev, data]); // Adiciona retornado
            setNomeNovoTreino(''); setExerciciosNovoTreino([]);
            console.log("Save Treino API OK:", data); alert("Treino salvo!");
        } catch (error) { console.error("Erro save treino:", error); setErrorTreinos(error.message);
        } finally { setSavingTreino(false); }
    };

    // Remover Treino Montado via API
    const handleRemoverTreinoMontado = async (idParaRemover) => {
        if (!user?.id) { alert("Usuário não logado."); return; }
        if (!window.confirm("Remover treino montado?")) return; setErrorTreinos('');
        try {
            const response = await fetch(`${API_BASE_URL}/workouts/${idParaRemover}/user/${user.id}`, { method: 'DELETE' });
            const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Erro API.');
            setTreinosMontados(prev => prev.filter(t => t.id !== idParaRemover));
            console.log('Del Treino API OK:', idParaRemover);
        } catch (error) { console.error("Erro del treino:", error); setErrorTreinos(error.message); }
    };

    // Funções Auxiliares Montagem
    const handleAdicionarExercicioAoNovoTreino = (exercicioParaAdicionar) => {
        if (exerciciosNovoTreino.some(ex => ex.idExercicio === exercicioParaAdicionar.id)) return;
        // Usa 'name' vindo da API (ou do mock consistente)
        setExerciciosNovoTreino(prev => [...prev, { idExercicio: exercicioParaAdicionar.id, nomeExercicio: exercicioParaAdicionar.name, series: [{ id: `s-${Date.now()}`, reps: '' }], anotacoes: '' }]);
    };
    const handleRemoverExercicioDoNovoTreino = (idExercicioParaRemover) => { setExerciciosNovoTreino(prev => prev.filter(ex => ex.idExercicio !== idExercicioParaRemover)); };
    const handleAdicionarSerieAoExercicio = (idExercicio) => { setExerciciosNovoTreino(prev => prev.map(ex => ex.idExercicio === idExercicio ? { ...ex, series: [...ex.series, { id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, reps: '' }] } : ex)); };
    const handleRemoverSerieDoExercicio = (idExercicio) => { setExerciciosNovoTreino(prev => prev.map(ex => ex.idExercicio === idExercicio && ex.series.length > 1 ? { ...ex, series: ex.series.slice(0, -1) } : ex).filter(ex => ex.series.length > 0)); }; // Não filtra mais exercícios sem séries aqui, pode ser feito ao salvar se necessário
    const handleRepeticoesChange = (idExercicio, idSerie, valor) => { setExerciciosNovoTreino(prev => prev.map(ex => ex.idExercicio === idExercicio ? { ...ex, series: ex.series.map(s => s.id === idSerie ? { ...s, reps: valor } : s) } : ex)); };
    const handleAnotacoesChange = (idExercicio, valor) => { setExerciciosNovoTreino(prev => prev.map(ex => ex.idExercicio === idExercicio ? { ...ex, anotacoes: valor } : ex)); };

    // Memoiza a lista de exercícios filtrados
    const exerciciosFiltrados = useMemo(() => {
        if (!filtroExercicio) return exercicios;
        const termoFiltroLower = filtroExercicio.toLowerCase();
        return exercicios.filter(ex =>
            ex.name.toLowerCase().includes(termoFiltroLower) ||
            (ex.muscleGroup && ex.muscleGroup.toLowerCase().includes(termoFiltroLower))
        );
    }, [exercicios, filtroExercicio]);


    // --- Renderização ---
    return (
        <div className={styles.cadastroContainer}>
            <h1>Gerenciar Exercícios e Treinos</h1>

            {/* Seção Cadastro de Exercícios */}
            <section className={styles.section}>
                <h2>Cadastrar Novo Exercício</h2>
                <form onSubmit={handleAdicionarExercicio} className={styles.formExercicio}>
                   <div className={styles.formGroup}><label htmlFor="nomeExercicio">Nome:</label><input type="text" id="nomeExercicio" value={novoExercicioNome} onChange={(e) => setNovoExercicioNome(e.target.value)} placeholder="Ex: Supino Reto (Barra)" required /></div>
                   <div className={styles.formGroup}><label htmlFor="grupoMuscular">Grupo Muscular (Opcional):</label><input type="text" id="grupoMuscular" value={novoExercicioGrupo} onChange={(e) => setNovoExercicioGrupo(e.target.value)} placeholder="Ex: Peito, Costas" /></div>
                   <button type="submit" className={styles.botaoAdicionar}>+ Add Exercício</button>
                </form>
                {errorExercicios && <p className={styles.errorApi}>{errorExercicios}</p>}
            </section>

            {/* Seção Montar Treino */}
            <section className={`${styles.section} ${styles.sectionMontagem}`}>
                <h2>Montar Novo Treino</h2>
                <div className={styles.formGroup}><label htmlFor="nomeNovoTreino">Nome do Treino:</label><input type="text" id="nomeNovoTreino" value={nomeNovoTreino} onChange={(e) => setNomeNovoTreino(e.target.value)} placeholder="Ex: Treino A - Foco Peito/Tríceps" required /></div>

                <div className={styles.montagemGrid}>
                    {/* Coluna 1: Exercícios Disponíveis com Filtro */}
                    <div className={styles.colunaExerciciosDisponiveis}>
                        <h4>Exercícios Disponíveis</h4>
                         {/* Input de Filtro */}
                         <div className={styles.filtroInputContainer}>
                            <input
                                type="text"
                                placeholder="Filtrar por nome ou grupo..."
                                value={filtroExercicio}
                                onChange={(e) => setFiltroExercicio(e.target.value)}
                                className={styles.filtroInput}
                            />
                         </div>

                        {loadingExercicios && <p>Carregando exercícios...</p>}
                        {!loadingExercicios && errorExercicios && <p className={styles.errorApi}>{errorExercicios}</p>}
                        {/* Renderiza a lista FILTRADA */}
                        {!loadingExercicios && !errorExercicios && exerciciosFiltrados.length === 0 && (<p>{filtroExercicio ? 'Nenhum exercício encontrado.' : 'Nenhum exercício cadastrado.'}</p>)}
                        {!loadingExercicios && !errorExercicios && exerciciosFiltrados.length > 0 && (
                            <ul className={styles.listaExercicios}>
                                {exerciciosFiltrados.map((exercicio) => ( // Usa exerciciosFiltrados
                                    <li key={exercicio.id} className={styles.itemExercicio}>
                                        {/* Usa exercicio.name e exercicio.muscleGroup */}
                                        <div className={styles.infoExercicio}><strong>{exercicio.name}</strong>{exercicio.muscleGroup && (<span className={styles.grupoMuscular}> ({exercicio.muscleGroup})</span>)}</div>
                                        <div>
                                            <button onClick={() => handleAdicionarExercicioAoNovoTreino(exercicio)} className={`${styles.botaoInline} ${styles.botaoPequenoAdicionar}`} title="Adicionar ao treino atual" disabled={exerciciosNovoTreino.some(nt => nt.idExercicio === exercicio.id)}>+</button>
                                            <button onClick={() => handleRemoverExercicio(exercicio.id)} className={`${styles.botaoInline} ${styles.botaoRemoverPequeno}`} title="Remover Exercício da Base">🗑️</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Contagem */}
                        {!loadingExercicios && !errorExercicios && exercicios.length > 0 && (
                            <p className={styles.contagemFiltro}>Mostrando {exerciciosFiltrados.length} de {exercicios.length}.</p>
                        )}
                    </div>

                    {/* Coluna 2: Exercícios Selecionados */}
                    <div className={styles.colunaExerciciosSelecionados}>
                        <h3>Exercícios no Treino "{nomeNovoTreino || '...'}" ({exerciciosNovoTreino.length})</h3>
                        {exerciciosNovoTreino.length === 0 ? ( <p>Adicione exercícios da lista ao lado.</p> ) : (
                            <ul className={styles.listaExerciciosDoTreino}>
                                {exerciciosNovoTreino.map((exTreino) => (
                                    <li key={exTreino.idExercicio} className={styles.itemExercicioDoTreino}>
                                        <h4>{exTreino.nomeExercicio}</h4>
                                        <div className={styles.configuracaoSeries}>
                                            <label>Séries e Repetições:</label>
                                            {exTreino.series.map((serie, index) => (
                                                <div key={serie.id} className={styles.serieInputGroup}>
                                                    <span>Série {index + 1}:</span>
                                                    <input type="number" min="1" value={serie.reps} onChange={(e) => handleRepeticoesChange(exTreino.idExercicio, serie.id, e.target.value)} placeholder="Reps" className={styles.inputReps} required />
                                                    <span>reps</span>
                                                </div>
                                            ))}
                                            <div className={styles.botoesSerie}>
                                                <button onClick={() => handleAdicionarSerieAoExercicio(exTreino.idExercicio)} className={styles.botaoMaisMenos}>+</button>
                                                <button onClick={() => handleRemoverSerieDoExercicio(exTreino.idExercicio)} className={styles.botaoMaisMenos} disabled={exTreino.series.length <= 1}>-</button>
                                                <span>Séries</span>
                                            </div>
                                        </div>
                                        <div className={styles.anotacoesExercicio}>
                                            <label htmlFor={`anotacoes-${exTreino.idExercicio}`}>Anotações (Opcional):</label>
                                            <textarea id={`anotacoes-${exTreino.idExercicio}`} value={exTreino.anotacoes} onChange={(e) => handleAnotacoesChange(exTreino.idExercicio, e.target.value)} placeholder="Ex: Focar na descida..." rows="2" />
                                        </div>
                                        <button onClick={() => handleRemoverExercicioDoNovoTreino(exTreino.idExercicio)} className={styles.botaoRemoverDoTreino} title="Remover do treino atual">Remover do Treino</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <button onClick={handleSalvarNovoTreino} className={styles.botaoSalvarTreino} disabled={!nomeNovoTreino.trim() || exerciciosNovoTreino.length === 0 || savingTreino}>
                    {savingTreino ? 'Salvando...' : `Salvar Treino "${nomeNovoTreino || 'Novo Treino'}"`}
                </button>
                {errorTreinos && !loadingTreinos && <p className={styles.errorApi}>{errorTreinos}</p>}
            </section>

            {/* Seção Lista Treinos Montados */}
            <section className={styles.section}>
                <h2>Treinos Montados ({treinosMontados.length})</h2>
                {loadingTreinos && <p>Carregando treinos...</p>}
                {!loadingTreinos && errorTreinos && <p className={styles.errorApi}>{errorTreinos}</p>}
                {!loadingTreinos && !errorTreinos && treinosMontados.length === 0 && (<p>Nenhum treino montado ainda.</p>)}
                {!loadingTreinos && !errorTreinos && treinosMontados.length > 0 && (
                    <ul className={styles.listaTreinosMontados}>
                        {treinosMontados.map((treino) => (
                            <li key={treino.id} className={styles.itemTreinoMontado}>
                                <div className={styles.infoTreino}><strong>{treino.name}</strong> ({treino.exercises?.length || 0} exercícios)</div>
                                <div className={styles.botoesAcaoTreino}>
                                    <button onClick={() => handleRemoverTreinoMontado(treino.id)} className={styles.botaoRemoverTreino} title="Remover Treino Montado">🗑️ Remover</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default CadastroExercicios;