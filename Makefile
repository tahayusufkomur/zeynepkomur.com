.PHONY: help dev dev-reset build run stop reset logs convert-media seed-artworks

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
