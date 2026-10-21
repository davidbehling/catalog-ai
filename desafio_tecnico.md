Desafio Técnico — Desenvolvedor Fullstack

# CONTEXTO:

Você está se candidatando para uma posição de Desenvolvedor Fullstack em uma plataforma SaaS com IA. Este desafio simula o tipo de trabalho que você fará no dia a dia.

# DESAFIO:

Construa um mini SaaS multi-tenant, uma plataforma onde empresas cadastram seus produtos e um agente de IA responde perguntas dos clientes consultando dados reais do banco.

# REQUISITOS:

## Backend (Node.js + Express + MongoDB)

• Autenticação JWT — registro e login com roles ( admin , user )
• Multi-tenant — todas as queries filtradas por company_id . Empresa A nunca vê dados da Empresa B
• CRUD de Produtos — nome, descrição, preço, categoria, imagem (URL)
• Endpoint de Chat ( POST /chat ):
  ◦ Recebe { message } + autenticação do usuário
  ◦ Usa LLM (OpenAI, Claude, ou outro) com tool calling
  ◦ A tool deve consultar produtos no MongoDB filtrando pelo company_id do usuário autenticado
  ◦ Retorna a resposta do agente com dados reais do banco
• Middleware de permissões — admin pode criar/editar/deletar produtos; user só visualiza e usa o chat
• Seed script — popula o banco com 2 empresas e 10+ produtos cada (pronto pra rodar e testar)

## Frontend (React + TypeScript)

• Tela de Login/Registro
• Dashboard — listagem de produtos com CRUD (admin) ou visualização (user)
• Tela de Chat — interface de conversa com o agente IA
• Design caprichado — UI limpa, moderna, responsiva. Você é fullstack, o frontend precisa ter qualidade visual. Não precisa ser obra de arte, mas precisa ser profissional.

## Geral

• README com:
  ◦ Instruções de setup (rodar local em até 5 minutos)
  ◦ Decisões arquiteturais: por que escolheu essa estrutura, esses patterns, esse approach
  ◦ O que você faria diferente em produção (escala, segu
• Repositório GitHub (público ou privado com acesso)

## O que NÃO precisa

• Deploy em produção (roda local)
• Testes automatizados (bônus se tiver)
• Docker (bônus se tiver)

## Bônus (diferenciadores)

• TypeScript no backend
• Streaming da resposta do agente (SSE ou WebSocket)
• Upload de imagem dos produtos
• Dark mode
• Testes unitários/integração
• Docker Compose pro setup completo

## Critérios de Avaliação

----------------------------+-------+----------------------------------------------------
Critério 			              | Peso 	| O que olhamos
----------------------------+-------+----------------------------------------------------
Arquitetura backend 		    | 25% 	| Separação de responsabilidades, patterns, estrutura
Multi-tenant correto 		    | 20% 	| Isolamento real entre empresas, implementação no middleware
Agente IA com tool calling	| 20% 	| Integração real com LLM, não apenas wrapper de chat
Auth + permissões 		      | 10% 	| JWT correto, middleware de roles, segurança
Frontend + design 		      | 15% 	| UI profissional, responsivo, boa experiência
README + comunicação		    | 10% 	| Decisões explicadas, setup claro, visão de produção
----------------------------+-------+----------------------------------------------------

## Importante

• Valorizamos decisões bem justificadas mais do que quantidade de features
• Código limpo e organizado > código com muitas features mal feitas
• O README é tão importante quanto o código, queremos entender como você pensa
• Se usar ferramentas de IA no desenvolvimento (Claude Code, Cursor, etc), pode usar, mas você precisa entender e explicar cada decisão na entrevista

Boa sorte!