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

Site (HTTPS + Let's Encrypt): https://operationchildshield.org and https://www.operationchildshield.org

## What you must add in GitHub

**Critical:** secrets must be **Repository secrets**, not Environment secrets and not Variables.

Path:

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. Open the **Secrets** tab (not Variables)
3. Under **Repository secrets** (not Environment secrets), click **New repository secret**

If you see them under **Environments → production → Secrets**, this workflow will **not** see them unless the job has `environment: production`. Prefer Repository secrets for simplicity.

| Secret name | Value |
|-------------|--------|
| `DEPLOY_HOST` | `157.230.49.62` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | Full private key PEM (including BEGIN/END lines), **or** use `DEPLOY_SSH_KEY_B64` instead |
| `DEPLOY_SSH_KEY_B64` | Preferred: single-line base64 of the private key (avoids multiline paste issues) |
| `DEPLOY_PATH` | `/opt/operationchildshield` |
| `PUBLIC_SITE_URL` | `https://operationchildshield.org` |

### Preferred: base64 SSH key

On the machine that has `~/.ssh/ocs_prod_deploy`:

```bash
base64 -w0 ~/.ssh/ocs_prod_deploy
echo   # newline for your terminal only; do not include trailing newline in the secret if your paste tool adds one
```

Paste the single line into repository secret `DEPLOY_SSH_KEY_B64`.

### Alternative: raw PEM

```bash
cat ~/.ssh/ocs_prod_deploy
```

Paste the entire output into `DEPLOY_SSH_KEY`. Do **not** commit this file.

### If Actions still says Missing secret

Check the deploy job log `env:` block. If you see:

```text
DEPLOY_SSH_KEY:
DEPLOY_HOST:
DEPLOY_USER:
```

(all blank), GitHub is not injecting those secrets into the job. That means they are Variables, Environment secrets, or on the wrong repo — not Repository secrets. Re-create them under **Repository secrets**, then **Re-run failed jobs** (new run after saving secrets).

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
3. Update secret `PUBLIC_SITE_URL` to `https://operationchildshield.org`
4. Update server `.env` `CORS_ORIGINS` / `NEXT_PUBLIC_API_URL`
5. Rebuild frontend image (so `NEXT_PUBLIC_API_URL` is baked correctly) and redeploy

## Manual commands on the droplet

```bash
ssh -i ~/.ssh/ocs_prod_deploy root@157.230.49.62
cd /opt/operationchildshield
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1/api/health
```
