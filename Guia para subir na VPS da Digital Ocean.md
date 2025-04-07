# Guia de Deploy: Gym Progress Hub em VPS Debian 12 (DigitalOcean + Hostinger)

Este guia detalha os passos para fazer o deploy da aplicação Gym Progress Hub (Frontend React + Backend Node/Express/SQLite) em um Droplet Debian 12 na DigitalOcean, utilizando Nginx como servidor web e proxy reverso, PM2 para gerenciamento do processo Node.js, e configurando um domínio adquirido na Hostinger com HTTPS via Let's Encrypt.

## Pré-requisitos

*   Conta na [DigitalOcean](https://www.digitalocean.com/).
*   Um domínio registrado (ex: na [Hostinger](https://www.hostinger.com/)).
*   Acesso SSH à sua máquina local (terminal Linux/macOS ou um cliente como PuTTY no Windows).
*   Git instalado localmente.
*   Node.js e npm instalados localmente (para build local, se necessário).
*   Código-fonte do projeto Gym Progress Hub disponível (ex: em um repositório Git).

## Passo 1: Preparação da VPS (DigitalOcean)

1.  **Criar Droplet:**
    *   DigitalOcean -> Create -> Droplets.
    *   **Imagem:** Debian 12.x.
    *   **Plano:** Basic (ex: 1GB RAM / 1 vCPU - **Atenção:** Build pode exigir mais RAM, veja Passo 5.2).
    *   **Região:** Escolha a mais próxima.
    *   **Autenticação:** **Recomendado: Chave SSH**. Alternativa: Senha forte.
    *   Crie o Droplet e anote o **IP Público**.

2.  **Acesso Inicial e Usuário Sudo:**
    *   Conecte via SSH como `root`: `ssh root@SEU_IP_VPS`
    *   Crie um usuário não-root: `adduser nome_do_usuario` (siga as instruções).
    *   Adicione ao grupo sudo: `usermod -aG sudo nome_do_usuario`
    *   Desconecte (`exit`) e reconecte como o novo usuário: `ssh nome_do_usuario@SEU_IP_VPS`
    *   *Use `sudo` para comandos administrativos daqui em diante.*

3.  **Firewall Básico (UFW):**
    ```bash
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full' # Permite HTTP (80) e HTTPS (443)
    sudo ufw enable # Confirme com 'y'
    sudo ufw status # Verifique as regras
    ```

## Passo 2: Instalação de Software Essencial

1.  **Atualizar Sistema:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Instalar Node.js (via NVM):**
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # Recarregue o shell ou execute as linhas export/source mostradas pelo script
    export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"; [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    nvm install --lts # Instala a versão LTS mais recente
    node -v && npm -v # Verifica a instalação
    ```

3.  **Instalar Nginx:**
    ```bash
    sudo apt install nginx -y
    ```

4.  **Instalar PM2:**
    ```bash
    sudo npm install pm2 -g
    ```

5.  **Instalar Certbot (para SSL):**
    ```bash
    sudo apt install python3-certbot-nginx -y
    ```

## Passo 3: Configuração do Domínio (Hostinger)

1.  **Obtenha o IP da VPS:** Copie o IP público do seu Droplet na DigitalOcean.
2.  **Acesse o Painel DNS Hostinger:** Vá para a gestão de DNS do seu domínio.
3.  **Crie/Edite Registros A:**
    *   **Tipo `A`:**
        *   **Host:** `@` (para `seudominio.com`)
        *   **Valor:** `SEU_IP_VPS`
        *   **TTL:** Padrão
    *   **Tipo `A` (Opcional, recomendado):**
        *   **Host:** `www` (para `www.seudominio.com`)
        *   **Valor:** `SEU_IP_VPS`
        *   **TTL:** Padrão
4.  **Salve e Aguarde Propagação:** Pode levar de minutos a horas. Verifique com [https://dnschecker.org/](https://dnschecker.org/).

## Passo 4: Deploy do Código da Aplicação

1.  **Conecte-se à VPS** com seu usuário `sudo`.
2.  **Clone seu repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_GIT> gym-progress-hub # Ou o nome da sua pasta
    cd gym-progress-hub
    ```
3.  **Instale Dependências do Backend:**
    ```bash
    cd backend
    npm install
    cd ..
    ```
4.  **Instale Dependências do Frontend:**
    ```bash
    npm install
    ```

## Passo 5: Build do Frontend (Atenção à Memória!)

1.  **Configure Variáveis de Ambiente:**
    *   Certifique-se que os arquivos `.env.development` e `.env.production` existem na **raiz do projeto frontend** (`gym-progress-hub/`).
    *   **`.env.development`:** `VITE_API_BASE_URL=http://localhost:3001/api`
    *   **`.env.production`:** `VITE_API_BASE_URL=/api`
    *   Verifique se todos os arquivos `.jsx` que usam `fetch` definem `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';`.

2.  **Execute o Build:** (Na pasta raiz `gym-progress-hub`)
    ```bash
    npm run build
    ```
3.  **🚨 PROBLEMA COMUM: Erro "Killed" 🚨**
    *   **Causa:** Falta de memória RAM na VPS durante o build.
    *   **Solução Principal (Adicionar Swap):**
        ```bash
        # Verifique se já existe: sudo swapon --show
        # Crie swap (ex: 1GB): sudo fallocate -l 1G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        # Torne permanente: Adicione '/swapfile none swap sw 0 0' em /etc/fstab
        sudo nano /etc/fstab
        # (Opcional) Ajuste swappiness/cache pressure
        # sudo sysctl vm.swappiness=10 && sudo sysctl vm.vfs_cache_pressure=50
        # echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
        # echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf
        ```
        *   Após adicionar swap, **tente `npm run build` novamente.**
    *   **Solução Alternativa:** Rode `npm run build` na sua máquina local e copie a pasta `dist` resultante para a VPS (`/home/nome_do_usuario/gym-progress-hub/`) usando `scp` ou SFTP.

4.  **Verifique a Pasta `dist`:** Após o build **bem-sucedido**, verifique se a pasta `dist` foi criada e contém `index.html` e a pasta `assets`.
    ```bash
    ls -l dist
    ```

## Passo 6: Configuração do Backend (PM2)

1.  **Inicie a API com PM2:** (Na pasta raiz `gym-progress-hub`)
    ```bash
    pm2 start backend/server.js --name gym-hub-api
    ```
2.  **Verifique o Status:**
    ```bash
    pm2 list
    ```
    *(Deve mostrar `gym-hub-api` como `online`. Se `errored`, verifique logs: `pm2 logs gym-hub-api`)*.
3.  **Configure Autostart e Salve:**
    ```bash
    pm2 startup systemd
    # Copie e execute o comando 'sudo env ...' mostrado
    pm2 save
    ```

## Passo 7: Configuração do Nginx (Servir Frontend + Proxy Backend)

1.  **Ajuste Permissões:** O Nginx (usuário `www-data`) precisa acessar a pasta `dist`.
    ```bash
    # Permite navegação nas pastas pai
    chmod 711 /home/nome_do_usuario
    chmod 711 /home/nome_do_usuario/gym-progress-hub # Ou o nome da sua pasta

    # Define dono/grupo e permissões para a pasta dist
    sudo chown -R nome_do_usuario:www-data dist/
    sudo chmod -R 755 dist/
    ```

2.  **Crie/Edite o Bloco de Servidor Nginx:**
    ```bash
    sudo nano /etc/nginx/sites-available/seudominio.com # Use seu domínio
    ```
    *   Cole a seguinte configuração, **ajustando** `root` e `server_name`:

    ```nginx
    server {
        listen 80;
        listen [::]:80;

        # Caminho para os arquivos buildados do frontend
        root /home/nome_do_usuario/gym-progress-hub/dist; # <-- AJUSTE AQUI
        index index.html;

        # Seu domínio(s)
        server_name seudominio.com www.seudominio.com; # <-- AJUSTE AQUI

        location / {
            # Essencial para SPAs (React Router)
            try_files $uri $uri/ /index.html;
        }

        # Proxy reverso para a API backend na porta 3001
        location /api/ {
            proxy_pass http://localhost:3001; # <-- Porta do seu backend PM2
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Diretivas SSL serão adicionadas pelo Certbot
    }
    ```
    *   Salve e feche (`Ctrl+X`, `Y`, `Enter`).

3.  **Habilite o Site e Teste a Configuração:**
    ```bash
    # Cria link simbólico (remova o default se existir: sudo rm /etc/nginx/sites-enabled/default)
    sudo ln -s /etc/nginx/sites-available/seudominio.com /etc/nginx/sites-enabled/
    # Testa a sintaxe
    sudo nginx -t
    # Recarrega ou Reinicia o Nginx
    sudo systemctl reload nginx
    # Ou (mais forte): sudo systemctl restart nginx
    ```
4.  **🚨 PROBLEMA COMUM: Erro 500/403/Página Branca 🚨**
    *   **Causas:** Permissões incorretas na pasta `dist` ou pastas pai (erro `Permission Denied` nos logs do Nginx), `index.html` faltando na `dist` (erro `directory index forbidden`), erro na diretiva `proxy_pass` (verifique porta e URL), backend PM2 não rodando (`pm2 list`, `pm2 logs`).
    *   **Verificação:** Cheque os logs de erro do Nginx (`sudo tail -n 50 /var/log/nginx/error.log`) e os logs do PM2 (`pm2 logs gym-hub-api`). Teste o acesso direto ao backend dentro da VPS (`curl http://localhost:3001/api/test`).

## Passo 8: Configuração do HTTPS (Let's Encrypt)

1.  **Execute o Certbot:** (Certifique-se que o DNS está propagado!)
    ```bash
    sudo certbot --nginx -d seudominio.com -d www.seudominio.com # <-- AJUSTE OS DOMÍNIOS
    ```
2.  **Siga as Instruções:**
    *   Forneça seu email.
    *   Aceite os Termos (`A`).
    *   Escolha se quer compartilhar email (`Y/N`).
    *   **IMPORTANTE:** Escolha a opção para **redirecionar** tráfego HTTP para HTTPS (geralmente opção `2`).
3.  **Verifique:** O Certbot deve confirmar o sucesso e a configuração da renovação automática. Teste a renovação: `sudo certbot renew --dry-run`.

## Passo 9: Verificação Final

1.  **Limpe o Cache do Navegador.**
2.  Acesse `https://seudominio.com`.
3.  Verifique o cadeado HTTPS.
4.  Teste **todas** as funcionalidades da aplicação: Cadastro, Login, Adicionar Exercício, Montar Treino, Selecionar Treino no Dashboard, Registrar Carga, Concluir Séries, Ver Progressão (Tabela e Gráfico), Logout.
5.  Monitore os logs do Nginx e PM2 se encontrar problemas.

## Manutenção e Próximos Passos

*   **Segurança:** Implemente hashing de senhas (bcrypt) e autenticação JWT no backend.
*   **Backups:** Faça backup regularmente do arquivo `backend/gym_progress.db`.
*   **Atualizações:** Mantenha o sistema (Debian), Node.js, Nginx e outras dependências atualizadas (`sudo apt update && sudo apt upgrade`, `nvm install --lts`, `npm update`).
*   **Monitoramento:** Considere configurar monitoramento básico para a VPS e a aplicação.

---

Este guia deve cobrir todo o processo e os principais pontos de atenção que encontramos. Lembre-se de adaptar nomes de usuário, domínios e caminhos conforme sua configuração específica. Boa sorte!
