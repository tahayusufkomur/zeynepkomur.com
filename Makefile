.PHONY: help dev dev-reset build up down run stop reset logs check convert-media seed-artworks

# Deployment lives in the home-server ops repo, not here:
#   cd ~/ws/home-server && make deploy PROJECT=zeyneple   # rsync + build on the home server
# (This project was migrated off Hetzner; Terraform/VPS deploy targets were removed.)

# ──────────────── Local Development ────────────────

help: ## Show all available commands
	@echo ""
	@echo "Available commands:"
	@echo "==================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}' | sort
	@echo ""

dev: ## Run Next.js dev server
	npm run dev

dev-reset: ## Reset dev database and restart dev server
	rm -f data/zeyneple.db
	npx tsx scripts/dev-reset.ts
	npm run dev

build: ## Build Docker images (local)
	docker compose build

up: ## Start local stack (Caddy + app), detached
	docker compose up -d

down: ## Stop local stack
	docker compose down

run: up    ## alias for `up`
stop: down ## alias for `down`

reset: ## DESTRUCTIVE: reset local stack (delete data) + rebuild
	docker compose down -v
	rm -rf data/*.db data/backups/*
	docker compose up -d --build

logs: ## Tail local logs
	docker compose logs -f

check: ## Lint + typecheck
	npm run lint
	npx tsc --noEmit

convert-media: ## Convert raw media to AVIF
	npx tsx scripts/convert-media.ts

seed-artworks: convert-media ## Seed artworks into database
	npx tsx scripts/seed-artworks.ts
