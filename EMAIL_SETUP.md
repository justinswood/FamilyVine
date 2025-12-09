# Email Configuration Guide

FamilyVine can send beautiful HTML emails for password resets and welcome messages. Email configuration is **optional** - the app works without it, but email features will be logged instead of sent.

---

## Quick Start (Gmail)

**Time: 5 minutes**

### 1. Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. If you don't see "App passwords":
   - Enable 2-Step Verification: https://myaccount.google.com/security
   - Then return to App passwords
3. Create an app password:
   - Select "Mail" or "Other (Custom)"
   - Name it "FamilyVine"
   - Click "Generate"
4. Copy the 16-character password (ignore spaces)

### 2. Configure FamilyVine

Edit your `.env` file:

```bash
cp .env.example .env
nano .env
```

Update these lines:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=yourname@gmail.com
FRONTEND_URL=http://your-server-ip:3030
```

### 3. Restart Backend

```bash
docker restart familyvine-backend-1
```

### 4. Test It

Request a password reset - check your email inbox (or spam folder)!

---

## Email Features

When configured, FamilyVine sends:

### 🔑 Password Reset Emails
- Subject: "Reset Your FamilyVine Password"
- Beautiful HTML template with gradient design
- One-click reset button
- 1-hour expiration security
- Sent when users click "Forgot Password?"

### 👋 Welcome Emails
- Subject: "Welcome to FamilyVine!"
- Friendly onboarding message
- Feature overview
- Getting started guide
- Sent automatically when new users register

---

## Without Email Configuration

If you don't configure email (leave `EMAIL_USER` and `EMAIL_PASSWORD` empty):

- ✅ App works normally
- ✅ Password reset tokens are still generated
- ✅ Tokens are logged to backend console
- ⚠️ No emails sent - must retrieve tokens from logs

**To get reset tokens from logs:**

```bash
docker logs familyvine-backend-1 | grep "Password reset token"
```

---

## Alternative Email Providers

### Option 1: Outlook/Hotmail

```env
EMAIL_SERVICE=hotmail
EMAIL_USER=yourname@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=yourname@outlook.com
```

### Option 2: Yahoo

```env
EMAIL_SERVICE=yahoo
EMAIL_USER=yourname@yahoo.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=yourname@yahoo.com
```

### Option 3: Custom SMTP Server

For advanced users, edit `backend/services/emailService.js` to configure custom SMTP:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com',
    pass: 'your-password'
  }
});
```

---

## Email Limits

### Gmail
- **Free**: 500 emails/day
- **Perfect for**: Family apps, small communities
- **Limits**: May be flagged as spam without domain verification

### Outlook
- **Free**: 300 emails/day
- Similar limitations to Gmail

### Professional Services (Paid)

For higher volume or better deliverability:

- **SendGrid**: 100 emails/day free, then $19.95/mo for 50,000
- **Mailgun**: 5,000 emails/month free
- **AWS SES**: $0.10 per 1,000 emails

See `backend/SENDGRID_SETUP.md` for SendGrid configuration.

---

## Troubleshooting

### Emails Not Sending

**Check backend logs:**
```bash
docker logs familyvine-backend-1 | grep -i email
```

**Look for:**
- `Email service ready` - ✅ Configured correctly
- `Email credentials not configured` - ⚠️ Missing credentials
- `Email service connection failed` - ❌ Wrong credentials

### "Invalid credentials" Error

1. **Gmail users**: Make sure you're using an **App Password**, not your regular Gmail password
2. **2-Step Verification**: Must be enabled for Gmail App Passwords
3. **Check credentials**: Ensure no extra spaces in `.env` file

### Emails Going to Spam

**Solutions:**
1. Ask recipients to mark as "Not Spam"
2. Use a verified domain (advanced)
3. Start with small volumes to build sender reputation
4. Consider professional email services (SendGrid, etc.)

### "Module not found: nodemailer"

**Fix:**
```bash
cd /opt/familyvine
docker build -t familyvine_backend:latest ./backend
docker restart familyvine-backend-1
```

---

## Security Best Practices

### ✅ DO:
- Use App Passwords for Gmail (never your main password)
- Keep `.env` file private and never commit it to Git
- Use strong database and JWT secrets
- Rotate email passwords periodically
- Use different passwords for each service

### ❌ DON'T:
- Commit `.env` to version control
- Share your email credentials
- Use your main Gmail password
- Hardcode credentials in code
- Reuse passwords across services

---

## Email Templates

The email templates are located in:
```
backend/services/emailService.js
```

### Customizing Templates

You can modify:
- **Colors**: Change the gradient colors in the CSS
- **Logo**: Update the 🌳 emoji or add an image URL
- **Content**: Edit the email copy and structure
- **From Name**: Change `from: { name: 'FamilyVine', ... }`

### Adding New Email Types

See `emailService.js` for examples. Follow the pattern:

```javascript
async function sendYourEmail(email, data) {
  const mailOptions = {
    from: { name: 'FamilyVine', address: EMAIL_FROM },
    to: email,
    subject: 'Your Subject',
    html: `...your HTML template...`
  };

  await transporter.sendMail(mailOptions);
}
```

---

## Testing

### Test Password Reset Email

```bash
curl -X POST http://localhost:5050/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### Test Welcome Email

Register a new user account and check your inbox.

### Development Mode

Set `NODE_ENV=development` in `.env` to:
- See reset tokens in API responses
- Get detailed logging
- Display tokens on frontend (for testing)

---

## Support

- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Nodemailer Docs**: https://nodemailer.com/
- **Email Deliverability**: https://www.mail-tester.com/

---

## FAQ

**Q: Is email required?**
A: No, it's optional. The app works without email, but you'll need to retrieve tokens from logs.

**Q: Can I use a free email service?**
A: Yes! Gmail, Outlook, and Yahoo all work for small-scale family use.

**Q: Will my emails go to spam?**
A: Possibly at first. Recipients should mark as "Not Spam" to improve deliverability.

**Q: How many emails can I send?**
A: Gmail allows 500/day, which is plenty for a family app.

**Q: Can I use a custom domain?**
A: Yes, but it requires more setup. See professional services (SendGrid, etc.) or configure custom SMTP.

**Q: Is it secure?**
A: Yes, when using App Passwords. Never use your main password, and keep `.env` private.

---

## Quick Reference

```bash
# Generate secure JWT secret
openssl rand -hex 64

# View email logs
docker logs familyvine-backend-1 | grep -i email

# Test email configuration
docker logs familyvine-backend-1 | grep "Email service"

# Restart after configuration
docker restart familyvine-backend-1

# Get password reset tokens (no email)
docker logs familyvine-backend-1 | grep "Password reset token"
```

---

**Ready to configure email? Start with the Quick Start guide at the top!**
