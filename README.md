# Gym Progress Hub 💪📊

## Descrição do Projeto 🚀

O **Gym Progress Hub** é uma aplicação web interativa projetada para simplificar e otimizar o acompanhamento da evolução nos treinos de academia. O sistema permite que usuários (após cadastro e login) registrem seus exercícios, montem treinos personalizados para diferentes dias ou focos, executem o treino do dia registrando cargas e séries concluídas, e visualizem o progresso de carga ao longo do tempo através de gráficos dinâmicos.

Construído com foco em uma experiência de usuário fluida e reativa, utilizando tecnologias modernas de frontend e um backend local simples para gerenciamento de dados.

## 🎬 Preview (Placeholder)

<p align="center">
  <video controls width="600" style="max-width: 100%;">
    <source src="/video/amostra.mp4" type="video/mp4">
    Seu navegador não suporta a tag de vídeo. Você pode baixar o vídeo <a href="/video/amostra.mp4">aqui</a>.
  </video>
</p>

## ✨ Funcionalidades Implementadas

*   **Autenticação de Usuários:**
    *   Cadastro de novos usuários.
    *   Login seguro (atualmente com senha em texto puro - **necessita hashing!**).
    *   Gerenciamento de sessão via Context API e LocalStorage.
    *   Rotas protegidas, acessíveis apenas após login.
*   **Gerenciamento de Exercícios:**
    *   Cadastro de novos exercícios (nome, grupo muscular opcional).
    *   Listagem de exercícios cadastrados.
    *   Remoção de exercícios.
    *   (Exercícios atualmente são globais, não específicos por usuário).
*   **Montagem de Treinos:**
    *   Criação de treinos personalizados com nome específico.
    *   Seleção de exercícios cadastrados para adicionar ao treino.
    *   Definição de número de séries e repetições para cada exercício no treino.
    *   Adição de anotações específicas por exercício dentro do treino.
    *   Listagem e remoção de treinos montados (específicos por usuário).
*   **Dashboard de Treino do Dia:**
    *   Seleção do treino a ser executado a partir da lista de treinos montados pelo usuário.
    *   Exibição clara dos exercícios e séries do treino selecionado.
    *   Input para registrar a carga (Kg) utilizada em cada série.
    *   Botão para marcar/desmarcar séries como concluídas (feedback visual com Framer Motion).
    *   Persistência do estado do treino em andamento (cargas/conclusões) no LocalStorage.
    *   Botão para resetar o progresso do treino atual (zerar cargas/conclusões).
*   **Registro de Histórico:**
    *   Salva automaticamente um registro detalhado no banco de dados via API cada vez que uma série é marcada como concluída com carga válida.
*   **Página de Progressão:**
    *   Exibe o histórico completo de séries concluídas em formato de tabela (mais recentes primeiro).
    *   Dropdown para selecionar um exercício específico.
    *   Gráfico dinâmico (Recharts) mostrando a evolução da carga utilizada para o exercício selecionado ao longo do tempo.
    *   Layout responsivo para tabela e gráfico.
*   **Interface e UX:**
    *   Navegação fluida entre páginas com React Router.
    *   Animações sutis em interações (botões, conclusão de séries) com Framer Motion.
    *   Estrutura de componentes organizada.
    *   Design responsivo básico (Navbar, Tabela de Progressão).

## 🛠️ Tecnologias Utilizadas

### Frontend Engine:

*   **React.js (v18+)**: Biblioteca principal para construção da interface de usuário declarativa e componentizada.
*   **Vite**: Ferramenta de build extremamente rápida para desenvolvimento e otimização de produção.
*   **JavaScript (ES6+)**: Linguagem base para toda a lógica do frontend.
*   **HTML5**: Estrutura semântica das páginas.
*   **CSS3 + CSS Modules**: Estilização escopada por componente, garantindo manutenibilidade e evitando conflitos.

### Bibliotecas Auxiliares (Frontend):

*   **React Router DOM (v6)**: Gerenciamento de rotas para a Single Page Application (SPA).
*   **Recharts**: Criação de gráficos de linhas interativos e customizáveis para visualização da progressão.
*   **Framer Motion**: Implementação de animações fluidas e declarativas para feedback visual e transições.
*   **Context API (React)**: Gerenciamento do estado global de autenticação do usuário.

### Backend Engine:

*   **Node.js**: Ambiente de execução para o servidor backend.
*   **Express.js**: Framework minimalista para construção da API RESTful.
*   **SQLite3**: Banco de dados relacional leve, baseado em arquivo (`gym_progress.db`), ideal para desenvolvimento local e deploy simples em VPS.
*   **CORS**: Middleware para habilitar requisições Cross-Origin entre o frontend e o backend durante o desenvolvimento.

## 📂 Estrutura do Projeto

```
gym-progress-hub/
├── backend/ # Código da API Node.js
│ ├── routes/ # Arquivos de definição de rotas (auth.js, exercises.js, etc.)
│ ├── database.js # Configuração e inicialização do SQLite
│ ├── gym_progress.db # Arquivo do banco de dados SQLite (criado na execução)
│ ├── server.js # Arquivo principal do servidor Express
│ └── package.json # Dependências e scripts do backend
│
├── public/ # Arquivos estáticos do frontend (servidos pelo Vite)
│
├── src/ # Código fonte do Frontend React
│ ├── assets/ # Imagens, fontes, etc.
│ ├── components/ # Componentes React reutilizáveis (Navbar, etc.)
│ ├── contexts/ # Contextos React (AuthContext.jsx)
│ ├── pages/ # Componentes principais de cada página (Dashboard, Progressao, etc.)
│ ├── App.jsx # Componente raiz da aplicação, define rotas principais
│ ├── main.jsx # Ponto de entrada da aplicação React (renderiza App)
│ ├── index.css # Estilos globais e reset
│ └── App.css # Estilos específicos do App (se houver)
│
├── .gitignore # Arquivos/pastas ignorados pelo Git
├── index.html # Arquivo HTML principal do frontend
├── package.json # Dependências e scripts do frontend
├── README.md # Este arquivo!
└── vite.config.js # Configurações do Vite
```


## ⚙️ Instalação e Configuração Local

Siga estes passos para configurar e rodar o projeto em sua máquina local:

**Pré-requisitos:**

*   **Node.js e npm:** Essenciais para rodar tanto o frontend quanto o backend. Baixe em [https://nodejs.org/](https://nodejs.org/). (Versão LTS recomendada).
*   **Git:** Necessário para clonar o repositório. Baixe em [https://git-scm.com/](https://git-scm.com/).
*   **(Opcional) Editor de Código:** Recomendo o **Visual Studio Code** ([https://code.visualstudio.com/](https://code.visualstudio.com/)).

**Passos:**

1.  **Clonar o Repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_GIT> gym-progress-hub
    cd gym-progress-hub
    ```

2.  **Instalar Dependências do Backend:**
    Navegue até a pasta do backend e instale as dependências listadas no `backend/package.json`.
    ```bash
    cd backend
    npm install
    ```
    Isso criará a pasta `backend/node_modules`.

3.  **Instalar Dependências do Frontend:**
    Volte para a pasta raiz do projeto e instale as dependências do frontend listadas no `package.json` principal.
    ```bash
    cd ..
    npm install
    ```
    Isso criará a pasta `node_modules` na raiz do projeto.

## ▶️ Rodando a Aplicação

É necessário rodar **ambos** os servidores (backend e frontend) simultaneamente em terminais separados.

1.  **Iniciar o Servidor Backend:**
    *   Abra um terminal na pasta `backend`.
    *   Execute o script de desenvolvimento:
        ```bash
        npm run dev
        ```
    *   Isso usará o `nodemon` para iniciar o servidor (geralmente em `http://localhost:3001`). O `nodemon` reiniciará o servidor automaticamente se você modificar arquivos do backend.
    *   Na primeira execução, ele também criará o arquivo de banco de dados `gym_progress.db` na pasta `backend`, se ele não existir.

2.  **Iniciar o Servidor Frontend:**
    *   Abra **outro** terminal na pasta **raiz** do projeto (`gym-progress-hub`).
    *   Execute o script de desenvolvimento do Vite:
        ```bash
        npm run dev
        ```
    *   Isso iniciará o servidor de desenvolvimento do frontend (geralmente em `http://localhost:5173`). O Vite mostrará a URL exata no terminal.

3.  **Acessar a Aplicação:**
    *   Abra seu navegador e acesse a URL fornecida pelo **servidor frontend** (normalmente `http://localhost:5173`).

## 🔌 Endpoints da API (Resumo)

O backend expõe os seguintes endpoints principais (prefixo `/api`):

*   `/auth/register` (POST): Registra um novo usuário.
*   `/auth/login` (POST): Autentica um usuário existente.
*   `/exercises` (GET): Retorna todos os exercícios globais.
*   `/exercises` (POST): Adiciona um novo exercício global.
*   `/exercises/:id` (DELETE): Remove um exercício global.
*   `/workouts/user/:userId` (GET): Retorna os treinos montados de um usuário específico.
*   `/workouts` (POST): Cria um novo treino montado para um usuário.
*   `/workouts/:id/user/:userId` (DELETE): Remove um treino montado de um usuário.
*   `/history/user/:userId` (GET): Retorna o histórico de séries concluídas de um usuário.
*   `/history` (POST): Adiciona um novo registro de série concluída ao histórico.

## 🤔 Decisões Técnicas e Justificativas

*   **React com Vite:** Escolhido pela excelente performance em desenvolvimento (HMR rápido) e build otimizado para produção, além da popularidade e vasto ecossistema do React.
*   **Node.js/Express para Backend:** Uma escolha pragmática para criar uma API RESTful simples rapidamente, sem a sobrecarga de frameworks mais complexos. Ideal para focar na integração frontend-backend.
*   **SQLite como Banco de Dados:** Perfeito para desenvolvimento local e cenários onde um banco de dados baseado em arquivo é suficiente. Elimina a necessidade de instalar e configurar um servidor de banco de dados separado. Facilita o deploy inicial em uma VPS junto com a API.
*   **Context API para Auth:** Uma solução nativa do React para gerenciar o estado global de autenticação, suficiente para a complexidade atual do projeto, evitando a necessidade de bibliotecas de gerenciamento de estado mais pesadas (como Redux) neste momento.
*   **Armazenamento Híbrido (Inicial):** Começamos com LocalStorage para persistência rápida no frontend (estado do treino atual, usuário logado) e migramos gradualmente os dados principais (exercícios, treinos, histórico) para o backend com API, demonstrando uma evolução comum em projetos web.
*   **Framer Motion e Recharts:** Bibliotecas específicas escolhidas pela facilidade de uso e qualidade dos resultados para animações e gráficos, respectivamente.

## 챌 Desafios e Soluções

Durante o desenvolvimento, alguns desafios foram encontrados e superados:

1.  **Gerenciamento de Estado Complexo:** Manter o estado do treino atualizado de forma imutável no Dashboard (cargas, conclusões) exigiu o uso cuidadoso de funções de atualização de estado e a técnica de mapeamento (`.map()`) para garantir novas referências.
2.  **Comunicação Backend-Frontend:** Configurar o `fetch`, tratar respostas da API, gerenciar estados de loading/erro e garantir que o CORS estivesse configurado corretamente no backend foram etapas importantes.
3.  **Consistência de Dados:** Garantir que os dados salvos pelo backend (ex: `exercise_id`) correspondessem aos esperados pelo frontend (`exerciseId`) exigiu depuração e padronização na função `formatarTreinoParaExecucao` e no processamento dos dados recebidos em `Progressao.jsx`.
4.  **Responsividade:** Adaptar layouts complexos como tabelas para telas menores exigiu técnicas específicas de CSS (transformar linhas em cards com `display: block` e pseudo-elementos `::before` para labels).
5.  **Lógica Assíncrona:** Lidar com a natureza assíncrona do `setState` e das chamadas API (especialmente em `handleToggleConcluirSerie`) exigiu atenção para garantir que os dados corretos fossem enviados ao backend após a atualização visual.

## 🔮 Próximos Passos e Melhorias Futuras

*   `[ ]` **Segurança de Senhas:** Implementar hashing de senhas no backend (com `bcrypt`) e ajustar as rotas de registro/login. **(Prioridade Alta!)**
*   `[ ]` **Autenticação via Token (JWT):** Substituir o envio inseguro de `userId` por um sistema de token JWT gerado no login e validado em cada requisição protegida no backend.
*   `[ ]` **Validação de Formulários:** Implementar validação mais robusta e com melhor feedback usando bibliotecas como `React Hook Form` + `Zod`.
*   `[ ]` **Melhorias de UI/UX:**
    *   Implementar modo Claro/Escuro completo.
    *   Adicionar toasts/notificações para feedback de sucesso/erro.
    *   Refinar animações e transições.
    *   Melhorar tratamento de estados de loading e erro.
*   `[ ]` **Funcionalidade de Edição:** Permitir editar exercícios e treinos montados.
*   `[ ]` **Filtros e Ordenação:** Adicionar opções de filtro/ordenação na página de Progressão.
*   `[ ]` **Página de Perfil:** Substituir a página `/usuarios` por um perfil onde o usuário possa (talvez) alterar sua senha.
*   `[ ]` **Testes:** Adicionar testes unitários e de integração.
*   `[ ]` **Deploy:** Preparar scripts e instruções para deploy em uma VPS (configurar PM2 ou similar para o backend, build de produção do frontend, configuração de servidor web como Nginx).

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
## 📧 Contato

Daniel Kruger Ferreira Cardoso  - nielkruger7@gmail - 66 996450738

