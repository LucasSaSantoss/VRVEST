````md
# VRVEST — Deploy com Docker

Este documento descreve o processo de instalação, configuração, execução e atualização do projeto **VRVEST** em ambiente Docker.

## Estrutura do projeto

O projeto mantém a estrutura original do repositório:

```txt
/opt/docker-stack/projects/vrvest/
├── API/                    # Backend Node.js / Express / Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── src/                    # Frontend React
├── public/
├── package.json
├── .env
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── .dockerignore
└── mysql/
    └── data/               # Dados persistentes do MySQL
```

---

# 1. Instalação inicial

## 1.1. Criar pasta do projeto

```bash
sudo mkdir -p /opt/docker-stack/projects
sudo chown -R $USER:$USER /opt/docker-stack/projects
cd /opt/docker-stack/projects
```

## 1.2. Clonar o repositório

```bash
git clone git@github.com:LucasSaSantoss/VRVEST.git vrvest
cd vrvest
```

Caso precise mudar para o branch correto:

```bash
git branch
git checkout chore/prisma-seed-and-maintenance-docs
```

---

# 2. Arquivos de ambiente

O projeto usa dois arquivos `.env`:

```txt
.env        # usado pelo frontend React/Vite
API/.env    # usado pelo backend Node/Prisma
```

---

## 2.1. `.env` da raiz

Arquivo:

```bash
nano .env
```

Conteúdo:

```env
VITE_API_URL=http://IP_DA_VM:3001/api
```

Exemplo:

```env
VITE_API_URL=http://10.30.200.26:3001/api
```

> Importante: essa variável é usada no momento do build do frontend. Sempre que ela for alterada, será necessário rebuildar o frontend.

---

## 2.2. `API/.env`

Arquivo:

```bash
nano API/.env
```

Conteúdo base:

```env
DATABASE_URL="mysql://vrvest_user:vrvest_password@mysql:3306/vrvest"

JWT_SECRET=troque_essa_chave_por_uma_chave_forte

EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=usuario_mailtrap
EMAIL_PASS=senha_mailtrap
EMAIL_COPIADO=teste@teste.com

SEED_USER_NAME=Administrador
SEED_USER_EMAIL=admin@vrvest.local
SEED_USER_PASSWORD=12345678
SEED_USER_SECTOR=TI
SEED_USER_POSITION="Administrador do Sistema"
SEED_USER_LEVEL=4
SEED_USER_ACTIVE=1
```

> Dentro do Docker, o backend acessa o MySQL usando o host `mysql`, que é o nome do serviço no `docker-compose.yml`.

---

# 3. Arquivos Docker

## 3.1. `docker-compose.yml`

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: vrvest-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: vrvest
      MYSQL_USER: vrvest_user
      MYSQL_PASSWORD: vrvest_password
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - ./mysql/data:/var/lib/mysql
    ports:
      - "3307:3306"
    networks:
      - vrvest

  backend:
    build:
      context: ./API
      dockerfile: ../Dockerfile.backend
    container_name: vrvest-backend
    restart: unless-stopped
    depends_on:
      - mysql
    env_file:
      - ./API/.env
    ports:
      - "3001:3000"
    networks:
      - vrvest

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_URL: ${VITE_API_URL}
    container_name: vrvest-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "8082:80"
    networks:
      - vrvest

networks:
  vrvest:
    driver: bridge
```

---

## 3.2. `Dockerfile.backend`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install react-router-dom react react-dom

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "server.js"]
```

> Observação: a instalação de `react-router-dom`, `react` e `react-dom` no backend foi mantida porque existe um import dessas dependências dentro da API. O ideal futuramente seria corrigir isso no código, mas neste deploy foi preservada a estrutura original do projeto.

---

## 3.3. `Dockerfile.frontend`

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
```

---

## 3.4. `nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 3.5. `.dockerignore`

```gitignore
node_modules
API/node_modules
dist
.git
mysql
.env
.DS_Store
npm-debug.log
```

> Mesmo com `.env` ignorado no build, a variável `VITE_API_URL` é passada para o frontend através de `build.args` no `docker-compose.yml`.

---

## 3.6. `.gitignore`

Garanta que existam estas entradas:

```gitignore
.env
API/.env
mysql/
node_modules/
API/node_modules/
dist/
```

---

# 4. Subir o ambiente

## 4.1. Criar pasta persistente do MySQL

```bash
mkdir -p mysql/data
```

## 4.2. Buildar e subir os containers

```bash
docker compose up -d --build
```

## 4.3. Verificar containers

```bash
docker compose ps
```

Resultado esperado:

```txt
vrvest-backend    Up    0.0.0.0:3001->3000/tcp
vrvest-frontend   Up    0.0.0.0:8082->80/tcp
vrvest-mysql      Up    0.0.0.0:3307->3306/tcp
```

---

# 5. Criar tabelas do banco

O projeto não possui migrations versionadas. As tabelas são criadas a partir do `schema.prisma`.

## 5.1. Parar temporariamente o backend

```bash
docker compose stop backend
```

## 5.2. Criar/atualizar estrutura do banco

```bash
docker compose run --rm backend npx prisma db push
```

Resultado esperado:

```txt
Your database is now in sync with your Prisma schema.
Generated Prisma Client
```

---

# 6. Executar seed inicial

```bash
docker compose run --rm backend npm run seed
```

Resultado esperado:

```txt
Seed concluído com sucesso.
Usuário pronto para login: admin@vrvest.local
```

Usuário inicial, conforme `API/.env`:

```txt
E-mail: admin@vrvest.local
Senha: 12345678
```

---

# 7. Subir backend novamente

```bash
docker compose up -d backend
```

Verificar:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs --tail=40 backend
```

Resultado esperado:

```txt
Server rodando na porta 3000
```

---

# 8. Acessar sistema

Frontend:

```txt
http://IP_DA_VM:8082
```

Exemplo:

```txt
http://10.30.200.26:8082
```

API:

```txt
http://IP_DA_VM:3001/api
```

Exemplo:

```txt
http://10.30.200.26:3001/api
```

---

# 9. Comandos úteis

## Ver containers

```bash
docker compose ps
```

## Ver logs do backend

```bash
docker compose logs -f backend
```

## Ver logs do frontend

```bash
docker compose logs -f frontend
```

## Ver logs do MySQL

```bash
docker compose logs -f mysql
```

## Parar todos os containers

```bash
docker compose down
```

## Subir containers

```bash
docker compose up -d
```

## Rebuild completo

```bash
docker compose up -d --build
```

## Rebuild somente do backend

```bash
docker compose up -d --build backend
```

## Rebuild somente do frontend

```bash
docker compose up -d --build frontend
```

## Rebuild sem cache do backend

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

## Rebuild sem cache do frontend

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

---

# 10. Entrar nos containers

## Backend

```bash
docker exec -it vrvest-backend sh
```

## MySQL

```bash
docker exec -it vrvest-mysql mysql -u vrvest_user -p vrvest
```

Senha:

```txt
vrvest_password
```

Dentro do MySQL:

```sql
SHOW TABLES;
```

Para sair:

```sql
exit;
```

---

# 11. Atualização do sistema

## 11.1. Entrar na pasta do projeto

```bash
cd /opt/docker-stack/projects/vrvest
```

## 11.2. Baixar alterações do Git

```bash
git status
git pull
```

Se precisar garantir o branch correto:

```bash
git branch
git checkout chore/prisma-seed-and-maintenance-docs
git pull
```

## 11.3. Rebuildar containers

Para atualização geral:

```bash
docker compose up -d --build
```

Se houve alteração no `API/package.json`, `schema.prisma`, backend ou dependências:

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

Se houve alteração no `.env` da raiz, `src/`, frontend ou `VITE_API_URL`:

```bash
docker compose up -d --build frontend
```

## 11.4. Atualizar estrutura do banco, se necessário

Caso o `schema.prisma` tenha sido alterado:

```bash
docker compose stop backend
docker compose run --rm backend npx prisma db push
docker compose up -d backend
```

## 11.5. Verificar logs

```bash
docker compose logs --tail=40 backend
```

Resultado esperado:

```txt
Server rodando na porta 3000
```

---

# 12. Problemas comuns

## Backend reiniciando constantemente

Verificar logs:

```bash
docker compose logs -f backend
```

Possíveis causas:

- tabela não criada no MySQL;
- erro no `DATABASE_URL`;
- dependência ausente;
- erro em import do Node;
- Prisma Client não gerado.

---

## Erro: table `Employee` does not exist

Executar:

```bash
docker compose stop backend
docker compose run --rm backend npx prisma db push
docker compose up -d backend
```

---

## Erro 405 ao tentar login

Verificar logs do frontend:

```bash
docker compose logs --tail=40 frontend
```

Se aparecer algo como:

```txt
POST /undefined/login HTTP/1.1" 405
```

significa que o frontend foi buildado sem a variável `VITE_API_URL`.

Conferir `.env` da raiz:

```bash
cat .env
```

Deve conter:

```env
VITE_API_URL=http://IP_DA_VM:3001/api
```

Depois rebuildar o frontend:

```bash
docker compose up -d --build frontend
```

---

## Frontend abre, mas não comunica com API

Verificar se o backend está de pé:

```bash
docker compose ps
```

Verificar logs:

```bash
docker compose logs --tail=40 backend
```

Verificar se o `.env` da raiz aponta para a API correta:

```bash
cat .env
```

Exemplo correto:

```env
VITE_API_URL=http://10.30.200.26:3001/api
```

---

## Prisma seed não aparece no container

Se `npm run` não mostrar o script `seed`, mas o `API/package.json` no disco tiver o script, pode ser cache da imagem.

Executar:

```bash
docker compose build --no-cache backend
docker compose run --rm backend npm run
```

Depois executar:

```bash
docker compose run --rm backend npm run seed
```

---

# 13. Checklist rápido de instalação

```bash
cd /opt/docker-stack/projects
git clone git@github.com:LucasSaSantoss/VRVEST.git vrvest
cd vrvest

nano .env
nano API/.env

mkdir -p mysql/data

docker compose up -d --build

docker compose stop backend
docker compose run --rm backend npx prisma db push
docker compose run --rm backend npm run seed
docker compose up -d backend

docker compose ps
docker compose logs --tail=40 backend
```

---

# 14. Checklist rápido de atualização

```bash
cd /opt/docker-stack/projects/vrvest

git status
git pull

docker compose up -d --build

docker compose logs --tail=40 backend
docker compose ps
```

Se houver alteração no `schema.prisma`:

```bash
docker compose stop backend
docker compose run --rm backend npx prisma db push
docker compose up -d backend
```

---

# 15. Fase 1 técnica (Uniformes + Estoque) — atualização Docker e Local

Esta seção cobre as mudanças da Fase 1 técnica:

- novas tabelas Prisma para uniformes e estoque por tamanho;
- novas rotas:
  - `/api/uniforms/*`
  - `/api/uniform-stock/*`

## 15.1 Atualização em Docker

1. Atualizar branch/código:

```bash
cd /opt/docker-stack/projects/vrvest
git checkout chore/prisma-seed-and-maintenance-docs
git pull
```

2. Rebuild do backend (necessário por mudança de código e Prisma):

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

3. Aplicar schema novo:

```bash
docker compose stop backend
docker compose run --rm backend npx prisma db push
docker compose up -d backend
```

4. Validar geração do client Prisma no container:

```bash
docker compose run --rm backend npx prisma generate
```

5. Verificar logs:

```bash
docker compose logs --tail=80 backend
```

## 15.2 Atualização em ambiente local (sem Docker)

1. Atualizar branch/código:

```bash
git checkout chore/prisma-seed-and-maintenance-docs
git pull
```

2. Instalar dependências do backend:

```bash
cd API
npm install
```

3. Aplicar schema novo no banco local:

```bash
npx prisma generate
npx prisma db push
```

4. Subir backend:

```bash
npm run dev
```

5. Em outro terminal, subir frontend:

```bash
cd ..
npm install
npm run dev
```

## 15.3 Smoke test mínimo da Fase 1

1. Confirmar backend no ar (`/api/login` e rotas legadas).
2. Confirmar novas rotas respondendo com token válido:
   - `GET /api/uniform-stock/sizes`
   - `GET /api/uniforms/withdrawals`
3. Confirmar que fluxo legado de pijama continua funcionando.
````

Esse material já está bem pronto para virar um `DEPLOY.md` ou `docs/deploy-docker.md`.
