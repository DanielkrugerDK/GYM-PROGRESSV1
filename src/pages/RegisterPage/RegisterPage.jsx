// src/pages/RegisterPage/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importa Link e useNavigate
import styles from './RegisterPage.module.css'; // Criaremos este CSS

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Estado para mensagens de erro da API
  const [success, setSuccess] = useState(''); // Estado para mensagens de sucesso
  const [loading, setLoading] = useState(false); // Estado para indicar carregamento
  const navigate = useNavigate(); // Hook para navegação programática

  const handleSubmit = async (event) => {
    event.preventDefault(); // Previne recarregamento da página
    setError(''); // Limpa erros anteriores
    setSuccess(''); // Limpa sucesso anterior
    setLoading(true); // Inicia carregamento

    // Validação simples no frontend (pode ser melhorada)
    if (password.length < 4) {
        setError('A senha deve ter pelo menos 4 caracteres.');
        setLoading(false);
        return;
    }

    try {
      // Faz a requisição POST para o endpoint de registro no backend
      const response = await fetch('http://localhost:3001/api/auth/register', { // URL do backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }), // Envia os dados como JSON
      });

      const data = await response.json(); // Parseia a resposta JSON

      if (!response.ok) {
        // Se a resposta não for OK (ex: 400, 409, 500), lança um erro com a mensagem da API
        throw new Error(data.error || `Erro ${response.status}`);
      }

      // Se chegou aqui, o registro foi bem-sucedido
      setSuccess('Usuário registrado com sucesso! Você será redirecionado para o login.');
      console.log('Registro bem-sucedido:', data);

      // Limpa o formulário (opcional)
      setUsername('');
      setPassword('');

      // Redireciona para a página de login após um pequeno atraso
      setTimeout(() => {
        navigate('/login'); // Navega para /login
      }, 2000); // Atraso de 2 segundos

    } catch (err) {
      // Captura erros da requisição ou lançados acima
      console.error('Erro no registro:', err);
      setError(err.message || 'Ocorreu um erro ao tentar registrar.');
    } finally {
       setLoading(false); // Finaliza o carregamento, independentemente do resultado
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Criar Conta</h2>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <div className={styles.formGroup}>
          <label htmlFor="username">Nome de Usuário:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading} // Desabilita durante o carregamento
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
            minLength="4" // Validação HTML básica
            disabled={loading}
          />
        </div>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar'}
        </button>

        <p className={styles.loginLink}>
          Já tem uma conta? <Link to="/login">Faça Login</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;