# RAUT Frontend CI/CD

This directory contains GitHub Actions workflows for the RAUT frontend application.

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

#### 3. **Deploy to Staging**
Runs on push to `staging` branch after lint and build pass.

- Builds with staging environment variables
- Deploys to staging server via SCP

**Required Secrets:**
- `STAGING_API_URL` - Backend API URL for staging
- `STAGING_HOST` - Staging server hostname/IP
- `STAGING_USER` - SSH username for staging
- `STAGING_SSH_KEY` - SSH private key for staging

**Deploy Location:** `/var/www/raut-frontend-staging`

#### 4. **Deploy to Production**
Runs on push to `main` branch after lint and build pass.

- Builds with production environment variables
- Deploys to production server via SCP

**Required Secrets:**
- `PRODUCTION_API_URL` - Backend API URL for production
- `PRODUCTION_HOST` - Production server hostname/IP
- `PRODUCTION_USER` - SSH username for production
- `PRODUCTION_SSH_KEY` - SSH private key for production

**Deploy Location:** `/var/www/raut-frontend`

---

## Environment Variables

The frontend uses Vite, which requires environment variables to be prefixed with `VITE_`.

### Available Build-Time Variables

- `VITE_API_URL` - Backend API base URL (set via GitHub Secrets)

### Local Development

Create a `.env` file for local development:

```bash
VITE_API_URL=http://localhost:8000
```

See `.env.example` for template.

---

## Setting Up Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each required secret listed above

### Example Values

```
STAGING_API_URL=https://api-staging.raut.app
STAGING_HOST=staging.raut.app
STAGING_USER=ubuntu
STAGING_SSH_KEY=<paste your private SSH key>

PRODUCTION_API_URL=https://api.raut.app
PRODUCTION_HOST=production.raut.app
PRODUCTION_USER=ubuntu
PRODUCTION_SSH_KEY=<paste your private SSH key>
```

---

## Deployment Flow

### Staging Deployment
```
1. Push to `staging` branch
2. Lint → Build with staging env
3. Deploy to /var/www/raut-frontend-staging
4. Notification sent
```

### Production Deployment
```
1. Push to `main` branch
2. Lint → Build with production env
3. Deploy to /var/www/raut-frontend
4. Notification sent
```

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

### Deployment Failures

1. **SSH Connection Issues**
   - Verify `STAGING/PRODUCTION_HOST` is correct
   - Verify `STAGING/PRODUCTION_USER` has SSH access
   - Verify `STAGING/PRODUCTION_SSH_KEY` is correct private key

2. **Permission Issues**
   - Ensure deploy user has write access to `/var/www/raut-frontend*`
   - Run: `sudo chown -R <user>:<user> /var/www/raut-frontend*`

3. **Build Fails in CI but works locally**
   - Check if `.env` variables are set as secrets
   - Verify secrets are using correct names (`VITE_` prefix)

---

## Maintaining the Workflow

### Adding New Environment Variables

1. Add to `.env.example`
2. Add to workflow YAML under `env:` in build steps
3. Add to GitHub Secrets
4. Document in this README

### Changing Deploy Location

Edit the `target:` parameter in the SCP action:

```yaml
target: "/var/www/your-new-path"
```

### Adding New Jobs

Follow this pattern:
```yaml
job-name:
  name: Job Display Name
  runs-on: ubuntu-latest
  needs: [lint, build]  # Dependencies
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
    # ... rest of steps
```

---

## Related Documentation

- [Backend CI/CD](../../raut_backend/.github/workflows/README.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode)
