COMPOSE_FILE ?= .env.docker
COMPOSE = docker compose --env-file $(COMPOSE_FILE)

.PHONY: help check-tools setup check-env config build up start down stop restart rebuild ps status logs logs-backend logs-frontend logs-nginx logs-mongodb health test-http shell-backend shell-frontend shell-mongodb install-local install-backend install-frontend dev-backend dev-frontend build-backend build-frontend clean reset seed seed-reset

# Exibir comandos disponíveis
help:
	@echo ""
	@echo "Catalog-ai - available commands"
	@echo "================================"
	@grep -E '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  make %-20s %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make setup       # create local environment file, if a template exists"
	@echo "  make up          # build and start the application"
	@echo "  make health      # check the application endpoint"
	@echo ""

# Verifique se o Docker, o Compose e (opcionalmente) o Make estão instalados
check-tools:
	@command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is not installed or not in PATH."; exit 1; }
	@docker compose version >/dev/null 2>&1 || { echo "ERROR: Docker Compose plugin is unavailable."; exit 1; }
	@echo "Docker and Docker Compose are available."
	@docker --version
	@docker compose version

# Prepare o arquivo .env.docker a partir de um modelo de exemplo, quando disponível.
setup: check-tools
	@if [ -f "$(COMPOSE_FILE)" ]; then \
		echo "$(COMPOSE_FILE) already exists; leaving it unchanged."; \
	elif [ -f ".env.docker.example" ]; then \
		cp .env.docker.example "$(COMPOSE_FILE)"; \
		echo "Created $(COMPOSE_FILE) from .env.docker.example."; \
		echo "Edit $(COMPOSE_FILE), set the required secrets, then run: make config"; \
	elif [ -f ".env.docker.sample" ]; then \
		cp .env.docker.sample "$(COMPOSE_FILE)"; \
		echo "Created $(COMPOSE_FILE) from .env.docker.sample."; \
		echo "Edit $(COMPOSE_FILE), set the required secrets, then run: make config"; \
	else \
		echo "No environment template was found."; \
		echo "Create $(COMPOSE_FILE) using the variables documented in the README."; \
		exit 1; \
	fi

# Verifique se o arquivo de ambiente do Compose existe
check-env:
	@test -f "$(COMPOSE_FILE)" || { \
		echo "ERROR: $(COMPOSE_FILE) not found."; \
		echo "Run 'make setup' if an example template is committed, or create the file using the README."; \
		exit 1; \
	}
	@echo "Found $(COMPOSE_FILE)."

# Valide a configuração do Docker Compose.
config: check-env check-tools
	@$(COMPOSE) config -q
	@echo "Docker Compose configuration is valid."

# Build imagens de backend e frontend
build: check-env check-tools
	$(COMPOSE) build

# Rebuild images sem cache
rebuild: check-env check-tools
	$(COMPOSE) build --no-cache

# Compile e inicie a aplicação em segundo plano.
up: config
	$(COMPOSE) up -d --build
	@echo ""
	@$(COMPOSE) ps
	@echo ""
	@echo "Frontend: http://localhost:8080"
	@echo "Health:   http://localhost:8080/health"

# Inicie a aplicação exibindo no terminal
start: up
	$(COMPOSE) up

# Pare e remova contêineres e redes (mantém o volume do banco de dados)
down: check-env
	$(COMPOSE) down

# Pare de executar contêineres sem removê-los
stop: check-env
	$(COMPOSE) stop

# Reinicie os contêineres
restart: check-env
	$(COMPOSE) restart

# Lista os status dos contêineres
ps: check-env
	$(COMPOSE) ps

# Alias para 'make ps'
status: ps

# Acompanhe os logs de todos os serviços (Ctrl+C para sair)
logs: check-env
	$(COMPOSE) logs -f --tail=100

# Acompanhe os logs do backend
logs-backend: check-env
	$(COMPOSE) logs -f --tail=100 backend

# Acompanhe os logs do frontend
logs-frontend: check-env
	$(COMPOSE) logs -f --tail=100 frontend

# Acompanhe os logs do Nginx
logs-nginx: check-env
	$(COMPOSE) logs -f --tail=100 nginx

# Acompanhe os logs do MongoDB
logs-mongodb: check-env
	$(COMPOSE) logs -f --tail=100 mongodb

# Solicitar o endpoint de integridade da aplicação
health:
	@curl --fail --show-error --silent --include http://localhost:8080/health

# Verifique o frontend e o endpoint de integridade via HTTP
test-http:
	@echo "Checking frontend..."
	@curl --fail --show-error --silent --output /dev/null --write-out "Frontend HTTP status: %{http_code}\n" http://localhost:8080/
	@echo "Checking backend health..."
	@curl --fail --show-error --silent --output /dev/null --write-out "Health HTTP status: %{http_code}\n" http://localhost:8080/health

# Abra um shell no container de backend
shell-backend: check-env
	$(COMPOSE) exec backend sh

# Abra um shell no container de frontend
shell-frontend: check-env
	$(COMPOSE) exec frontend sh

# Abra um shell do MongoDB (mongosh) no contêiner do banco de dados.
shell-mongodb: check-env
	$(COMPOSE) exec mongodb mongosh -u "$${MONGO_ROOT_USER:-admin}" -p "$${MONGO_ROOT_PASSWORD}" --authenticationDatabase admin

# Instale as dependências npm do backend e do frontend no host
install-local: install-backend install-frontend

# Instale as dependências do backend localmente (requer Node.js/npm)
install-backend:
	cd backend && npm install

# Instale as dependências do frontend localmente (requer Node.js/npm)
install-frontend:
	cd frontend && npm install

# Execute o backend em modo de desenvolvimento no host (requer script de desenvolvimento do backend)
dev-backend:
	cd backend && npm run dev

# Execute o frontend em modo de desenvolvimento no host (requer script de desenvolvimento do frontend)
dev-frontend:
	cd frontend && npm run dev

# Compile o backend localmente (requer Node.js/npm)
build-backend:
	cd backend && npm run build

# Compile o frontend localmente (requer Node.js/npm)
build-frontend:
	cd frontend && npm run build

# Remova os contêineres e as imagens geradas; preserve o volume de dados do MongoDB
clean: check-env
	$(COMPOSE) down --rmi local

# ATENÇÃO! remover contêineres E volume de dados do MongoDB
reset: check-env
	@echo "WARNING: this deletes the MongoDB Docker volume and all data stored in it."
	@read -r -p "Type 'yes' to continue: " answer; \
	if [ "$$answer" = "yes" ]; then \
		$(COMPOSE) down -v --remove-orphans; \
	else \
		echo "Cancelled."; \
	fi

# Inserir dados iniciais no MongoDB
seed: check-env
	$(COMPOSE) exec backend npm run seed

# Limpar e recriar os dados de demonstração
seed-reset: check-env
	@echo "ATENÇÃO: este comando pode apagar dados existentes."
	@read -r -p "Digite 'yes' para continuar: " answer; \
	if [ "$$answer" = "yes" ]; then \
		$(COMPOSE) exec backend npm run seed:reset; \
	else \
		echo "Operação cancelada."; \
	fi
