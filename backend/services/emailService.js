const nodemailer = require('nodemailer');
const { getEnvVar } = require('../config/env');
const logger = require('../config/logger');

// Email configuration
const EMAIL_SERVICE = getEnvVar('EMAIL_SERVICE', 'gmail');
const EMAIL_USER = getEnvVar('EMAIL_USER', null);
const EMAIL_PASSWORD = getEnvVar('EMAIL_PASSWORD', null);
const EMAIL_FROM = getEnvVar('EMAIL_FROM', EMAIL_USER);
const FRONTEND_URL = getEnvVar('FRONTEND_URL', 'http://192.168.1.171:3030');

// Create transporter
let transporter = null;

if (EMAIL_USER && EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Email service connection failed', { error: error.message });
    } else {
      logger.info('Email service ready', { service: EMAIL_SERVICE, user: EMAIL_USER });
    }
  });
} else {
  logger.warn('Email credentials not configured - emails will be logged only');
}

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} username - User's username
 * @param {string} resetToken - Password reset token
 * @returns {Promise<boolean>} Success status
 */
async function sendPasswordResetEmail(email, username, resetToken) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: {
      name: 'FamilyVine',
      address: EMAIL_FROM
    },
    to: email,
    subject: 'Reset Your FamilyVine Password',
    text: `
Hello ${username},

You recently requested to reset your password for your FamilyVine account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
The FamilyVine Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌳 FamilyVine</div>
      <h1 style="color: #1f2937; margin-top: 10px;">Reset Your Password</h1>
    </div>

    <p>Hello <strong>${username}</strong>,</p>

    <p>You recently requested to reset your password for your FamilyVine account.</p>

    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Your Password</a>
    </p>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 14px;">
      ${resetUrl}
    </p>

    <div class="warning">
      <strong>⏱️ This link will expire in 1 hour</strong> for security reasons.
    </div>

    <p style="margin-top: 30px;">If you did not request a password reset, please ignore this email.</p>

    <div class="footer">
      <p><strong>FamilyVine</strong> - Connecting Generations</p>
      <p style="font-size: 12px; color: #9ca3af;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  // If email not configured, log instead
  if (!transporter) {
    logger.info('Email would be sent (email service not configured)', {
      to: email,
      subject: mailOptions.subject,
      resetUrl
    });
    return true;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent successfully', {
      to: email,
      username,
      messageId: info.messageId
    });
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', {
      to: email,
      error: error.message
    });
    return false;
  }
}

/**
 * Send welcome email to new users
 * @param {string} email - Recipient email address
 * @param {string} username - User's username
 * @returns {Promise<boolean>} Success status
 */
async function sendWelcomeEmail(email, username) {
  const loginUrl = `${FRONTEND_URL}/login`;

  const mailOptions = {
    from: {
      name: 'FamilyVine',
      address: EMAIL_FROM
    },
    to: email,
    subject: 'Welcome to FamilyVine!',
    text: `
Welcome to FamilyVine, ${username}!

Your account has been successfully created. You can now start building your family tree and preserving your family's memories.

Login here: ${loginUrl}

Get started by:
- Adding family members
- Uploading photos and memories
- Creating your family tree
- Sharing stories with your family

If you have any questions, feel free to reach out.

Best regards,
The FamilyVine Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FamilyVine</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .features {
      background: #f9fafb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .feature {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    .feature:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌳</div>
      <h1 class="title">Welcome to FamilyVine!</h1>
    </div>

    <p>Hello <strong>${username}</strong>,</p>

    <p>Your account has been successfully created! We're excited to help you preserve and share your family's story.</p>

    <p style="text-align: center;">
      <a href="${loginUrl}" class="button">Get Started</a>
    </p>

    <div class="features">
      <h3 style="margin-top: 0; color: #1f2937;">Here's what you can do:</h3>
      <div class="feature">Build your family tree with unlimited members</div>
      <div class="feature">Upload and organize family photos</div>
      <div class="feature">Create and share family stories</div>
      <div class="feature">Visualize your family connections</div>
      <div class="feature">Preserve memories for future generations</div>
    </div>

    <p>If you have any questions or need help getting started, don't hesitate to reach out.</p>

    <div class="footer">
      <p><strong>FamilyVine</strong> - Connecting Generations</p>
      <p style="font-size: 12px; color: #9ca3af;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  if (!transporter) {
    logger.info('Welcome email would be sent (email service not configured)', {
      to: email,
      subject: mailOptions.subject
    });
    return true;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Welcome email sent successfully', {
      to: email,
      username,
      messageId: info.messageId
    });
    return true;
  } catch (error) {
    logger.error('Failed to send welcome email', {
      to: email,
      error: error.message
    });
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
