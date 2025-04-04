// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Dashboard.module.css';

const TREINO_ATUAL_STATE_KEY = 'gymProgressHub_treinoAtual_state';
const ULTIMO_TREINO_ID_KEY = 'gymProgressHub_ultimoTreinoId';
const API_BASE_URL = 'http://localhost:3001/api';

// Mock Data (estrutura final esperada)
const treinoInicialPadrao = {
    id: 'default-mock',
    name: 'Treino Padrão (Exemplo)', // 'name'
    exercises: [ // 'exercises' (array)
        { idExercicio: 'mock001', nome: 'Supino Reto (Mock)', series: [{ reps: 10 }, { reps: 10 }, { reps: 8 }], anotacoes: 'Cadastre seus próprios treinos!' },
        { idExercicio: 'mock002', nome: 'Agachamento (Mock)', series: [{ reps: 12 }, { reps: 12 }, { reps: 12 }], anotacoes: '' },
    ]
};

// Função de formatação (versão robusta revisada)
const formatarTreinoParaExecucao = (treinoData) => {
    // console.log("[formatar] Recebido:", treinoData ? JSON.stringify(treinoData).substring(0, 100) + '...' : 'null');
    if (!treinoData || typeof treinoData.id !== 'string' || typeof treinoData.name !== 'string') { console.warn("[formatar] Objeto treino base inválido:", treinoData); return null; }
    let inputExercises = null;
    if (typeof treinoData.exercises_json === 'string') { try { inputExercises = JSON.parse(treinoData.exercises_json); if (!Array.isArray(inputExercises)) { inputExercises = []; } } catch (e) { console.error(`[formatar] Erro parse exercises_json ${treinoData.id}:`, e); return null; } }
    else if (Array.isArray(treinoData.exercises)) { inputExercises = treinoData.exercises; }
    else { inputExercises = []; }
    if (!Array.isArray(inputExercises)) { console.error(`[formatar] inputExercises não é array ${treinoData.id}.`); return null; }
    try {
        const exerciciosFormatados = inputExercises.map((ex, idxEx) => {
            if (!ex || typeof ex.idExercicio !== 'string' || typeof ex.nome !== 'string' || !Array.isArray(ex.series)) { console.warn(`[formatar] Ignorando ex inválido ${idxEx}:`, ex); return null; }
            const seriesFormatadas = ex.series.map((s, idxS) => {
                // Permite reps 0, mas não undefined/null/não número
                if (!s || typeof s.reps === 'undefined' || s.reps === null || isNaN(Number(s.reps))) { console.warn(`[formatar] Ignorando série inválida ${idxS} ex ${ex.idExercicio}:`, s); return null; }
                // Adiciona carga e concluida que podem vir do estado salvo (se formatando estado salvo)
                const cargaInicial = typeof s.carga === 'number' ? s.carga : null;
                const concluidaInicial = typeof s.concluida === 'boolean' ? s.concluida : false;
                // Gera ID único da instância OU mantém o ID existente do estado salvo
                const serieId = s.id || `s-${ex.idExercicio}-${idxS}-${Date.now()}`;
                return { id: serieId, reps: Number(s.reps), carga: cargaInicial, concluida: concluidaInicial };
            }).filter(Boolean); // Remove séries que retornaram null
            return { idExercicio: ex.idExercicio, nome: ex.nome, anotacoes: ex.anotacoes || '', series: seriesFormatadas };
        }).filter(Boolean); // Remove exercícios que retornaram null
        const treinoFinal = { id: treinoData.id, name: treinoData.name, user_id: treinoData.user_id, createdAt: treinoData.createdAt, exercises: exerciciosFormatados };
        // console.log("[formatar] Sucesso:", JSON.stringify(treinoFinal).substring(0, 100) + '...');
        return treinoFinal;
    } catch (error) { console.error("[formatar] Erro map/filter:", error); return null; }
};


function Dashboard() {
    const { user } = useAuth();
    const [treinosDisponiveis, setTreinosDisponiveis] = useState([]);
    const [treinoSelecionadoId, setTreinoSelecionadoId] = useState('');
    const [treinoAtual, setTreinoAtual] = useState(null);
    const [loadingInitial, setLoadingInitial] = useState(true);

    // Carregamento Inicial (Usa formatação corrigida e lógica completa)
    useEffect(() => {
        setLoadingInitial(true); console.log("Dashboard Mount/User Change: Iniciando carregamento...");
        const fetchDefs = async (userId) => { try { const r = await fetch(`${API_BASE_URL}/workouts/user/${userId}`); if (!r.ok) { console.error(`Err fetch defs ${r.status}`); return []; } const d = await r.json(); console.log("Defs API recebidas:", d); return d; } catch (e) { console.error("Crit err fetch defs:", e); return []; } };
        const carregarDadosIniciais = async () => {
            let estadoSalvo = null; let ultimoIdSalvo = null; let carregados = [];
            // Se não tem usuário, carrega o mock e termina
            if (!user?.id) {
                console.log("Dash: No user, formatando mock.");
                const f=formatarTreinoParaExecucao(treinoInicialPadrao);
                setTreinoAtual(f);
                setTreinoSelecionadoId(f?.id || '');
                setLoadingInitial(false); // Finaliza loading aqui para o caso sem usuário
                console.log("Dashboard: Carregamento concluído (mock).");
                return;
            }
            // Se tem usuário, busca treinos da API
            carregados = await fetchDefs(user.id); setTreinosDisponiveis(carregados);
            // Tenta carregar estado salvo do LocalStorage
            try { const s=localStorage.getItem(TREINO_ATUAL_STATE_KEY); if(s){estadoSalvo=JSON.parse(s); if(!estadoSalvo || !estadoSalvo.id || !Array.isArray(estadoSalvo.exercises)){console.warn("Invalid state, removendo");estadoSalvo=null;localStorage.removeItem(TREINO_ATUAL_STATE_KEY);}else{console.log("Estado salvo encontrado:", estadoSalvo);}}}catch(e){console.error("Err load state:",e);estadoSalvo=null;localStorage.removeItem(TREINO_ATUAL_STATE_KEY);}
            ultimoIdSalvo = localStorage.getItem(ULTIMO_TREINO_ID_KEY); console.log("Ultimo ID selecionado:", ultimoIdSalvo);

            let idParaCarregar = null; let treinoParaCarregar = null;

            // Prioridade 1: Estado Salvo (Re-formata para garantir consistência de IDs de série)
            if (estadoSalvo) { const defExiste = carregados.some(t=>t.id===estadoSalvo.id); if(defExiste){const reformatado = formatarTreinoParaExecucao(estadoSalvo); if(reformatado) { idParaCarregar=estadoSalvo.id;treinoParaCarregar=reformatado;console.log(`Continuando (estado re-formatado) ${estadoSalvo.name}`);} else { console.warn(`Falha ao re-formatar estado salvo ${estadoSalvo.id}`); localStorage.removeItem(TREINO_ATUAL_STATE_KEY); estadoSalvo = null;}}else{console.warn(`Estado salvo ${estadoSalvo.id} não está nas defs atuais da API.`);localStorage.removeItem(TREINO_ATUAL_STATE_KEY); estadoSalvo = null;}}

            // Prioridade 2: Último ID Selecionado (Formata da API)
            if (!treinoParaCarregar && ultimoIdSalvo) { const def = carregados.find(t=>t.id===ultimoIdSalvo); if(def){console.log("Tentando formatar último selecionado:", def); const f=formatarTreinoParaExecucao(def);if(f){idParaCarregar=ultimoIdSalvo;treinoParaCarregar=f;console.log(`Carregando ultimo ${def.name}`);}else{console.error(`Falha format ultimo ${ultimoIdSalvo}`);localStorage.removeItem(ULTIMO_TREINO_ID_KEY);}}else{console.warn(`Ultimo ID ${ultimoIdSalvo} not found in API defs`);localStorage.removeItem(ULTIMO_TREINO_ID_KEY);}}

            // Prioridade 3: Primeiro Treino da API (Formata da API)
            if (!treinoParaCarregar && carregados.length > 0) { console.log("Tentando formatar primeiro da API:", carregados[0]); const f = formatarTreinoParaExecucao(carregados[0]); if (f) { idParaCarregar=carregados[0].id;treinoParaCarregar=f;console.log(`Carregando primeiro ${carregados[0].name}`);localStorage.setItem(ULTIMO_TREINO_ID_KEY, idParaCarregar);} else { console.error(`Falha format primeiro ${carregados[0].id}.`); }}

            // Prioridade 4: Mock (se NENHUM treino da API foi carregado/formatado)
            if (!treinoParaCarregar) { console.log("Formatando Mock como fallback final."); const f=formatarTreinoParaExecucao(treinoInicialPadrao); if (f) { idParaCarregar=treinoInicialPadrao.id;treinoParaCarregar=f;console.log("Usando mock (fallback)"); } else { console.error("Falha CRÍTICA format mock!"); } }

            // Define o estado final
            if (treinoParaCarregar){ console.log("Definindo treino atual final:", treinoParaCarregar); setTreinoAtual(treinoParaCarregar); setTreinoSelecionadoId(idParaCarregar); }
            else { console.error("Nenhum treino válido pôde ser definido como atual."); setTreinoAtual(null); setTreinoSelecionadoId(''); }
        };
        carregarDadosIniciais().finally(() => { console.log("Dashboard: Carregamento concluído."); setLoadingInitial(false); });
    }, [user?.id]); // Dependência APENAS no user.id


    // Salvar Estado de Execução no LocalStorage (Mantido)
    useEffect(() => {
        if (treinoAtual === null) return; // Não salva se for nulo
        if (treinoAtual.id !== 'default-mock') { try {localStorage.setItem(TREINO_ATUAL_STATE_KEY, JSON.stringify(treinoAtual));} catch (e) { console.error("Err save state:", e); } }
        else { localStorage.removeItem(TREINO_ATUAL_STATE_KEY); }
    }, [treinoAtual]); // Roda sempre que o treinoAtual mudar


    // Handler para Mudança no Dropdown (Revisado)
    const handleSelecaoTreino = useCallback(async (event) => {
        const novoIdSelecionado = event.target.value;
        const definicaoSelecionada = treinosDisponiveis.find(t => t.id === novoIdSelecionado) || (novoIdSelecionado === 'default-mock' ? treinoInicialPadrao : null);

        if (!definicaoSelecionada) { alert("Erro: Treino selecionado inválido."); event.target.value = treinoSelecionadoId; return; }

        const estadoAtualExiste = localStorage.getItem(TREINO_ATUAL_STATE_KEY);
        const progressoExiste = estadoAtualExiste && treinoAtual && treinoAtual.id !== 'default-mock' && treinoAtual.id !== novoIdSelecionado;
        let mudar = !progressoExiste || window.confirm("Descartar progresso atual?");

        if (mudar) {
            const treinoFormatado = formatarTreinoParaExecucao(definicaoSelecionada);
            if (treinoFormatado) {
                setTreinoAtual(treinoFormatado);
                setTreinoSelecionadoId(novoIdSelecionado); // Atualiza o select
                localStorage.setItem(ULTIMO_TREINO_ID_KEY, novoIdSelecionado);
                localStorage.removeItem(TREINO_ATUAL_STATE_KEY);
            } else { alert("Erro ao carregar treino."); event.target.value = treinoSelecionadoId; }
        } else { event.target.value = treinoSelecionadoId; }
    }, [treinoAtual, treinoSelecionadoId, treinosDisponiveis]);


    // Handler de Carga (Imutável com .map - Mantido)
    const handleCargaChange = useCallback((exercicioId, serieId, novaCargaStr) => {
        const novaCargaNum = novaCargaStr === '' || isNaN(parseFloat(novaCargaStr)) ? null : parseFloat(novaCargaStr);
        setTreinoAtual(treinoAnterior => {
            if (!treinoAnterior) return null;
            return { ...treinoAnterior, exercises: treinoAnterior.exercises.map(exercicio => exercicio.idExercicio !== exercicioId ? exercicio : { ...exercicio, series: exercicio.series.map(serie => serie.id !== serieId ? serie : { ...serie, carga: novaCargaNum } ) }) };
        });
    }, []);


    // Handler para Concluir Série (Imutável com .map + API Async - Mantido)
    const handleToggleConcluirSerie = useCallback(async (exercicioId, serieId) => {
        if (!user?.id) { alert("Erro: Faça login para salvar."); return; }
        let treinoRef = null; let serieRef = null; let exercicioRef = null; let concluidaState = null;
        setTreinoAtual(estadoAnterior => {
            if (!estadoAnterior) return null;
            treinoRef = estadoAnterior;
            return { ...estadoAnterior, exercises: estadoAnterior.exercises.map(ex => { if (ex.idExercicio !== exercicioId) return ex; exercicioRef = ex; return { ...ex, series: ex.series.map(s => { if (s.id !== serieId) return s; concluidaState = !s.concluida; serieRef = { ...s, concluida: concluidaState }; return serieRef; }) }; }) };
        });
        await new Promise(resolve => setTimeout(resolve, 0));
        if (treinoRef && exercicioRef && serieRef && concluidaState !== null) {
            const cargaValida = serieRef.carga !== null && !isNaN(parseFloat(serieRef.carga)) && parseFloat(serieRef.carga) >= 0;
            const deveSalvar = concluidaState && cargaValida;
            if (deveSalvar) {
                const registro = { userId: user.id, timestamp: Date.now(), workoutId: treinoRef.id === 'default-mock' ? null : treinoRef.id, workoutName: treinoRef.name, exerciseId: exercicioRef.idExercicio, exerciseName: exercicioRef.nome, seriesInstanceId: serieRef.id, repsPerformed: parseInt(serieRef.reps) || 0, loadUsed: parseFloat(serieRef.carga) };
                // console.log("Enviando histórico API:", registro);
                try { const r = await fetch(`${API_BASE_URL}/history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registro) }); const d = await r.json(); if (!r.ok && !(r.status === 200 && d.message === 'Registro já existe.')) { throw new Error(d.error || `API Error ${r.status}`); } console.log("Histórico API OK:", d); } catch (e) { console.error("ERRO API histórico:", e); }
            } else if (concluidaState === false) { console.log(`Série ${serieRef.id} desmarcada.`); }
        } else { console.warn("Refs não populadas para API"); }
    }, [user?.id]);


    // Handler para Resetar Progresso (com logs - Revisado para funcionar)
    const handleResetarProgresso = useCallback(async () => {
        if (!treinoAtual || !user?.id) { console.log("[Reset] Cancelado: Sem treino ou user."); return; }
        if(window.confirm(`Resetar progresso do treino "${treinoAtual.name}"? (Cargas e conclusões zeradas. Histórico salvo NÃO afetado).`)) {
            console.log("[Reset] Iniciado ID:", treinoAtual.id);
            let definicaoOriginal = treinosDisponiveis.find(t => t.id === treinoAtual.id);
            console.log("[Reset] Def local encontrada:", definicaoOriginal);
            if (!definicaoOriginal && treinoAtual.id !== 'default-mock') {
                console.warn("[Reset] Tentando buscar def da API...");
                 try { const r = await fetch(`${API_BASE_URL}/workouts/user/${user.id}`); const d = await r.json(); setTreinosDisponiveis(d); definicaoOriginal = d.find(t => t.id === treinoAtual.id); console.log("[Reset] Def API encontrada:", definicaoOriginal); }
                 catch (e) { console.error("[Reset] Falha busca def:", e); }
            } else if (treinoAtual.id === 'default-mock') { definicaoOriginal = treinoInicialPadrao; console.log("[Reset] Usando Mock Def."); }

            if (definicaoOriginal) {
                console.log("[Reset] Formatando definição encontrada:", definicaoOriginal ? JSON.stringify(definicaoOriginal).substring(0,100)+'...' : 'null');
                // *** USA A FUNÇÃO DE FORMATAÇÃO PARA RESETAR CARGAS/CONCLUSÕES ***
                const treinoResetado = formatarTreinoParaExecucao(definicaoOriginal);
                if (treinoResetado) {
                     console.log("[Reset] Aplicando estado resetado:", treinoResetado ? JSON.stringify(treinoResetado).substring(0,100)+'...' : 'null');
                    setTreinoAtual(treinoResetado); // Aplica o treino formatado (sem progresso)
                    localStorage.removeItem(TREINO_ATUAL_STATE_KEY); // Limpa o estado salvo com progresso
                    console.log("[Reset] Sucesso.");
                } else { console.error("[Reset] Falha format."); alert("Erro ao resetar."); }
            } else { console.error("[Reset] Def não encontrada."); alert("Erro: Definição não encontrada."); }
        } else { console.log("[Reset] Cancelado."); }
    }, [treinoAtual, user?.id, treinosDisponiveis]); // Dependências


    // --- Renderização ---
    if (loadingInitial) { return <div style={{ textAlign: 'center', padding: '2rem', fontSize: '1.2em' }}>Carregando dados do treino...</div>; }
    if (!treinoAtual) { return <div style={{ textAlign: 'center', padding: '2rem', fontSize: '1.2em' }}>Nenhum treino para exibir. Cadastre um ou verifique erros.</div>; }

    const variantsItemSerie = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, concluida: { backgroundColor: "rgba(58, 90, 64, 0.7)", opacity: 0.8, transition: { duration: 0.3 } }, naoConcluida: { backgroundColor: "rgba(47, 47, 47, 0)", opacity: 1, transition: { duration: 0.3 } } };

    return (
        <div className={styles.dashboardContainer}>
            {/* Seletor de Treino */}
            <div className={styles.seletorContainer}>
                <label htmlFor="treinoSelect">Escolha o Treino:</label>
                <select id="treinoSelect" value={treinoSelecionadoId} onChange={handleSelecaoTreino} className={styles.treinoSelect} disabled={treinosDisponiveis.length === 0 && treinoInicialPadrao.id === 'default-mock'}>
                    {(treinosDisponiveis.length === 0 || treinoSelecionadoId === 'default-mock') && (<option value={treinoInicialPadrao.id}>{treinoInicialPadrao.name}</option>)}
                    {treinosDisponiveis.map(treino => (!(treino.id === 'default-mock' && treinoSelecionadoId !== 'default-mock') && <option key={treino.id} value={treino.id}>{treino.name}</option>))}
                </select>
                <button onClick={handleResetarProgresso} className={styles.botaoResetProgresso} title="Resetar Cargas/Concluídas deste Treino" disabled={!treinoAtual || treinoAtual.id === 'default-mock'} > ↻ Resetar Progresso </button>
            </div>
            {/* Exibição do Treino Atual */}
            <h1>{treinoAtual.name}</h1> <p>Registre seu progresso!</p>
            {treinoAtual.exercises && treinoAtual.exercises.length > 0 ? ( treinoAtual.exercises.map((exercicio) => ( <motion.div key={exercicio.idExercicio} className={styles.exercicioCard} layout> <h2>{exercicio.nome}</h2> {exercicio.anotacoes && <p className={styles.anotacoes}><em>Anotações: {exercicio.anotacoes}</em></p>} {Array.isArray(exercicio.series) && exercicio.series.length > 0 ? ( <ul className={styles.seriesList}> {exercicio.series.map((serie, index) => ( <motion.li key={serie.id} className={styles.serieItem} variants={variantsItemSerie} initial="initial" animate={serie.concluida ? "concluida" : "naoConcluida"} layout transition={{ type: "spring", stiffness: 300, damping: 25 }}> <span className={`${styles.serieNumero} ${serie.concluida ? styles.textoConcluido : ''}`}>Série {index + 1}:</span> <span className={`${styles.serieReps} ${serie.concluida ? styles.textoConcluido : ''}`}>{serie.reps} reps</span> <div className={styles.cargaInputContainer}> <label htmlFor={`carga-${exercicio.idExercicio}-${serie.id}`} className={serie.concluida ? styles.textoConcluido : ''} >Carga (Kg):</label> <input type="number" id={`carga-${exercicio.idExercicio}-${serie.id}`} className={styles.cargaInput} value={serie.carga ?? ''} onChange={(e) => handleCargaChange(exercicio.idExercicio, serie.id, e.target.value)} placeholder="0" disabled={serie.concluida} /> </div> <motion.button className={styles.botaoConcluir} onClick={() => handleToggleConcluirSerie(exercicio.idExercicio, serie.id)} title={serie.concluida ? "Desmarcar Série" : "Finalizar Série"} whileHover={{ scale: 1.2, rotate: serie.concluida ? 10 : -10 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}> <motion.span key={serie.concluida ? 'concluido' : 'pendente'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }} > {serie.concluida ? '✅' : '🏁'} </motion.span> </motion.button> </motion.li> ))} </ul> ) : ( <p><i>(Sem séries)</i></p> )} </motion.div> )) ) : ( <p>Este treino não possui exercícios.</p> )}
        </div>
    );
}
export default Dashboard;