# Deploy: GitHub Actions → DigitalOcean

## Production droplet (created)

| Field | Value |
|-------|--------|
| Name | `operation-child-shield-prod` |
| Size | `s-2vcpu-4gb` (~$24/mo) |
| Region | `nyc1` |
| Public IP | `157.230.49.62` |
| App path | `/opt/operationchildshield` |
| SSH user | `root` |
| SSH key (local) | `~/.ssh/ocs_prod_deploy` (no passphrase; for GitHub Actions) |

Site (HTTP, until DNS): http://157.230.49.62/

## What you must add in GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|--------|
| `DEPLOY_HOST` | `157.230.49.62` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | Full contents of local file `~/.ssh/ocs_prod_deploy` (private key, including `BEGIN`/`END` lines) |
| `DEPLOY_PATH` | `/opt/operationchildshield` (optional if you use the workflow default) |
| `PUBLIC_SITE_URL` | `http://157.230.49.62` for now; later `https://operationchildshield.org` |

### How to copy the private key (on this machine)

```bash
cat ~/.ssh/ocs_prod_deploy
```

Paste the entire output into `DEPLOY_SSH_KEY`. Do **not** commit this file.

## How deploy works

1. Push/merge to **`main`**
2. Workflow **Build and deploy** (`.github/workflows/deploy.yml`):
   - Runs backend + frontend tests
   - Builds Docker images and pushes to GHCR:
     - `ghcr.io/dotnetrussell/operationchildshield-backend:main`
     - `ghcr.io/dotnetrussell/operationchildshield-frontend:main`
   - SSHs to the droplet, pulls images, restarts Compose
3. Smoke-checks `/api/health`

First successful deploy job also requires GHCR package write via `GITHUB_TOKEN` (workflow already has `packages: write`). After the first image push, open the package on GitHub and set visibility to **Public** if the droplet cannot pull anonymously.

## DNS cutover (when ready)

1. Point `operationchildshield.org` A record to `157.230.49.62`
2. Replace server `Caddyfile` with domain-based config (see `Caddyfile.example`)
3. Update secrets `PUBLIC_SITE_URL` to `https://operationchildshield.org`
4. Update server `.env` `CORS_ORIGINS` / `NEXT_PUBLIC_API_URL`
5. Rebuild frontend image (so `NEXT_PUBLIC_API_URL` is baked correctly) and redeploy

## Manual commands on the droplet

```bash
ssh -i ~/.ssh/ocs_prod_deploy root@157.230.49.62
cd /opt/operationchildshield
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1/api/health
```
