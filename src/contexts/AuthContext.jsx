// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Cria o Contexto
const AuthContext = createContext(null);

// 2. Cria o Provedor do Contexto
export function AuthProvider({ children }) {
  // Estado para armazenar os dados do usuário logado ({ id, username } ou null)
  const [user, setUser] = useState(null);
  // Estado para indicar se o carregamento inicial do usuário (do localStorage) terminou
  const [loading, setLoading] = useState(true);

  // Efeito para tentar carregar o usuário do localStorage na inicialização
  useEffect(() => {
    console.log("AuthProvider: Tentando carregar usuário do localStorage...");
    try {
      const storedUser = localStorage.getItem('gymProgressHub_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
         // Validação simples
         if (parsedUser && parsedUser.id && parsedUser.username) {
            setUser(parsedUser);
            console.log("AuthProvider: Usuário carregado do localStorage:", parsedUser);
         } else {
             console.warn("AuthProvider: Usuário inválido no localStorage, removendo.");
             localStorage.removeItem('gymProgressHub_user');
         }
      } else {
          console.log("AuthProvider: Nenhum usuário no localStorage.");
      }
    } catch (error) {
      console.error("AuthProvider: Erro ao carregar usuário do localStorage:", error);
      localStorage.removeItem('gymProgressHub_user'); // Remove dados corrompidos
    } finally {
        setLoading(false); // Finaliza o estado de carregamento inicial
         console.log("AuthProvider: Carregamento inicial finalizado.");
    }
  }, []); // Roda apenas uma vez na montagem inicial

  // Função para realizar o login
  // Recebe os dados do usuário retornados pela API
  const login = (userData) => {
     // Validação básica
     if (!userData || !userData.id || !userData.username) {
         console.error("AuthProvider: Tentativa de login com dados de usuário inválidos:", userData);
         return;
     }
    console.log("AuthProvider: Realizando login...", userData);
    setUser(userData); // Atualiza o estado local
    localStorage.setItem('gymProgressHub_user', JSON.stringify(userData)); // Salva no localStorage
  };

  // Função para realizar o logout
  const logout = () => {
    console.log("AuthProvider: Realizando logout...");
    setUser(null); // Remove do estado local
    localStorage.removeItem('gymProgressHub_user'); // Remove do localStorage
    // Opcional: Limpar outros dados relacionados ao usuário, como estado do treino atual
    localStorage.removeItem('gymProgressHub_treinoAtual_state');
    localStorage.removeItem('gymProgressHub_ultimoTreinoId');
    console.log("AuthProvider: Dados do usuário limpos do localStorage.");
  };

  // Monta o valor que será fornecido pelo contexto
  const value = {
    user,       // O objeto do usuário logado ({ id, username } ou null)
    isAuthenticated: !!user, // Booleano indicando se está autenticado
    isLoading: loading, // Indica se o estado inicial ainda está carregando
    login,      // Função para logar
    logout      // Função para deslogar
  };

  // Retorna o Provedor envolvendo os componentes filhos
  // Só renderiza os filhos DEPOIS que o carregamento inicial terminar (evita piscar)
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {loading && <div style={{textAlign: 'center', padding: '3rem', fontSize: '1.3em'}}>Verificando autenticação...</div>} {/* Feedback de carregamento */}
    </AuthContext.Provider>
  );
}

// 3. Cria um Hook customizado para usar o contexto mais facilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    // Isso geralmente acontece se você tentar usar useAuth fora de um AuthProvider
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}