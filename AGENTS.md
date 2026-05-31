# zeyneple.art

Next.js gallery/portfolio for the artist Zeynep Komur (live at zeynepkomur.com).
SQLite via Drizzle ORM; Caddy edge proxy on the shared `edge` network.

## Local dev

```bash
make dev          # Next.js dev server          (make help for all targets)
make up / make down   # local docker stack (Caddy + app)
make logs
make reset        # DESTRUCTIVE: wipe local data + rebuild
```

## Deploy  (home-server fleet — identical block across all four projects)

Deployment is driven from the central home-server repo, NOT from this repo. Never
edit prod by hand or run docker compose on the server directly.

```bash
cd ~/ws/home-server && make deploy PROJECT=zeyneple
```

Rsyncs the working tree to `taha@192.168.178.70:/opt/stacks/zeyneple.art`, runs
`docker compose -f docker-compose.prod.yml up -d --build`, and health-probes
`zeynepkomur.com` via the Cloudflare-tunnel `edge` network (HTTP-only proxy; TLS at
the edge). Fleet model + registry: `~/ws/home-server/AGENTS.md`.

## Notes

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
