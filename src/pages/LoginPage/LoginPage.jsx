// src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Importa o hook useAuth
import styles from './LoginPage.module.css'; // Usaremos o mesmo CSS do Register (ou um novo)

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // Pega a função login do contexto
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', { // URL do backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}`);
      }

      // Se login OK, chama a função login do AuthContext
      login(data.user); // Passa os dados do usuário ({ id, username })

      console.log('Login bem-sucedido:', data.user);

      // Redireciona para o Dashboard (ou outra página principal)
      navigate('/dashboard'); // Ou para '/' se preferir

    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.message || 'Ocorreu um erro ao tentar fazer login.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Login</h2>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.formGroup}>
          <label htmlFor="username">Nome de Usuário:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">Senha:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className={styles.submitButton} disabled={loading}>
           {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className={styles.registerLink}>
          Não tem uma conta? <Link to="/register">Registre-se</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;