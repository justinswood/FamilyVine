# Preparing FamilyVine for GitHub

This guide helps you safely share FamilyVine on GitHub without exposing sensitive credentials.

---

## ✅ Files to Commit (Safe)

These files are **safe to commit** to GitHub:

### Configuration Templates
- ✅ `.env.example` - Template with placeholder values
- ✅ `.gitignore` - Ensures secrets stay private
- ✅ `docker-compose.yml` - Orchestration configuration
- ✅ `Dockerfile` files - Build instructions

### Documentation
- ✅ `README.md` - Main documentation
- ✅ `EMAIL_SETUP.md` - Email configuration guide
- ✅ `GITHUB_SETUP.md` - This file
- ✅ `backend/SENDGRID_SETUP.md` - Alternative email setup
- ✅ `backend/SWAGGER_SETUP.md` - API documentation setup
- ✅ `backend/migrations/README.md` - Database migration guide

### Source Code
- ✅ All `.js` and `.jsx` files
- ✅ All `.css` files
- ✅ `package.json` and `package-lock.json`
- ✅ Database migrations (`backend/migrations/*.sql`)
- ✅ Configuration files (`backend/config/*.js`)
- ✅ Service files (`backend/services/*.js`)
- ✅ All frontend components and pages

---

## ❌ Files to NEVER Commit (Secrets)

These files contain **sensitive information** and should **NEVER** be committed:

### Secrets & Credentials
- ❌ `.env` - Contains actual passwords and API keys
- ❌ `.env.local` - Local development secrets
- ❌ `.env.production` - Production secrets

### Generated Files
- ❌ `node_modules/` - Dependencies (installed via npm)
- ❌ `build/` or `dist/` - Compiled frontend
- ❌ `uploads/` - User-uploaded photos
- ❌ `*.log` - Log files

### Database
- ❌ `data/` - Database files and uploads
- ❌ `*.sqlite`, `*.db` - Database files

---

## Verify .gitignore

Check that your `.gitignore` includes:

```bash
cat .gitignore
```

Should contain at least:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.*.local

# Dependencies
node_modules/
package-lock.json.bak

# Build output
build/
dist/

# User uploads
uploads/
data/

# Logs
*.log
npm-debug.log*
logs/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

---

## Before Pushing to GitHub

### 1. Check for Secrets

```bash
# Search for potential secrets (should return nothing sensitive)
grep -r "password" .env.example
grep -r "secret" .env.example
grep -r "@gmail.com" backend/ frontend/
```

### 2. Test Clean Install

```bash
# Clone to a new directory
cd /tmp
git clone /opt/familyvine familyvine-test
cd familyvine-test

# Verify .env.example exists
ls -la .env.example

# Verify .env does NOT exist
ls -la .env  # Should show "No such file"
```

### 3. Verify Documentation

Ensure these files exist and are helpful:

- README.md with setup instructions
- .env.example with all required variables
- EMAIL_SETUP.md for email configuration
- Clear instructions for database setup

---

## For New Users (From GitHub)

When someone clones your repository, they should:

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -hex 64

# Generate database password
openssl rand -base64 32
```

### 3. Edit .env

```bash
nano .env
```

Fill in:
- `DB_PASSWORD` - Generated secure password
- `JWT_SECRET` - Generated secure secret
- `EMAIL_USER` - Their Gmail (optional)
- `EMAIL_PASSWORD` - Their Gmail App Password (optional)

### 4. Run the Application

```bash
docker build -t familyvine_backend:latest ./backend
docker build -t familyvine-frontend:latest ./frontend

# Then start containers...
```

---

## README.md Template

Make sure your README.md includes:

```markdown
# FamilyVine

A beautiful family tree and memory preservation application.

## Features

- 🌳 Interactive family tree visualization
- 📸 Photo gallery and albums
- 📖 Family stories and memories
- 🔐 Secure password reset with email
- 👥 User authentication and roles
- 📱 Responsive design

## Quick Start

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/familyvine.git
   cd familyvine
   \`\`\`

2. **Configure environment**
   \`\`\`bash
   cp .env.example .env
   nano .env  # Fill in your values
   \`\`\`

3. **Generate secrets**
   \`\`\`bash
   # JWT Secret
   openssl rand -hex 64

   # Database Password
   openssl rand -base64 32
   \`\`\`

4. **Build and run**
   \`\`\`bash
   docker build -t familyvine_backend:latest ./backend
   docker build -t familyvine-frontend:latest ./frontend
   docker run -d --name familyvine-backend-1 ...
   \`\`\`

5. **Apply database migrations**
   \`\`\`bash
   docker exec -i familyvine-db-1 psql -U user -d familytree < backend/migrations/001_add_performance_indexes.sql
   docker exec -i familyvine-db-1 psql -U user -d familytree < backend/migrations/002_add_password_reset.sql
   \`\`\`

## Configuration

### Email (Optional)

See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed instructions.

Quick setup with Gmail:
1. Get App Password: https://myaccount.google.com/apppasswords
2. Add to .env: `EMAIL_USER=yourname@gmail.com`
3. Add App Password: `EMAIL_PASSWORD=abcd efgh ijkl mnop`
4. Restart backend

### Database

PostgreSQL 14 is used. Configuration in .env:
- `DB_NAME=familytree`
- `DB_USER=user`
- `DB_PASSWORD=your_secure_password`

## Documentation

- [Email Setup Guide](EMAIL_SETUP.md)
- [GitHub Setup Guide](GITHUB_SETUP.md)
- [Database Migrations](backend/migrations/README.md)
- [API Documentation Setup](backend/SWAGGER_SETUP.md)

## Security

- Never commit .env file
- Use strong passwords for database and JWT
- Use Gmail App Passwords (not main password)
- Keep dependencies updated
- Run behind HTTPS in production

## License

MIT License - See LICENSE file

## Support

For issues or questions, please open an issue on GitHub.
\`\`\`

---

## Git Commands for First Push

```bash
# Initialize git (if not already done)
cd /opt/familyvine
git init

# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status

# Verify no secrets are staged
git diff --cached | grep -i password
git diff --cached | grep -i secret

# Create initial commit
git commit -m "Initial commit: FamilyVine family tree application

- Family tree visualization
- Photo galleries and albums
- User authentication with password reset
- Email integration (Gmail SMTP)
- Database migrations
- Comprehensive documentation"

# Add remote repository
git remote add origin https://github.com/yourusername/familyvine.git

# Push to GitHub
git push -u origin main
```

---

## Post-Push Checklist

After pushing to GitHub:

- [ ] Verify .env is NOT visible on GitHub
- [ ] Verify .env.example IS visible and complete
- [ ] Test cloning repository to new location
- [ ] Follow your own README to ensure it works
- [ ] Check that EMAIL_SETUP.md is accessible
- [ ] Verify all documentation links work
- [ ] Add a LICENSE file
- [ ] Consider adding CONTRIBUTING.md
- [ ] Add screenshots to README
- [ ] Test the setup instructions

---

## Important Reminders

1. **Never commit .env** - It's in .gitignore, but always double-check
2. **Rotate secrets** - If you accidentally commit secrets, rotate them immediately
3. **Document everything** - Clear docs help others use your project
4. **Test clean install** - Clone your repo elsewhere and verify setup works
5. **Keep .env.example updated** - When adding new env vars, update the example

---

## If You Accidentally Commit Secrets

If you accidentally push credentials to GitHub:

1. **Immediately rotate all secrets:**
   - Change database password
   - Generate new JWT secret
   - Create new Gmail App Password
   - Update .env with new values

2. **Remove from Git history:**
   ```bash
   # Use BFG Repo-Cleaner or git-filter-branch
   # See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
   ```

3. **Push the cleaned history:**
   ```bash
   git push --force
   ```

4. **Verify GitHub doesn't show the secrets anymore**

---

**Your repository is now ready for GitHub! 🎉**

New users can clone it, configure their own credentials, and run their own FamilyVine instance.
