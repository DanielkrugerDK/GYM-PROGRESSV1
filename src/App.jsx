// src/App.jsx
import React from 'react';
// --- CORREÇÃO: Adiciona 'Link' à importação ---
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import CadastroExercicios from './pages/CadastroExercicios/CadastroExercicios';
import Progressao from './pages/Progressao/Progressao';
import Usuarios from './pages/Usuarios/Usuarios';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import { useAuth } from './contexts/AuthContext';
import './App.css';

// Componente wrapper para proteger rotas
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <main>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

          {/* Rotas Protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cadastro"
            element={
              <ProtectedRoute>
                <CadastroExercicios />
              </ProtectedRoute>
            }
          />
           <Route
            path="/progressao"
            element={
              <ProtectedRoute>
                <Progressao />
              </ProtectedRoute>
            }
          />
           <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <Usuarios />
              </ProtectedRoute>
            }
          />

          {/* Rota Curinga (Página Não Encontrada) */}
          <Route path="*" element={
             <div style={{textAlign: 'center', marginTop: '3rem'}}>
                <h1>404 - Página Não Encontrada</h1>
                {/* O Link usado aqui agora está importado */}
                <Link to={isAuthenticated ? "/dashboard" : "/login"}>Voltar</Link>
             </div>
          } />
        </Routes>
      </main>
    </>
  );
}

export default App;