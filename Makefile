.PHONY: dev run stop reset build logs convert-media seed-artworks

dev:
	npm run dev

build:
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

reset:
	docker compose down -v
	rm -rf data/*.db data/backups/*
	docker compose up -d --build

logs:
	docker compose logs -f

convert-media:
	npx tsx scripts/convert-media.ts

seed-artworks: convert-media
	npx tsx scripts/seed-artworks.ts
