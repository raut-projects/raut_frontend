# RAUT Frontend CI/CD

This directory contains GitHub Actions workflows for the RAUT frontend application.

## Deployment Strategy

**Staging:** Automatically deployed to **Vercel** via GitHub integration  
**Production:** Deployed to **VPS via Docker** (similar to backend)

---

## Workflow: `main.yml`

### Triggers
- **Push** to `main` or `staging` branches
- **Pull Requests** to `main` branch

### Jobs

#### 1. **Lint** 
Runs on all triggers.

- Checks out code
- Sets up Node.js 20.x with npm cache
- Installs dependencies
- Runs ESLint

#### 2. **Build**
Runs after lint passes.

- Checks out code
- Sets up Node.js 20.x with npm cache
- Installs dependencies
- Builds production bundle
- Uploads build artifacts (retained for 7 days)

#### 3. **Deploy to Production VPS**
Runs on push to `main` branch after lint and build pass.

- SSHs into production VPS
- Clones/pulls latest code from main branch
- Deploys frontend using Docker Compose
- Serves via Nginx on port 3000

**Required Secrets:**
- `VPS_HOST` - Production server hostname/IP
- `VPS_USER` - SSH username for production
- `VPS_SSH_KEY` - SSH private key for production
- `PAT_TOKEN` - GitHub Personal Access Token for cloning

**Deploy Location:** `/opt/raut_frontend` (Docker container)  
**Exposed Port:** `3000` (mapped to container port 80)

---

## Staging Deployment (Vercel)

Staging is handled automatically by Vercel's GitHub integration.

### Setup Vercel Integration

1. **Install Vercel GitHub App**
   - Go to https://vercel.com/integrations/github
   - Install for your repository

2. **Import Project**
   - Select `raut_frontend` repository
   - Framework: Vite
   - Root Directory: `./` (or specify if in monorepo)

3. **Configure Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_URL` with your staging API URL
   - Example: `https://api-staging.raut.app`

4. **Branch Configuration**
   - Production Branch: `main` (optional, won't deploy to Vercel)
   - Preview Branches: `staging` and all feature branches
   - Enable automatic deployments for `staging` branch

### Staging Deployment Flow
```
1. Push to `staging` branch
2. Vercel automatically builds and deploys
3. Get preview URL: https://raut-frontend-<hash>.vercel.app
4. Vercel runs: npm install → npm run build
```

---

## Production Deployment (Docker on VPS)

### Prerequisites on VPS

1. **Docker and Docker Compose installed**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo apt-get install docker-compose-plugin
   ```

2. **Create Docker network** (shared with backend)
   ```bash
   docker network create raut-network
   ```

3. **Set up deployment directory**
   ```bash
   sudo mkdir -p /opt/raut_frontend
   sudo chown -R $USER:$USER /opt/raut_frontend
   ```

4. **Create `.env.production` file**
   ```bash
   cd /opt/raut_frontend
   cp .env.production.example .env.production
   nano .env.production
   ```
   
   Add:
   ```bash
   VITE_API_URL=https://api.raut.app
   ```

### Production Deployment Flow
```
1. Push to `main` branch
2. Lint → Build verification
3. SSH into VPS
4. Pull latest code
5. Docker Compose build & deploy
6. Nginx serves on port 3000
```

### Docker Stack

- **Base Image:** `node:20-alpine` (builder) → `nginx:alpine` (production)
- **Build:** Multi-stage build (npm ci → vite build → nginx)
- **Config:** `nginx.conf` with SPA routing and security headers
- **Health Check:** Nginx health endpoint at `/health`
- **Network:** `raut-network` (external, shared with backend)

---

## Environment Variables

The frontend uses Vite, which requires environment variables to be prefixed with `VITE_`.

### Available Build-Time Variables

- `VITE_API_URL` - Backend API base URL

### Local Development

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:8000
```

See `.env.example` for template.

---

## Setting Up Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each required secret

### Required Secrets

```
VPS_HOST=<your-production-server-ip>
VPS_USER=ubuntu
VPS_SSH_KEY=<paste-private-key>
PAT_TOKEN=<github-personal-access-token>
```

### Creating a GitHub Personal Access Token

1. Go to GitHub **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Generate new token with `repo` scope
3. Copy token and add as `PAT_TOKEN` secret

---

## Build Artifacts

Each successful build uploads the `dist/` folder as an artifact:
- **Name:** `dist-<commit-sha>`
- **Retention:** 7 days
- **Use:** Can be downloaded from Actions tab for debugging

---

## Tech Stack

- **Node.js:** 20.x
- **Package Manager:** npm
- **Build Tool:** Vite 8.3
- **Framework:** React 19
- **Linter:** ESLint 10
- **Production Server:** Nginx (Alpine)
- **Container:** Docker with multi-stage build

---

## Troubleshooting

### Lint Failures
```bash
# Run locally
npm run lint

# Auto-fix
npm run lint -- --fix
```

### Build Failures
```bash
# Run locally
npm run build

# Preview production build
npm run preview
```

### Vercel Staging Issues

1. **Build fails on Vercel**
   - Check build logs in Vercel dashboard
   - Verify `VITE_API_URL` is set in environment variables
   - Ensure all dependencies are in `package.json` (not just `devDependencies`)

2. **Wrong API URL**
   - Update `VITE_API_URL` in Vercel project settings
   - Redeploy from Vercel dashboard

### Production Docker Deployment Issues

1. **SSH Connection Issues**
   - Verify `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` secrets
   - Test SSH access: `ssh -i key.pem user@host`

2. **Git Clone/Pull Failures**
   - Verify `PAT_TOKEN` is correct and has `repo` scope
   - Check token hasn't expired

3. **Docker Build Failures**
   - SSH into VPS: `ssh user@host`
   - Check logs: `cd /opt/raut_frontend && docker compose logs`
   - Verify `.env.production` exists with correct values

4. **Port Already in Use**
   - Check if port 3000 is available
   - Stop conflicting services: `docker ps` and `docker stop <container>`

5. **Container Not Starting**
   - Check container logs: `docker compose -f docker-compose.prod.yml logs frontend`
   - Verify nginx config: `docker exec raut-frontend nginx -t`

6. **Network Issues**
   - Ensure `raut-network` exists: `docker network ls`
   - Create if missing: `docker network create raut-network`

---

## Nginx Configuration

The production deployment uses Nginx with:

- **SPA Routing:** All routes serve `index.html`
- **Gzip Compression:** Enabled for text/js/css
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Cache Control:** 1-year cache for static assets, no-cache for HTML
- **Health Check:** `/health` endpoint returns 200

---

## Maintaining the Workflow

### Adding New Environment Variables

1. Add to `.env.production.example`
2. Update `.env.production` on VPS
3. Add to Vercel environment variables (for staging)
4. Add to Dockerfile `ARG` and `ENV` if needed
5. Document in this README

### Changing Port

Edit `docker-compose.prod.yml`:
```yaml
ports:
  - "NEW_PORT:80"
```

### Adding New Jobs

Follow this pattern:
```yaml
job-name:
  name: Job Display Name
  runs-on: ubuntu-latest
  needs: [lint, build]
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
    # ... rest of steps
```

---

## Architecture Diagram

```
GitHub Push (staging) → Vercel Auto-Deploy → https://raut-frontend-staging.vercel.app
                                            ↓
                                    VITE_API_URL (staging)

GitHub Push (main) → GitHub Actions → SSH to VPS → Docker Build & Deploy
                                                   ↓
                                            Nginx:3000 → https://raut.app
                                                   ↓
                                           VITE_API_URL (production)
```

---

## Related Documentation

- [Backend CI/CD](../../raut_backend/.github/workflows/README.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
