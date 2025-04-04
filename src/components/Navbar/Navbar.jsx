// src/components/Navbar/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate
import { useAuth } from '../../contexts/AuthContext'; // Importa useAuth
import styles from './Navbar.module.css';

function Navbar() {
  // Pega o estado de autenticação e a função logout do contexto
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate(); // Hook para navegação

  const handleLogout = () => {
    console.log("Navbar: Chamando logout...");
    logout(); // Chama a função logout do AuthContext
    // Navega para a página de login após o logout
    navigate('/login');
  };

  // Se não estiver autenticado ou o usuário não estiver carregado, não renderiza nada
  // (Embora o App.jsx já controle isso, é uma segurança extra)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/dashboard">Gym Progress Hub 💪📊</Link>
      </div>
      <div className={styles.navLinksAndUser}> {/* Container para links e user/logout */}
        <ul className={styles.navList}>
          <li><Link to="/dashboard">Treino do Dia</Link></li>
          <li><Link to="/cadastro">Cadastrar Exercícios/Treinos</Link></li>
          <li><Link to="/progressao">Progressão</Link></li>
          {/* Remover ou adaptar link de usuários se não for mais usado */}
          {/* <li><Link to="/usuarios">Usuários</Link></li> */}
        </ul>
        <div className={styles.userInfo}>
           {/* Mostra o nome do usuário logado */}
           <span className={styles.welcomeMessage}>Olá, {user.username}!</span>
           {/* Botão de Logout */}
           <button onClick={handleLogout} className={styles.logoutButton}>
             Sair
           </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;