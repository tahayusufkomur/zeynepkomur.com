# zeyneple.art

Next.js gallery/portfolio site for the artist Zeynep Komur — live at
**[zeynepkomur.com](https://zeynepkomur.com)**. SQLite (Drizzle ORM), behind a Caddy
edge proxy on the home-server fleet.

## Local dev

```bash
make dev          # Next.js dev server (see `make help` for all targets)
make up           # local docker stack (Caddy + app)
make logs
```

## Deploy

Deployment is driven from the central home-server repo, **not** from here
(this site is self-hosted behind a Cloudflare Tunnel — it is not on Vercel):

```bash
cd ~/ws/home-server && make deploy PROJECT=zeyneple
```

See [AGENTS.md](AGENTS.md) for repo conventions and `~/ws/home-server/AGENTS.md`
for the fleet/deploy model.
