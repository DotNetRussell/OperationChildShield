# Operation Child Shield

A transparency platform that scores U.S. lawmakers on child protection legislation using public data from the [Congress.gov API](https://api.congress.gov/). The site publishes member report cards, a congressional metrics dashboard, and curated bill tracking with links back to official roll-call records.

**Production:** [https://operationchildshield.org](https://operationchildshield.org)

---

## What exists today

### Public pages

| Route | Description |
|-------|-------------|
| `/` | Member directory with search, party/state filters, grade filters, lazy-loaded report cards, and infinite scroll |
| `/member/[bioguideId]` | Full protection report card with vote breakdown |
| `/bills` | 30 tracked bills in three sections: House roll-call (scored), floor action (tracked only), introduced |
| `/metrics` | Congress-wide analytics dashboard (KPIs, party/chamber/state breakdowns, CSV export) |
| `/about` | Scoring methodology |
| `/disclaimer` | Legal disclaimer (entertainment purposes, public data sources, contact) |
| `/partners` | Partner organizations (Countervail Intelligence, SquidSec) |
| `/directory` | Alternate member listing |

### Hidden pages (code present, feature-flagged off)

These routes return **404** until enabled in [`frontend/src/lib/feature-flags.ts`](frontend/src/lib/feature-flags.ts):

| Route | Description |
|-------|-------------|
| `/board` | Board of directors |
| `/donate` | Donation UI with suggested amounts (no payment processor wired) |

Set `ENABLE_BOARD_PAGE` and/or `ENABLE_DONATE_PAGE` to `true`, restore nav links in `Header.tsx` / `Footer.tsx`, and rebuild.

### Backend API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Service health, congress session, API key configured |
| `GET /api/members` | Member directory (`search`, `chamber`, `state`, `party`, `grade`, `sort`, `limit`, `offset`) |
| `GET /api/members/{bioguideId}/report-card` | Member protection report card |
| `GET /api/bills` | Tracked legislation with floor-status metadata |
| `GET /api/grades/summary` | Grade bucket counts for filter UI |
| `GET /api/metrics` | Full metrics dashboard payload |
| `GET /api/metrics/export` | CSV export of member-level metrics |

Interactive API docs: `http://localhost:8000/docs` (local).

### Scoring model (summary)

- **Only House roll-call votes** on verified bills drive letter grades.
- Senate members and voice-vote bills are tracked but not individually scored (Congress.gov limitation).
- Pro-protection stance: **Aye** = full credit; **Nay** = zero.
- **Present** and **Not Voting** = zero credit, counted against the score.
- Bills are verified against Congress.gov titles at backend startup.
- Responses are file-cached for **24 hours** by default (`CACHE_TTL_SECONDS=86400`).

Full methodology: in-app `/about` page.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (recommended), **or**
- Python 3.12+, Node.js 24+, npm
- A free **Congress.gov API key** (required for the backend)

---

## Get a Congress.gov API key

1. Go to **[https://api.congress.gov/sign-up/](https://api.congress.gov/sign-up/)**
2. Complete the sign-up form with your name and email.
3. Congress.gov will email you an API key (usually within minutes to one business day).
4. Copy the key into your `.env` file:

   ```bash
   CONGRESS_API_KEY=your_key_here
   ```

### API limits and usage

- Congress.gov publishes a rate limit of **5,000 requests per hour** per key (confirm current limits on their site).
- This app caches all Congress.gov responses on disk for 24 hours to minimize API usage.
- The heaviest operations are building the grade index and metrics dashboard (first request after cache expiry). Steady-state traffic is mostly cache hits.
- **Never commit your API key.** Keep it only in `.env` (gitignored) or your deployment secrets.

### Verify your key works

```bash
curl "https://api.congress.gov/v3/member/congress/119?api_key=YOUR_KEY&format=json&limit=1"
```

You should receive JSON with a `members` array.

---

## Quick start (Docker)

```bash
git clone <repo-url> OperationChildShield
cd OperationChildShield

cp .env.example .env
# Edit .env — set CONGRESS_API_KEY

docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

---

## Local development (without Docker)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

export CONGRESS_API_KEY=your_key
export CONGRESS_NUMBER=119
export CACHE_TTL_SECONDS=86400
export CORS_ORIGINS=http://localhost:3000

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CONGRESS_API_KEY` | *(required)* | Congress.gov API key |
| `CONGRESS_NUMBER` | `119` | Congress session to query |
| `CACHE_TTL_SECONDS` | `86400` | File cache TTL (24 hours) |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `NEXT_PUBLIC_API_URL` | — | Browser-facing API URL (frontend) |
| `API_URL` | — | Server-side API URL inside Docker network |
| `NEXT_PUBLIC_SITE_URL` | `https://operationchildshield.org` | Canonical site URL for Open Graph metadata |

See [`.env.example`](.env.example) for a template.

---

## Project structure

```
OperationChildShield/
├── backend/
│   ├── app/
│   │   ├── bills.py              # Curated tracked legislation
│   │   ├── bill_verification.py  # Startup Congress.gov title checks
│   │   ├── congress_client.py    # Congress.gov HTTP client + cache
│   │   ├── scoring.py            # Vote scoring and letter grades
│   │   ├── services.py           # Report cards, directory, grade index
│   │   ├── metrics.py            # Metrics dashboard aggregation
│   │   └── routes/               # FastAPI routers
│   └── tests/                    # Pytest unit tests
├── frontend/
│   └── src/
│       ├── app/                  # Next.js App Router pages
│       ├── components/           # UI components
│       └── lib/                  # API client, types, metrics utilities
├── scripts/
│   ├── deploy-prod.example.sh    # Production deploy template (copy → deploy-prod.sh)
│   ├── verify_bills.py           # Manual bill verification
│   └── test.sh                   # Run backend + frontend tests
├── docker-compose.yml            # Local development stack
├── docker-compose.prod.example.yml  # Production template (copy → docker-compose.prod.yml)
├── Caddyfile.example             # Reverse proxy template (copy → Caddyfile)
└── Makefile                      # Common dev commands
```

---

## Testing

```bash
# All tests
make test

# Backend only
make test-backend

# Frontend only
make test-frontend

# Lint frontend
make lint

# Verify tracked bills against Congress.gov (requires API key)
make verify-bills
```

Backend tests use **pytest** and do not call Congress.gov (pure logic + isolated health route).

Frontend tests use **Vitest** for pure TypeScript utilities.

---

## Production deployment

Production runs with Docker Compose behind **Caddy** (TLS + reverse proxy: `/api/*` → backend, everything else → frontend).

Deployment configs are **gitignored** so server hosts and credentials stay out of version control.

If `deploy-prod.sh`, `docker-compose.prod.yml`, or `Caddyfile` were committed before, remove them from the index (local copies are kept):

```bash
git rm --cached scripts/deploy-prod.sh docker-compose.prod.yml Caddyfile .env 2>/dev/null || true
```

Copy the example files locally:

```bash
cp scripts/deploy-prod.example.sh scripts/deploy-prod.sh
cp docker-compose.prod.example.yml docker-compose.prod.yml
cp Caddyfile.example Caddyfile
chmod +x scripts/deploy-prod.sh
# Edit the three files for your domain, server, and CORS origins
```

```bash
# From your machine (requires SSH access to the server)
DEPLOY_REMOTE=user@your-server ./scripts/deploy-prod.sh
```

Before deploying:

1. Ensure `.env` on the server has `CONGRESS_API_KEY` and production `CORS_ORIGINS`.
2. Run `make verify-bills` locally or let the deploy script verify bill mappings.
3. Run `make test` locally.

---

## Operational notes

- **First request after cache expiry** can take 30–60+ seconds while report cards are built.
- **Backend startup** verifies all 30 tracked bills against Congress.gov; mismatches prevent the server from starting.
- **Senate scores** show `N/A` — scoring requires House roll-call data.
- **Board / Donate pages** are disabled via feature flags; code remains for future launch.

---

## Development roadmap

Priorities below focus on launch readiness, production hardening, and sustainable growth. Timelines are estimates.

### Production migration assumptions

- **Current MVP**: Development Docker Compose setup (single VPS or local). Caddy handles TLS and reverse proxy.
- **Target production**: Dedicated server (e.g., Linode, DigitalOcean, Hetzner, or AWS Lightsail). Docker Compose for consistency, with secrets via Docker secrets or `.env` + systemd.
- **Benefits**: Better uptime, isolated services, easier scaling, automated backups, monitoring, and compliance (e.g., for donations).
- **Timeline**: 1–3 days for a basic migration when following `deploy-prod.example.sh` / `docker-compose.prod.example.yml`.

### Phase 1: Immediate priorities — features + production migration (1–3 weeks)

Focus on stability and launch readiness before deeper work.

1. **Finish Board of Directors page**
   - Update bios, images, and content.
   - Enable feature flag (`ENABLE_BOARD_PAGE`), restore navigation.
   - Polish and test.

2. **Enable and implement donation page**
   - Enable feature flag (`ENABLE_DONATE_PAGE`).
   - Integrate Stripe (primary) with PayPal fallback: forms with suggested/recurring amounts, fee coverage, impact messaging.
   - Add receipt/thank-you flows and basic donor logging.
   - Test thoroughly (sandbox first).

3. **Migrate to production server environment** (do this immediately after or alongside #1/#2)
   - **Prep**: Copy and customize `docker-compose.prod.example.yml`, `Caddyfile.example`, and `scripts/deploy-prod.example.sh`. Set production env vars (CORS, `NEXT_PUBLIC_SITE_URL`, API keys). Use secrets management — never commit keys. Run `make verify-bills` and `make test`.
   - **Server setup**: Provision a clean VPS (Ubuntu/Debian; 2–4 CPU, 4+ GB RAM). Install Docker and Docker Compose. Configure firewall (UFW: 80/443, SSH), fail2ban, automatic security updates. Set up Caddy for HTTPS and reverse proxy (`/api/*` → backend, static → frontend). Deploy via `DEPLOY_REMOTE=user@prod-server ./scripts/deploy-prod.sh`.
   - **Migration**: Copy cached files/DB if any. Point DNS (`operationchildshield.org`) to the new server. Preserve URLs; add 301 redirects if needed. Harden with rate limiting, WAF (e.g., CrowdSec), monitoring (UptimeRobot or Prometheus/Grafana), and automated offsite backups. Post-deploy: verify health endpoint, full site functionality, donation test transaction, cache warming.
   - **Rollback**: Keep MVP accessible temporarily; use blue-green or backup containers.

**Milestone**: Live production site with board and donate pages functional, secure, and performant. Monitor the first 24–48 hours.

### Phase 2: Deeper integrations and enhancements (2–4 weeks post-production)

Build on the stable production foundation.

- **Donor and engagement**: Stripe webhooks → Zapier/Mailchimp automation, donor portal.
- **Advocacy tools**: Bill alerts, social sharing, analytics (GA4).
- **Tech**: CI/CD improvements, performance tuning, accessibility audit.
- **Security review**: Full penetration test once production is live.

### Phase 3: Growth and sustainability (ongoing)

- Fundraising campaigns, advanced features (e.g., AI summaries), reporting, marketing.
- Scale hosting as traffic and donations grow.

### Suggested next actions

- Start with board/donate content updates (quickest wins).
- Provision the production server in parallel.
- Document hosting budget, preferred provider, and current MVP details before tailoring configs further.

---

## Data sources and disclaimer

- Member and vote data from the [Congress.gov API](https://api.congress.gov/)
- Site provided for **entertainment purposes** — see [/disclaimer](https://operationchildshield.org/disclaimer)
- Disputes or concerns: [Contact@OperationChildShield.com](mailto:Contact@OperationChildShield.com)
- Not affiliated with the U.S. Government
- Always verify official records at [congress.gov](https://www.congress.gov/)

---

## License

Provided for public transparency and educational purposes.