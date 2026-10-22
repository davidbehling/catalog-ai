# Maria Mini SaaS — desafio técnico

MVP multi-tenant para catálogo de produtos e chat com agente de IA, iniciado com Node.js/Express/TypeScript, MongoDB/Mongoose, React/TypeScript e OpenAI tool calling.

## O que já está implementado
- Modelos de empresa, usuário, produto, participante e notificação.
- Registro (cria uma empresa e seu primeiro admin) e login com JWT.
- **Usuário multi-empresa:** a associação entre usuário e empresa fica em `Participant`, que carrega o papel (`admin`/`user`) e a situação (`pending`/`activated`/`suspended`).
- Registro de acessos: `first_login` (primeiro acesso) e `current_login` (último acesso), no formato `yyyy-mm-dd hh-mm-ss`.
- Convite de usuários: o admin informa apenas o e-mail; nome e senha provisória só são pedidos quando o e-mail ainda não está cadastrado.
- Notificações: o convidado recebe um aviso no sino da interface; a leitura do convite ativa a participação.
- Troca de empresa para usuários que participam de mais de uma.
- Suspensão e reconvite de participantes.
- Middleware de autenticação, de empresa ativa e de permissão de administrador.
- CRUD de produtos sempre filtrado pelo `companyId` da identidade autenticada.
- Endpoint `POST /chat` com tool calling; o `companyId` vem do token no servidor e nunca dos argumentos do modelo.
- Seed de duas empresas, dois usuários por empresa e dez produtos por empresa.
- Interface responsiva com login/registro, dashboard de produtos, CRUD para admin, gestão de equipe, sino de notificações e chat.

## Pré-requisitos
- Node.js 20+
- MongoDB local ou Atlas
- Chave de API OpenAI para usar o chat

## Configuração

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edite .env e configure JWT_SECRET, MONGODB_URI e OPENAI_API_KEY
npm install
npm run seed
npm run dev
```

`JWT_SECRET` precisa ter pelo menos 32 caracteres. A API inicia em `http://localhost:3001`; verifique `/health`.

Se você já tem dados de uma versão anterior (usuário com `companyId` e `role` próprios), rode a
migração antes do seed:

```bash
npm run migrate
```

Ela move o papel e a empresa de cada usuário para um `Participant` `activated` e remove `companyId` e
`role` do documento do usuário.

### 2. Frontend
Em outro terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Abra `http://localhost:5173`.

## Contas de demonstração
Todas usam a senha `Demo1234!` após executar o seed.

| Empresa | Papel | E-mail |
|---|---|---|
| Empresa A | Admin | `admin-a@example.com` |
| Empresa A | User | `user-a@example.com` |
| Empresa B | Admin | `admin-b@example.com` |
| Empresa B | User | `user-b@example.com` |

`admin-a@example.com` participa das **duas** empresas, para demonstrar a troca de empresa no menu lateral.

## Convite de usuários

O registro público (`POST /auth/register`) cria uma **empresa nova** e o seu primeiro **admin**.
Usuários com perfil `user` são convidados pelo admin, dentro da própria empresa:

```bash
# 1. autentique-se como admin
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin-a@example.com","password":"Demo1234!"}' | jq -r .token)

# 2. convide um colaborador
curl -X POST http://localhost:3001/users/invite \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"maria.souza@empresa.com","name":"Maria Souza","password":"SenhaForte123"}'
```

Quando o e-mail **ainda não está cadastrado**, `name` e `password` são obrigatórios e o `User` é
criado junto com o `Participant` de situação `pending`. Quando o e-mail **já existe**, apenas o e-mail
é enviado: o usuário é vinculado por um novo `Participant` e recebe uma notificação de convite.

Verifique se o e-mail já existe com `GET /users/check-email?email=...`.

O `companyId` e o `role` não são aceitos no corpo da requisição: o tenant vem do token e o perfil é
sempre `user`. Enviar `companyId` ou `role` no corpo é simplesmente ignorado. Na interface, o admin
encontra a aba **Usuários** no menu lateral, que não aparece para o perfil `user`.

| Cenário | Resultado |
|---|---|
| Admin da empresa A convida e-mail novo | `201`, `User` + `Participant` `pending` |
| Admin convida e-mail já cadastrado | `201`, novo `Participant` `pending` + notificação |
| Admin convida quem já participa da empresa | `409` este usuário já participa desta empresa |
| `user` tenta `POST /users/invite` | `403` permissão de administrador necessária |
| `user` tenta `GET /users` | `403` permissão de administrador necessária |
| Admin da empresa A lista usuários | Apenas participantes da empresa A |
| `user` da empresa A lista produtos | Apenas os 10 produtos da empresa A |

## Situação do participante

`Participant.status` assume três valores:

| Situação | Significado |
|---|---|
| `pending` | Convidado, aguardando aceite ou primeiro acesso |
| `activated` | Participante ativo da empresa |
| `suspended` | Suspenso pela empresa |

A participação é ativada em dois momentos: no **primeiro login** do usuário e na **leitura da
notificação de convite**. Suspender e reconvidar são feitos em `PATCH /users/:participantId/status`.

## Troca de empresa

Usuários com mais de uma empresa ativa alternam entre elas no menu lateral. A troca emite um novo
token com o `companyId` e o papel correspondentes à empresa escolhida:

```bash
curl -X POST http://localhost:3001/auth/switch-company \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"companyId":"<companyId>"}'
```

Quem não está ativo em nenhuma empresa vê um modal pedindo para criar a própria empresa ou sair da conta
(`POST /auth/companies`).

## Decisões arquiteturais
- **TypeScript no backend e frontend:** tipagem consistente entre camadas e melhor manutenção.
- **Separação por responsabilidade:** models, routes, middleware, services e tools não ficam concentrados em um único arquivo.
- **Participante como elo entre usuário e empresa:** `Participant` concentra papel e situação, permitindo que um mesmo usuário participe de várias empresas com perfis diferentes.
- **Tenant obtido do JWT:** o cliente não escolhe o `companyId` das consultas; o middleware valida a identidade e as operações consultam o tenant autenticado.
- **Autorização em três camadas:** `requireAuth` exige login, `requireCompany` exige empresa ativa no token e `requireAdmin` restringe operações de escrita.
- **Tool calling controlado pelo servidor:** o LLM escolhe a ferramenta e fornece apenas o termo de busca. O backend injeta o tenant autenticado ao executar a consulta.
- **Validação de entrada:** Zod valida os payloads de autenticação, chat, produtos e convites.
- **Convite restrito ao admin:** o cadastro de `user` acontece por `POST /users/invite`, protegido por `requireAdmin`. Não existe auto-cadastro público com escolha de perfil, o que impediria que qualquer visitante se tornasse admin. O `companyId` e o `role` são definidos pelo servidor, nunca pelo corpo da requisição.
- **E-mail único em toda a plataforma:** o login resolve a identidade pelo e-mail. Com o índice antigo (`companyId + email`), o mesmo e-mail podia existir em duas empresas e o `findOne` autenticar no tenant errado. Agora o índice é único por e-mail e o login valida a senha contra todos os candidatos antes de escolher.
- **Convite não concede acesso imediato:** a participação nasce `pending` e só vira `activated` no primeiro acesso ou na leitura da notificação, o que dá ao usuário a chance de recusar.

## Endpoints principais
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/companies`
- `POST /auth/switch-company`
- `POST /auth/companies`
- `GET /users` (admin)
- `GET /users/check-email`
- `POST /users/invite` (admin — convida usuário)
- `PATCH /users/:participantId/status` (admin — suspende ou reconvida)
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `GET /products` (admin e user)
- `POST /products` (admin)
- `PATCH /products/:id` (admin)
- `DELETE /products/:id` (admin)
- `POST /chat` (admin e user)
- `GET /health`

## Antes de produção
- Adicionar testes unitários e de integração, especialmente tentativas de acesso cruzado entre tenants e bypass de roles.
- Rate limiting, logs estruturados, métricas, tracing, alertas e auditoria de operações.
- Refresh tokens ou sessões com estratégia de revogação, política de senha, recuperação de conta e proteção contra brute force.
- Paginação, limites de consulta, índices avaliados com explain e busca mais sofisticada no catálogo.
- Restrições de CORS por ambiente, gerenciamento de segredos, headers de segurança e sanitização/limites de entrada.
- Timeouts, retries limitados, tratamento de indisponibilidade e limites de custo para chamadas de LLM.
- Histórico persistente de conversas, streaming SSE, observabilidade das chamadas de IA e avaliação contra prompt injection.
- Pipeline CI, Docker Compose e deploy automatizado.

## Observações
Este é um ponto de partida funcional, mas ainda precisa ser instalado, executado e validado no ambiente local antes de ser enviado para avaliação. O desafio não deve ser considerado concluído até passar pelos testes manuais de autenticação, permissões, isolamento entre empresas e tool calling.
