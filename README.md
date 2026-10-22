# Maria — Catálogo Inteligente

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?logo=nginx&logoColor=white)

Plataforma **multi-tenant** de catálogo de produtos com agente de IA, construído com Node.js/Express/TypeScript,
MongoDB/Mongoose, React/TypeScript e *tool calling* da OpenAI.

Cada empresa tem o próprio catálogo e o próprio agente. O mesmo usuário pode participar de **várias empresas**,
com papel e situação independentes em cada uma.

## Arquitetura

| Camada | Tecnologia | Porta |
|---|---|---:|
| Backend | Node.js 24 + Express + TypeScript + Mongoose | 3000 |
| Frontend | React 18 + TypeScript + Vite + Lucide React | 80 |
| Proxy reverso | Nginx (Alpine) | 8080 |
| Banco de dados | MongoDB 8 | 27017 |

O Nginx expõe um único endereço para a aplicação em `http://localhost:8080`. As requisições em `/api/*` são
encaminhadas ao backend, enquanto as demais vão para o frontend. Internamente, o backend fala apenas com o
MongoDB pela rede interna do Compose.

```
Nginx (:8080)
├── /api/*  ──►  Backend Express (:3000)  ──►  MongoDB (:27017)
└── /*      ──►  Frontend Nginx + React estático (:80)
```

## Funcionalidades

- **Catálogo por empresa:** CRUD completo de produtos, sempre filtrado pelo `companyId` da identidade autenticada.
- **Agente de IA conversacional:** o usuário pergunta em linguagem natural sobre produtos, preços e categorias.
- **Usuário multi-empresa:** a associação entre usuário e empresa fica em `Participant`, que carrega o papel
  (`admin`/`user`) e a situação (`pending`/`activated`/`suspended`). O mesmo usuário pode participar de várias
  empresas com perfis diferentes.
- **Troca de empresa:** participantes de mais de uma empresa alternam entre elas no menu lateral; a troca emite
  um novo token com o `companyId` e o papel correspondentes.
- **Convite de usuários:** o admin informa **apenas o e-mail**. Nome e senha provisória só são pedidos quando o
  e-mail ainda não está cadastrado — caso contrário o usuário é vinculado como participante.
- **Notificações:** o convidado recebe um aviso no sino da interface; a leitura do convite ativa a participação.
- **Gestão de equipe:** listagem com situação, suspensão e reconvite de participantes.
- **Registro de acessos:** `first_login` (primeiro acesso) e `current_login` (último acesso), no formato
  `yyyy-mm-dd hh-mm-ss`.
- **Isolamento entre empresas (multi-tenant):** o `companyId` e o papel vêm sempre do token, nunca do corpo da
  requisição.
- **Interface responsiva** em português: login/registro, visão geral do catálogo, gestão de equipe, sino de
  notificações e chat.

### Situações do participante

| Situação | Significado |
|---|---|
| `pending` | Convidado, aguardando aceite ou primeiro acesso |
| `activated` | Participante ativo da empresa |
| `suspended` | Suspenso pela empresa |

A participação é ativada em dois momentos: no **primeiro login** do usuário e na **leitura da notificação de
convite**. Suspender e reconvidar são feitos em `PATCH /users/:participantId/status`.

### Contas de demonstração

Todas usam a senha `Demo1234!` após executar o seed.

| Empresa | Papel | E-mail |
|---|---|---|
| Empresa A | Administrador | `admin-a@example.com` |
| Empresa A | Usuário | `user-a@example.com` |
| Empresa B | Administrador | `admin-b@example.com` |
| Empresa B | Usuário | `user-b@example.com` |

`admin-a@example.com` participa das **duas** empresas, para demonstrar a troca de empresa no menu lateral.

## Estrutura do projeto

```text
catalog-ai/
├── backend/
│   ├── scripts/
│   │   ├── migrate.ts            # Migra o modelo antigo (companyId/role) para Participant
│   │   └── seed.ts               # Duas empresas, quatro usuários e dez produtos cada
│   ├── src/
│   │   ├── config/
│   │   │   ├── ai.ts             # Cliente OpenAI / OpenRouter e seleção de modelo
│   │   │   ├── db.ts             # Conexão com o MongoDB
│   │   │   └── env.ts            # Validação das variáveis de ambiente (Zod)
│   │   ├── middleware/
│   │   │   └── auth.ts           # requireAuth, requireCompany e requireAdmin
│   │   ├── models/
│   │   │   ├── Company.ts
│   │   │   ├── Notification.ts   # user_id, company_id, title, message, ready
│   │   │   ├── Participant.ts    # user_id, company_id, role, status
│   │   │   ├── Product.ts
│   │   │   └── User.ts           # name, email, passwordHash, first_login, current_login
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login, empresas e troca de empresa
│   │   │   ├── chat.ts
│   │   │   ├── health.ts
│   │   │   ├── notifications.ts
│   │   │   ├── products.ts
│   │   │   └── users.ts          # Convite, listagem e suspensão
│   │   ├── services/
│   │   │   ├── auth.ts           # Sessão, MEMBERSHIP e registro de acessos
│   │   │   ├── chat.ts           # Orquestração do tool calling
│   │   │   ├── notifications.ts
│   │   │   ├── participants.ts   # Participações do usuário e ativação
│   │   │   └── users.ts
│   │   ├── tools/
│   │   │   └── searchProducts.ts # Ferramenta de busca no catálogo da empresa
│   │   ├── utils/
│   │   │   └── datetime.ts       # Formatação yyyy-mm-dd hh-mm-ss
│   │   ├── server.ts
│   │   └── types.d.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/ChatPanel.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AuthScreen.tsx
│   │   │   │   ├── CompanySwitcher.tsx
│   │   │   │   ├── NoCompanyModal.tsx
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Topbar.tsx
│   │   │   ├── products/
│   │   │   │   ├── OverviewPage.tsx
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   └── ProductModal.tsx
│   │   │   ├── users/
│   │   │   │   ├── InviteUserModal.tsx
│   │   │   │   ├── SuspendUserModal.tsx
│   │   │   │   ├── UserRow.tsx
│   │   │   │   └── UsersPage.tsx
│   │   │   └── ErrorBanner.tsx
│   │   ├── lib/
│   │   │   ├── api.ts            # Cliente HTTP e persistência de sessão
│   │   │   └── notifications.ts
│   │   ├── pages/App.tsx         # Casca da aplicação e estado das abas
│   │   ├── styles.css
│   │   └── types.ts
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── default.conf               # Proxy reverso: /api/* para o backend
├── docker-compose.yml             # MongoDB, backend, frontend e nginx
├── Makefile                       # Atalhos de desenvolvimento
└── README.md
```

## Integração com I.A. (OpenAI e OpenRouter)

O chat usa *tool calling*: o modelo decide quando consultar o catálogo e o backend executa a busca. O
`companyId` **nunca** vem do modelo — ele é injetado pelo servidor a partir do token, de modo que o LLM não
consegue alcançar o catálogo de outra empresa.

O provedor é escolhido pela variável `AI_PROVIDER` em `backend/.env` (ou `.env.docker`):

```env
# PROVEDOR: openai ou openrouter
AI_PROVIDER=openrouter

# OPENAI
OPENAI_API_KEY=sua_chave_do_openai
OPENAI_MODEL=gpt-4.1-mini

# OPENROUTER
OPENROUTER_API_KEY=sk-or-v1-sua_chave
OPENROUTER_MODEL=minimax/minimax-m3.1-flash:free
```

| Provedor | Variáveis | Endpoint |
|---|---|---|
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` | `https://api.openai.com/v1` |
| `openrouter` | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | `https://openrouter.ai/api/v1` |

Ambos usam o SDK oficial `openai`. No modo OpenRouter, o SDK `openai` é apontado para o `baseURL` do
OpenRouter, o que dá acesso a modelos de terceiros com o mesmo formato de requisição.

### Fluxo de uma pergunta

1. `POST /chat` recebe a mensagem e extrai o `companyId` do token (`backend/src/routes/chat.ts`).
2. `backend/src/services/chat.ts` envia a pergunta ao modelo junto com a ferramenta `search_products`.
3. O modelo devolve uma chamada de ferramenta com o termo de busca.
4. `backend/src/tools/searchProducts.ts` consulta o catálogo **da empresa autenticada** e devolve os produtos.
5. O modelo formula a resposta final apenas com esses dados.

O prompt de sistema instrui o modelo a não inventar produtos, preços ou disponibilidade, e a tratar o conteúdo
do catálogo como dados — nunca como instruções.

> **Observação:** com `AI_PROVIDER` sem chave configurada, a API responde `503` e o chat exibe o aviso
> correspondente na interface.

## Como rodar

Pré-requisitos: **Docker** e **Docker Compose**.

```sh
cd rigatti-saas
make setup
# Editar .env.docker e backend/.env
make config
make up
make health
make seed
```

No navegador: [http://localhost:8080](http://localhost:8080)

| Passo | O que faz |
|---|---|
| `make setup` | Cria `.env.docker` a partir do `env.docker.example` |
| `make config` | Valida o `docker-compose.yml` |
| `make up` | Constrói as imagens e sobe os containers em segundo plano |
| `make health` | Consulta o endpoint de integridade da aplicação |
| `make seed` | Insere os dados de demonstração no MongoDB |

### Configuração das variáveis

| Arquivo | Variáveis |
|---|---|
| `.env.docker` | `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `JWT_SECRET`, `AI_PROVIDER`, chaves e modelos de IA |
| `backend/.env` | `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `AI_PROVIDER`, chaves e modelos de IA |

O `JWT_SECRET` precisa ter ao menos 32 caracteres. As chaves de IA são obrigatórias apenas para o chat; o resto
do catálogo funciona sem elas.

### Endereços

| Alvo | URL |
|---|---|
| Aplicação completa via Nginx | [http://localhost:8080](http://localhost:8080) |
| Integridade da aplicação | [http://localhost:8080/health](http://localhost:8080/health) |
| API (via Nginx) | [http://localhost:8080/api](http://localhost:8080/api) |

### Desenvolvimento local sem Docker

```sh
make install-local    # instala as dependências de backend e frontend
make dev-backend      # API em http://localhost:3001
make dev-frontend     # interface em http://localhost:5173
```

Nessa modalidade, o `backend/.env` aponta o `MONGODB_URI` para uma instância local do MongoDB.

### Migração de banco existente

Se o banco veio de uma versão anterior — em que o usuário tinha `companyId` e `role` próprios — a migração move
esse vínculo para um `Participant` `activated`:

```sh
make shell-backend
# dentro do container:
npm run migrate
```

## Makefile (outros comandos)

| Comando | Finalidade |
|---|---|
| `make logs` | Acompanhar os logs de todos os serviços |
| `make logs-backend` | Consultar logs do backend |
| `make logs-frontend` | Consultar logs do frontend |
| `make logs-nginx` | Consultar logs do proxy reverso |
| `make logs-mongodb` | Consultar logs do banco de dados |
| `make restart` | Reiniciar os containers |
| `make stop` | Parar os containers |
| `make down` | Parar e remover containers e redes, preservando o volume do banco |
| `make rebuild` | Reconstruir as imagens sem usar cache |
| `make test-http` | Verificar os endpoints HTTP |
| `make install-local` | Instalar dependências localmente, sem Docker |
| `make reset` | Apagar os containers e o volume de dados do MongoDB, após confirmação |
| `make ps` | Listar o estado dos containers |
| `make health` | Consultar o endpoint de integridade |
| `make seed` | Inserir os dados de demonstração |
| `make clean` | Remover containers e imagens, preservando o volume do banco |

`make reset` **apaga os dados**: ele remove o volume do MongoDB e exige a confirmação `yes` no terminal.

## API

### Autenticação e empresas

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/api/auth/register` | Cria uma empresa e seu primeiro administrador |
| `POST` | `/api/auth/login` | Autentica e devolve token + sessão |
| `GET` | `/api/auth/me` | Dados do usuário autenticado e suas empresas |
| `GET` | `/api/auth/companies` | Empresas do usuário com papel e situação |
| `POST` | `/api/auth/switch-company` | Troca a empresa ativa e renova o token |
| `POST` | `/api/auth/companies` | Cria uma empresa para o usuário autenticado |

### Usuários e notificações

| Método | Rota | Finalidade |
|---|---|---|
| `GET` | `/api/users` | Lista os participantes da empresa (admin) |
| `GET` | `/api/users/check-email` | Verifica se o e-mail já está cadastrado |
| `POST` | `/api/users/invite` | Convita um usuário (admin) |
| `PATCH` | `/api/users/:participantId/status` | Suspende ou reconvida (admin) |
| `GET` | `/api/notifications` | Lista as notificações do usuário |
| `PATCH` | `/api/notifications/:id/read` | Marca como lida e ativa a participação |
| `PATCH` | `/api/notifications/read-all` | Marca todas como lidas |

### Catálogo e chat

| Método | Rota | Finalidade |
|---|---|---|
| `GET` | `/api/products` | Lista os produtos da empresa |
| `POST` | `/api/products` | Cria um produto (admin) |
| `PATCH` | `/api/products/:id` | Altera um produto (admin) |
| `DELETE` | `/api/products/:id` | Remove um produto (admin) |
| `POST` | `/api/chat` | Pergunta ao agente de IA sobre o catálogo |
| `GET` | `/api/health` | Endpoint de integridade |

### Exemplo de convite

```sh
# 1. autentique-se como admin
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin-a@example.com","password":"Demo1234!"}' | jq -r .token)

# 2. convide um colaborador
curl -X POST http://localhost:8080/api/users/invite \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"maria.souza@empresa.com","name":"Maria Souza","password":"SenhaForte123"}'
```

Quando o e-mail **ainda não está cadastrado**, `name` e `password` são obrigatórios e o `User` é criado junto
com o `Participant` de situação `pending`. Quando o e-mail **já existe**, apenas o e-mail é enviado: o usuário é
vinculado por um novo `Participant` e recebe a notificação de convite.

| Cenário | Resultado |
|---|---|
| Admin da empresa A convida e-mail novo | `201`, `User` + `Participant` `pending` |
| Admin convida e-mail já cadastrado | `201`, novo `Participant` `pending` + notificação |
| Admin convida quem já participa da empresa | `409` este usuário já participa desta empresa |
| `user` tenta `POST /api/users/invite` | `403` permissão de administrador necessária |
| `user` tenta `GET /api/users` | `403` permissão de administrador necessária |
| Admin da empresa A lista usuários | Apenas participantes da empresa A |
| `user` da empresa A lista produtos | Apenas os 10 produtos da empresa A |

## Decisões arquiteturais

- **TypeScript no backend e frontend:** tipagem consistente entre camadas e melhor manutenção.
- **Separação por responsabilidade:** models, routes, middleware, services e tools não ficam concentrados em um
  único arquivo.
- **Participante como elo entre usuário e empresa:** `Participant` concentra papel e situação, permitindo que um
  mesmo usuário participe de várias empresas com perfis diferentes.
- **Tenant obtido do JWT:** o cliente não escolhe o `companyId` das consultas; o middleware valida a identidade e
  as operações consultam o tenant autenticado.
- **Autorização em três camadas:** `requireAuth` exige login, `requireCompany` exige empresa ativa no token e
  `requireAdmin` restringe operações de escrita.
- **Tool calling controlado pelo servidor:** o LLM escolhe a ferramenta e fornece apenas o termo de busca. O
  backend injeta o tenant autenticado ao executar a consulta.
- **Validação de entrada:** Zod valida os payloads de autenticação, chat, produtos e convites.
- **Convite restrito ao admin:** o cadastro de `user` acontece por `POST /users/invite`, protegido por
  `requireAdmin`. Não existe auto-cadastro público com escolha de perfil, o que impediria que qualquer visitante
  se tornasse admin. O `companyId` e o `role` são definidos pelo servidor, nunca pelo corpo da requisição.
- **E-mail único em toda a plataforma:** o login resolve a identidade pelo e-mail. Com o índice antigo
  (`companyId + email`), o mesmo e-mail podia existir em duas empresas e o `findOne` autenticar no tenant errado.
  Agora o índice é único por e-mail e o login valida a senha contra todos os candidatos antes de escolher.
- **Convite não concede acesso imediato:** a participação nasce `pending` e só vira `activated` no primeiro
  acesso ou na leitura da notificação, o que dá ao usuário a chance de recusar.
- **Frontend por painéis persistentes:** as abas ficam montadas e são ocultadas com `hidden`, preservando o
  histórico do chat; cada painel recarrega os próprios dados quando a empresa ativa muda.

## Antes de produção

- Adicionar testes unitários e de integração, especialmente tentativas de acesso cruzado entre tenants e bypass de roles.
- Rate limiting, logs estruturados, métricas, tracing, alertas e auditoria de operações.
- Refresh tokens ou sessões com estratégia de revogação, política de senha, recuperação de conta e proteção contra brute force.
- Paginação, limites de consulta, índices avaliados com explain e busca mais sofisticada no catálogo.
- Restrições de CORS por ambiente, gerenciamento de segredos, headers de segurança e sanitização/limites de entrada.
- Timeouts, retries limitados, tratamento de indisponibilidade e limites de custo para chamadas de LLM.
- Histórico persistente de conversas, streaming SSE, observabilidade das chamadas de IA e avaliação contra prompt injection.
- Pipeline CI e deploy automatizado.

## Observações

Este projeto está em desenvolvimento. As funcionalidades descritas acima foram implementadas e validadas
manualmente no ambiente local, mas ainda carecem de testes automatizados e de uma revisão de segurança antes de
serem consideradas prontas para produção.
