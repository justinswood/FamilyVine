# SendGrid Email Service Setup Guide

This guide will help you set up SendGrid for sending password reset and welcome emails in FamilyVine.

## Why SendGrid?

- **Free Tier**: 100 emails/day forever free
- **Reliable**: 99%+ delivery rate
- **Easy Setup**: Simple API integration
- **Professional**: Proper email authentication (SPF, DKIM)
- **Analytics**: Track email opens, clicks, and bounces

---

## Step 1: Create SendGrid Account

1. Go to https://sendgrid.com/
2. Click "Start for Free" or "Sign Up"
3. Fill in your details:
   - Email address
   - Password
   - Company name (can be "Personal" or "FamilyVine")
4. Verify your email address
5. Complete the onboarding questionnaire

---

## Step 2: Create an API Key

1. Log in to SendGrid
2. Go to **Settings** → **API Keys** (left sidebar)
3. Click **"Create API Key"**
4. Configure the key:
   - **Name**: `FamilyVine Production`
   - **Permissions**: Select **"Restricted Access"**
   - Enable only: **Mail Send** → **Full Access**
5. Click **"Create & View"**
6. **IMPORTANT**: Copy the API key immediately (you won't see it again!)
7. Save it somewhere secure temporarily

---

## Step 3: Sender Authentication (Required)

SendGrid requires sender verification to prevent spam. You have two options:

### Option A: Single Sender Verification (Easiest)

1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Name**: FamilyVine
   - **From Email Address**: noreply@yourdomain.com (or your Gmail)
   - **Reply To**: your-email@example.com
   - **Company Address**: Your address
4. Click **"Create"**
5. Check your email and click the verification link

**Note**: If using Gmail/personal email, you may get spam warnings. For production, use a custom domain.

### Option B: Domain Authentication (Recommended for Production)

1. Go to **Settings** → **Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Follow the DNS setup instructions for your domain
4. This prevents emails from going to spam

---

## Step 4: Configure FamilyVine

1. **Add API Key to Environment Variables**

   Edit `/opt/familyvine/.env`:
   ```bash
   nano /opt/familyvine/.env
   ```

   Add your SendGrid API key:
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=http://192.168.1.171:3030
   ```

   **Important**:
   - Replace `SG.xxx...` with your actual API key
   - Replace `noreply@yourdomain.com` with your verified sender email
   - Update `FRONTEND_URL` if different

2. **Install SendGrid Package**

   ```bash
   cd /opt/familyvine/backend
   docker exec -it familyvine-backend-1 npm install @sendgrid/mail
   ```

   Or rebuild the backend container (includes the package):
   ```bash
   docker build -t familyvine_backend:latest ./backend
   docker restart familyvine-backend-1
   ```

3. **Restart Backend**

   ```bash
   docker restart familyvine-backend-1
   ```

4. **Verify Setup**

   Check logs to confirm SendGrid initialized:
   ```bash
   docker logs familyvine-backend-1 | grep "SendGrid"
   ```

   You should see:
   ```
   SendGrid email service initialized
   ```

---

## Step 5: Test Email Sending

### Test Password Reset Email

```bash
curl -X POST http://192.168.1.171:5050/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

Check:
1. Your email inbox (may take 1-2 minutes)
2. Spam folder if not in inbox
3. Backend logs: `docker logs familyvine-backend-1 | grep "Password reset"`

### Test Welcome Email

Register a new user and check for the welcome email.

---

## Email Templates Included

### 1. Password Reset Email
- **Subject**: Reset Your FamilyVine Password
- **Features**:
  - Clear reset button
  - 1-hour expiration warning
  - Copy-paste link option
  - Security notice
  - Responsive HTML design

### 2. Welcome Email
- **Subject**: Welcome to FamilyVine!
- **Features**:
  - Friendly welcome message
  - Feature list
  - Login button
  - Getting started guide

---

## Troubleshooting

### Emails Going to Spam

**Solution 1**: Use Domain Authentication (Option B above)

**Solution 2**: Warm up your sender reputation
- Start with small volumes
- Ask recipients to mark as "Not Spam"
- Ensure SendGrid sender is verified

### "Unauthorized" Error

```
Error: Unauthorized
```

**Causes**:
- API key is incorrect
- API key doesn't have Mail Send permission
- API key was deleted/regenerated

**Fix**: Create a new API key and update `.env`

### "From Email Not Verified"

```
Error: The from address does not match a verified Sender Identity
```

**Fix**:
1. Go to SendGrid → Sender Authentication
2. Verify the email address in `SENDGRID_FROM_EMAIL`
3. Wait for verification email and click the link

### Emails Not Sending

**Check logs**:
```bash
docker logs familyvine-backend-1 | tail -50
```

Look for:
- `SendGrid email service initialized` - Good!
- `Failed to send password reset email` - Check error details
- `SendGrid API key not configured` - Add API key to `.env`

**Verify configuration**:
```bash
docker exec familyvine-backend-1 env | grep SENDGRID
```

Should show your API key and from email.

---

## SendGrid Dashboard

Monitor your emails:

1. **Activity Feed**: See all sent emails
   - Go to **Email API** → **Activity Feed**
   - View delivery status, opens, clicks

2. **Statistics**: View metrics
   - Go to **Stats** → **Overview**
   - See delivery rates, bounce rates

3. **Suppressions**: Manage bounces/spam reports
   - Go to **Suppressions** → **Blocks/Bounces/Spam Reports**
   - Remove addresses if needed

---

## Best Practices

### 1. Protect Your API Key
- Never commit API keys to Git
- Store in `.env` file only
- Rotate keys periodically
- Use restricted permissions

### 2. Monitor Email Limits
- **Free Tier**: 100 emails/day
- **Upgrade if needed**: $19.95/month for 50,000 emails

### 3. Handle Bounces
- Check bounce reports monthly
- Remove invalid email addresses
- Maintain good sender reputation

### 4. Email Content
- Keep subject lines clear and concise
- Always include unsubscribe option (for marketing emails)
- Test emails before sending to users

---

## Upgrading SendGrid (Optional)

If you need more than 100 emails/day:

1. Go to **Settings** → **Your Products**
2. Click **"Upgrade"**
3. Choose a plan:
   - **Essentials**: $19.95/mo - 50,000 emails
   - **Pro**: $89.95/mo - 100,000 emails

---

## Alternative: Using Gmail SMTP (Not Recommended)

If you can't use SendGrid, you can configure Gmail SMTP:

**Pros**: Free, easy setup
**Cons**: 500 emails/day limit, may get flagged as spam, less reliable

See `GMAIL_SMTP_SETUP.md` for instructions (to be created if needed).

---

## Support

- **SendGrid Docs**: https://docs.sendgrid.com/
- **SendGrid Support**: https://support.sendgrid.com/
- **API Status**: https://status.sendgrid.com/

---

## Summary Checklist

- [ ] Created SendGrid account
- [ ] Generated API key with Mail Send permission
- [ ] Verified sender email address
- [ ] Added `SENDGRID_API_KEY` to `.env`
- [ ] Set `SENDGRID_FROM_EMAIL` to verified sender
- [ ] Installed `@sendgrid/mail` package
- [ ] Restarted backend container
- [ ] Tested password reset email
- [ ] Checked SendGrid activity feed
- [ ] Verified emails aren't going to spam

Once all items are checked, your email service is fully operational! 🎉
