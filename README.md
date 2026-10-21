# Maria Mini SaaS — desafio técnico

MVP multi-tenant para catálogo de produtos e chat com agente de IA, iniciado com Node.js/Express/TypeScript, MongoDB/Mongoose, React/TypeScript e OpenAI tool calling.

## O que já está implementado
- Modelos de empresa, usuário e produto.
- Registro (cria uma empresa e seu primeiro admin) e login com JWT.
- Middleware de autenticação e permissão de administrador.
- CRUD de produtos sempre filtrado pelo `companyId` da identidade autenticada.
- Endpoint `POST /chat` com tool calling; o `companyId` vem do token no servidor e nunca dos argumentos do modelo.
- Seed de duas empresas, dois usuários por empresa e dez produtos por empresa.
- Interface responsiva com login/registro, dashboard de produtos, CRUD para admin e chat.

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

## Decisões arquiteturais
- **TypeScript no backend e frontend:** tipagem consistente entre camadas e melhor manutenção.
- **Separação por responsabilidade:** models, routes, middleware, services e tools não ficam concentrados em um único arquivo.
- **Tenant obtido do JWT:** o cliente não escolhe o `companyId` das consultas; o middleware valida a identidade e as operações consultam o tenant autenticado.
- **Autorização em duas camadas:** `requireAuth` exige login e `requireAdmin` restringe operações de escrita.
- **Tool calling controlado pelo servidor:** o LLM escolhe a ferramenta e fornece apenas o termo de busca. O backend injeta o tenant autenticado ao executar a consulta.
- **Validação de entrada:** Zod valida os payloads de autenticação, chat e produtos.

## Endpoints principais
- `POST /auth/register`
- `POST /auth/login`
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
