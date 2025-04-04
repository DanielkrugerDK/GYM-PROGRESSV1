// src/pages/CadastroExercicios/CadastroExercicios.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Importa useAuth
import styles from './CadastroExercicios.module.css';

// NOVO: Define a URL base da API para facilitar a manutenção
const API_BASE_URL = 'http://localhost:3001/api';

function CadastroExercicios() {
  const { user } = useAuth(); // Pega o usuário logado (precisamos do user.id)

  // --- Estados do Componente ---
  // Listas de dados
  const [exercicios, setExercicios] = useState([]);
  const [treinosMontados, setTreinosMontados] = useState([]);
  // Formulário de novo exercício
  const [novoExercicioNome, setNovoExercicioNome] = useState('');
  const [novoExercicioGrupo, setNovoExercicioGrupo] = useState('');
  // Montagem do treino atual
  const [nomeNovoTreino, setNomeNovoTreino] = useState('');
  const [exerciciosNovoTreino, setExerciciosNovoTreino] = useState([]);
  // Controle de UI
  const [loadingExercicios, setLoadingExercicios] = useState(false);
  const [loadingTreinos, setLoadingTreinos] = useState(false);
  const [errorExercicios, setErrorExercicios] = useState('');
  const [errorTreinos, setErrorTreinos] = useState('');
  const [savingTreino, setSavingTreino] = useState(false); // Loading específico para salvar treino

  // --- Funções para Buscar Dados da API ---

  // Busca todos os exercícios (globais)
  const fetchExercicios = useCallback(async () => {
    setLoadingExercicios(true);
    setErrorExercicios('');
    try {
      const response = await fetch(`${API_BASE_URL}/exercises`);
      if (!response.ok) throw new Error('Falha ao buscar exercícios.');
      const data = await response.json();
      setExercicios(data);
    } catch (error) {
      console.error("Erro buscando exercícios:", error);
      setErrorExercicios(error.message || 'Não foi possível carregar os exercícios.');
    } finally {
      setLoadingExercicios(false);
    }
  }, []); // useCallback sem dependências, pois não depende de props/state externo à função

  // Busca os treinos montados DO USUÁRIO LOGADO
  const fetchTreinosMontados = useCallback(async () => {
    if (!user?.id) return; // Não busca se não houver ID de usuário

    setLoadingTreinos(true);
    setErrorTreinos('');
    try {
      const response = await fetch(`${API_BASE_URL}/workouts/user/${user.id}`);
      if (!response.ok) throw new Error('Falha ao buscar treinos montados.');
      const data = await response.json();
      setTreinosMontados(data);
    } catch (error) {
      console.error("Erro buscando treinos montados:", error);
      setErrorTreinos(error.message || 'Não foi possível carregar os treinos.');
    } finally {
      setLoadingTreinos(false);
    }
  }, [user?.id]); // Depende do user.id

  // --- Efeitos para Carregamento Inicial ---
  useEffect(() => {
    fetchExercicios(); // Busca exercícios ao montar o componente
  }, [fetchExercicios]); // Roda quando fetchExercicios é definido (uma vez)

  useEffect(() => {
    if (user?.id) { // Busca treinos apenas se o usuário estiver definido
      fetchTreinosMontados();
    } else {
      // Limpa treinos se o usuário deslogar enquanto a página está aberta
      setTreinosMontados([]);
    }
  }, [user?.id, fetchTreinosMontados]); // Roda se user.id ou fetchTreinosMontados mudar

  // --- Funções de Manipulação (CRUD) ---

  // Adicionar Exercício via API
  const handleAdicionarExercicio = async (event) => {
    event.preventDefault();
    if (!novoExercicioNome.trim()) { alert('Digite o nome do exercício.'); return; }

    const novoExercicio = {
      // Gera ID no frontend (pode ser UUID ou outra forma mais robusta)
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: novoExercicioNome.trim(),
      muscleGroup: novoExercicioGrupo.trim() || null,
    };

    setErrorExercicios(''); // Limpa erro anterior
    try {
      const response = await fetch(`${API_BASE_URL}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoExercicio),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao adicionar exercício.');

      // Atualiza estado local para feedback imediato (ou poderia chamar fetchExercicios())
      setExercicios(prev => [...prev, data]); // Adiciona o exercício retornado pela API

      // Limpa formulário
      setNovoExercicioNome('');
      setNovoExercicioGrupo('');
      console.log('Exercício adicionado via API:', data);
    } catch (error) {
      console.error("Erro ao adicionar exercício:", error);
      setErrorExercicios(error.message);
    }
  };

  // Remover Exercício via API
  const handleRemoverExercicio = async (idParaRemover) => {
     if (!window.confirm("Remover este exercício da base de dados?")) return;

     setErrorExercicios('');
     try {
        const response = await fetch(`${API_BASE_URL}/exercises/${idParaRemover}`, {
            method: 'DELETE',
        });
        const data = await response.json(); // Mesmo que seja 204, tenta ler para pegar erro
        if (!response.ok) throw new Error(data.error || 'Erro ao remover exercício.');

        // Atualiza estado local
        setExercicios(prev => prev.filter(ex => ex.id !== idParaRemover));
        // Remove também do treino sendo montado
        setExerciciosNovoTreino(prev => prev.filter(ex => ex.idExercicio !== idParaRemover));
        console.log('Exercício removido via API:', idParaRemover);
     } catch(error) {
        console.error("Erro ao remover exercício:", error);
        setErrorExercicios(error.message);
     }
  };

  // Salvar Novo Treino Montado via API
  const handleSalvarNovoTreino = async () => {
    if (!user?.id) { alert("Erro: Usuário não identificado."); return; }
    if (!nomeNovoTreino.trim()) { alert("Dê um nome ao treino."); return; }
    if (exerciciosNovoTreino.length === 0) { alert("Adicione exercícios."); return; }
    const repInvalida = exerciciosNovoTreino.some(ex => ex.series.some(s => !s.reps || isNaN(parseInt(s.reps)) || parseInt(s.reps) <= 0));
    if (repInvalida) { alert("Preencha repetições válidas."); return; }

    const novoTreinoParaSalvar = {
      id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: user.id, // *** Adiciona o ID do usuário logado ***
      name: nomeNovoTreino.trim(),
      exercises: exerciciosNovoTreino.map(ex => ({ // Mapeia para a estrutura esperada pela API
        idExercicio: ex.idExercicio,
        nome: ex.nomeExercicio,
        series: ex.series.map(s => ({ reps: parseInt(s.reps) })),
        anotacoes: ex.anotacoes || undefined
      }))
    };

    setSavingTreino(true);
    setErrorTreinos('');
    try {
        const response = await fetch(`${API_BASE_URL}/workouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoTreinoParaSalvar),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao salvar treino.');

        // Atualiza estado local (ou chama fetchTreinosMontados())
        setTreinosMontados(prev => [...prev, data]);

        // Limpa formulário de montagem
        setNomeNovoTreino('');
        setExerciciosNovoTreino([]);
        console.log("Treino salvo via API:", data);
        alert("Treino salvo com sucesso!");

    } catch (error) {
        console.error("Erro ao salvar treino:", error);
        setErrorTreinos(error.message);
    } finally {
        setSavingTreino(false);
    }
  };

  // Remover Treino Montado via API
  const handleRemoverTreinoMontado = async (idParaRemover) => {
     if (!user?.id) { alert("Erro: Usuário não identificado."); return; }
     if (!window.confirm("Remover este treino montado?")) return;

     setErrorTreinos('');
     try {
         // Passa o ID do treino e o ID do usuário para o backend verificar permissão
         const response = await fetch(`${API_BASE_URL}/workouts/${idParaRemover}/user/${user.id}`, {
             method: 'DELETE',
         });
         const data = await response.json();
         if (!response.ok) throw new Error(data.error || 'Erro ao remover treino.');

         // Atualiza estado local
         setTreinosMontados(prev => prev.filter(t => t.id !== idParaRemover));
         console.log('Treino montado removido via API:', idParaRemover);

     } catch (error) {
         console.error("Erro ao remover treino montado:", error);
         setErrorTreinos(error.message);
     }
  };


  // --- Funções Auxiliares (Montagem de Treino - sem alterações na lógica interna) ---
  const handleAdicionarExercicioAoNovoTreino = (exercicioParaAdicionar) => {
    if (exerciciosNovoTreino.some(ex => ex.idExercicio === exercicioParaAdicionar.id)) return;
    setExerciciosNovoTreino(prev => [...prev, { idExercicio: exercicioParaAdicionar.id, nomeExercicio: exercicioParaAdicionar.name, series: [{ id: `s-${Date.now()}`, reps: '' }], anotacoes: '' }]);
  };
  const handleRemoverExercicioDoNovoTreino = (idExercicioParaRemover) => { setExerciciosNovoTreino(prev => prev.filter(ex => ex.idExercicio !== idExercicioParaRemover)); };
  const handleAdicionarSerieAoExercicio = (idExercicio) => { setExerciciosNovoTreino(prev => prev.map(ex => ex.idExercicio === idExercicio ? { ...ex, series: [...ex.series, { id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, reps: '' }] } : ex)); };
  const handleRemoverSerieDoExercicio = (idExercicio) => { setExerciciosNovoTreino(prev => prev.map(ex => ex.idExercicio === idExercicio && ex.series.length > 1 ? { ...ex, series: ex.series.slice(0, -1) } : ex).filter(ex => ex.series.length > 0)); };
  const handleRepeticoesChange = (idExercicio, idSerie, valor) => { setExerciciosNovoTreino(prev => prev.map(ex => ex.idExercicio === idExercicio ? { ...ex, series: ex.series.map(s => s.id === idSerie ? { ...s, reps: valor } : s) } : ex)); };
  const handleAnotacoesChange = (idExercicio, valor) => { setExerciciosNovoTreino(prev => prev.map(ex => ex.idExercicio === idExercicio ? { ...ex, anotacoes: valor } : ex)); };

  // --- Renderização ---
  return (
    <div className={styles.cadastroContainer}>
      <h1>Gerenciar Exercícios e Treinos</h1>

      {/* --- Seção Cadastro de Exercícios --- */}
      <section className={styles.section}>
        <h2>Cadastrar Novo Exercício</h2>
        <form onSubmit={handleAdicionarExercicio} className={styles.formExercicio}>
           {/* Inputs (sem mudança) */}
           <div className={styles.formGroup}><label htmlFor="nomeExercicio">Nome:</label><input type="text" id="nomeExercicio" value={novoExercicioNome} onChange={(e) => setNovoExercicioNome(e.target.value)} placeholder="Ex: Supino Reto (Barra)" required /></div>
           <div className={styles.formGroup}><label htmlFor="grupoMuscular">Grupo Muscular (Opcional):</label><input type="text" id="grupoMuscular" value={novoExercicioGrupo} onChange={(e) => setNovoExercicioGrupo(e.target.value)} placeholder="Ex: Peito, Costas" /></div>
           <button type="submit" className={styles.botaoAdicionar}>+ Add Exercício</button>
        </form>
        {errorExercicios && <p className={styles.errorApi}>{errorExercicios}</p>}
      </section>

      {/* --- Seção para Montar Treino --- */}
      <section className={`${styles.section} ${styles.sectionMontagem}`}>
        <h2>Montar Novo Treino</h2>
        <div className={styles.formGroup}><label htmlFor="nomeNovoTreino">Nome do Treino:</label><input type="text" id="nomeNovoTreino" value={nomeNovoTreino} onChange={(e) => setNomeNovoTreino(e.target.value)} placeholder="Ex: Treino A - Foco Peito/Tríceps" required /></div>

        <div className={styles.montagemGrid}>
          {/* Coluna 1: Exercícios Disponíveis */}
          <div className={styles.colunaExerciciosDisponiveis}>
            <h4>Exercícios Disponíveis ({exercicios.length})</h4>
            {loadingExercicios && <p>Carregando exercícios...</p>}
            {!loadingExercicios && errorExercicios && <p className={styles.errorApi}>{errorExercicios}</p>}
            {!loadingExercicios && !errorExercicios && exercicios.length === 0 && (<p>Nenhum exercício cadastrado.</p>)}
            {!loadingExercicios && !errorExercicios && exercicios.length > 0 && (
                <ul className={styles.listaExercicios}>
                    {exercicios.map((exercicio) => (
                        <li key={exercicio.id} className={styles.itemExercicio}>
                            <div className={styles.infoExercicio}><strong>{exercicio.name}</strong>{exercicio.muscleGroup && (<span className={styles.grupoMuscular}> ({exercicio.muscleGroup})</span>)}</div>
                            <div>
                                <button onClick={() => handleAdicionarExercicioAoNovoTreino(exercicio)} className={`${styles.botaoInline} ${styles.botaoPequenoAdicionar}`} title="Adicionar ao treino atual" disabled={exerciciosNovoTreino.some(nt => nt.idExercicio === exercicio.id)}>+</button>
                                <button onClick={() => handleRemoverExercicio(exercicio.id)} className={`${styles.botaoInline} ${styles.botaoRemoverPequeno}`} title="Remover Exercício da Base">🗑️</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
          </div>

          {/* Coluna 2: Exercícios Selecionados */}
          <div className={styles.colunaExerciciosSelecionados}>
             <h3>Exercícios no Treino "{nomeNovoTreino || '...'}" ({exerciciosNovoTreino.length})</h3>
             {/* Conteúdo da montagem (igual ao anterior, usando exerciciosNovoTreino) */}
             {exerciciosNovoTreino.length === 0 ? ( <p>Adicione exercícios da lista ao lado.</p> ) : (
                 <ul className={styles.listaExerciciosDoTreino}> {exerciciosNovoTreino.map((exTreino) => ( <li key={exTreino.idExercicio} className={styles.itemExercicioDoTreino}> <h4>{exTreino.nomeExercicio}</h4> <div className={styles.configuracaoSeries}><label>Séries e Repetições:</label> {exTreino.series.map((serie, index) => ( <div key={serie.id} className={styles.serieInputGroup}> <span>Série {index + 1}:</span> <input type="number" min="1" value={serie.reps} onChange={(e) => handleRepeticoesChange(exTreino.idExercicio, serie.id, e.target.value)} placeholder="Reps" className={styles.inputReps} required /> <span>reps</span> </div> ))} <div className={styles.botoesSerie}><button onClick={() => handleAdicionarSerieAoExercicio(exTreino.idExercicio)} className={styles.botaoMaisMenos}>+</button><button onClick={() => handleRemoverSerieDoExercicio(exTreino.idExercicio)} className={styles.botaoMaisMenos} disabled={exTreino.series.length <= 1}>-</button><span>Séries</span></div> </div> <div className={styles.anotacoesExercicio}><label htmlFor={`anotacoes-${exTreino.idExercicio}`}>Anotações:</label><textarea id={`anotacoes-${exTreino.idExercicio}`} value={exTreino.anotacoes} onChange={(e) => handleAnotacoesChange(exTreino.idExercicio, e.target.value)} placeholder="Ex: Focar na descida..." rows="2" /></div> <button onClick={() => handleRemoverExercicioDoNovoTreino(exTreino.idExercicio)} className={styles.botaoRemoverDoTreino} title="Remover do treino atual">Remover</button> </li> ))} </ul>
             )}
          </div>
        </div>

        {/* Botão Salvar Treino */}
        <button onClick={handleSalvarNovoTreino} className={styles.botaoSalvarTreino} disabled={!nomeNovoTreino.trim() || exerciciosNovoTreino.length === 0 || savingTreino}>
          {savingTreino ? 'Salvando...' : `Salvar Treino "${nomeNovoTreino || 'Novo Treino'}"`}
        </button>
        {/* Mostra erro específico do salvamento de treino */}
        {errorTreinos && !loadingTreinos && <p className={styles.errorApi}>{errorTreinos}</p>}
      </section>

      {/* --- Seção Lista Treinos Montados --- */}
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