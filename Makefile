.PHONY: help dev build run stop reset logs convert-media seed-artworks \
       infra-init infra-plan infra-apply infra-destroy infra-output \
       setup deploy deploy-logs deploy-shell deploy-env deploy-backup

# ──────────────── Local Development ────────────────

help: ## Show all available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Run Next.js dev server
	npm run dev

build: ## Build Docker images (local)
	docker compose build

run: ## Run local stack (Caddy + app)
	docker compose up -d

stop: ## Stop local stack
	docker compose down

reset: ## Reset local stack (delete data)
	docker compose down -v
	rm -rf data/*.db data/backups/*
	docker compose up -d --build

logs: ## Tail local logs
	docker compose logs -f

convert-media: ## Convert raw media to AVIF
	npx tsx scripts/convert-media.ts

seed-artworks: convert-media ## Seed artworks into database
	npx tsx scripts/seed-artworks.ts

# ──────────────── Infrastructure (Terraform) ────────────────

# Load tokens from infrastructure/.env
-include infrastructure/.env
export

PROD_HOST := root@$$(cd infrastructure && terraform output -raw server_ipv4 2>/dev/null)
PROD_DIR  := /opt/zeynepkomur
PROD_COMPOSE := docker compose -f docker-compose.prod.yml --env-file .env.prod
REPO := tahayusufkomur/zeynepkomur.com

infra-init: ## Initialize Terraform
	cd infrastructure && terraform init

infra-plan: ## Plan infrastructure changes
	cd infrastructure && terraform plan \
		-var="hcloud_token=$(HETZNER_API_TOKEN)" \
		-var="cloudflare_api_token=$(CLOUDFLARE_API_TOKEN)" \
		-var="github_token=$(GITHUB_TOKEN)" \
		-var="email_forward_to=$(EMAIL_FORWARD_TO)"

infra-apply: ## Apply infrastructure (provision VPS + DNS + email)
	cd infrastructure && terraform apply \
		-var="hcloud_token=$(HETZNER_API_TOKEN)" \
		-var="cloudflare_api_token=$(CLOUDFLARE_API_TOKEN)" \
		-var="github_token=$(GITHUB_TOKEN)" \
		-var="email_forward_to=$(EMAIL_FORWARD_TO)"

infra-destroy: ## Destroy all infrastructure
	cd infrastructure && terraform destroy \
		-var="hcloud_token=$(HETZNER_API_TOKEN)" \
		-var="cloudflare_api_token=$(CLOUDFLARE_API_TOKEN)" \
		-var="github_token=$(GITHUB_TOKEN)" \
		-var="email_forward_to=$(EMAIL_FORWARD_TO)"

infra-output: ## Show Terraform outputs (IP, URL, etc.)
	cd infrastructure && terraform output

# ──────────────── Production Deployment ────────────────

setup: ## First-time server setup (clone repo)
	@echo "Setting up server at $(PROD_HOST)..."
	ssh $(PROD_HOST) 'GITHUB_TOKEN=$(GITHUB_TOKEN) REPO=$(REPO) bash -s' < scripts/setup-server.sh

deploy-env: ## Upload .env.prod to server
	scp .env.prod $(PROD_HOST):$(PROD_DIR)/.env.prod

deploy: ## Deploy latest changes to production
	@echo "Pushing to origin..."
	@git push origin main
	@echo "Deploying to production..."
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && git pull origin main && $(PROD_COMPOSE) up --build -d"
	@echo "Deploy complete: https://zeynepkomur.com"

deploy-logs: ## Tail production logs
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && $(PROD_COMPOSE) logs -f --tail=100"

deploy-shell: ## SSH into production server
	@ssh $(PROD_HOST) -t "cd $(PROD_DIR) && bash"

deploy-backup: ## Download latest database backup from production
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && $(PROD_COMPOSE) exec -T app sh /app/scripts/backup.sh"
	@scp $(PROD_HOST):$(PROD_DIR)/data/backups/$$(ssh $(PROD_HOST) "ls -t $(PROD_DIR)/data/backups/ | head -1") ./data/
	@echo "Backup downloaded to ./data/"

deploy-seed: ## Seed artworks on production
	@scp scripts/artwork-seed.json scripts/seed-artworks.ts $(PROD_HOST):$(PROD_DIR)/
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && docker cp artwork-seed.json \$$($(PROD_COMPOSE) ps -q app):/app/scripts/artwork-seed.json && docker cp seed-artworks.ts \$$($(PROD_COMPOSE) ps -q app):/app/scripts/seed-artworks.ts && $(PROD_COMPOSE) exec -T app npx tsx scripts/seed-artworks.ts && rm -f artwork-seed.json seed-artworks.ts"
