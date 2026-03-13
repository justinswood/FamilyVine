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

// ─── Brand Design Tokens ───
const PARCHMENT = '#F9F8F3';
const VINE_GREEN = '#2E5A2E';
const VINE_DARK = '#2D4F1E';
const GOLD_LEAF = '#D4AF37';
const SAGE = '#86A789';
const BODY_TEXT = '#4A4A4A';
const MUTED_TEXT = '#7A7A7A';

const FONT_HEADER = "'Playfair Display', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// ─── Shared Template Helpers ───

/** Vine flourish SVG divider */
const vineDivider = `
<table role="presentation" width="100%" style="margin:24px 0">
  <tr>
    <td align="center">
      <svg width="120" height="20" viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto">
        <path d="M10 10 Q30 2 60 10 Q90 18 110 10" stroke="${SAGE}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <circle cx="60" cy="10" r="2.5" fill="${GOLD_LEAF}"/>
        <circle cx="35" cy="6" r="1.5" fill="${SAGE}"/>
        <circle cx="85" cy="14" r="1.5" fill="${SAGE}"/>
      </svg>
    </td>
  </tr>
</table>`;

/** CTA button */
function ctaButton(text, href) {
  return `
<table role="presentation" width="100%" style="margin:28px 0">
  <tr>
    <td align="center">
      <a href="${href}" style="display:inline-block;padding:14px 36px;background-color:${VINE_GREEN};color:#ffffff !important;text-decoration:none;border-radius:50px;font-family:${FONT_BODY};font-size:14px;font-weight:600;letter-spacing:0.3px;mso-padding-alt:14px 36px">${text}</a>
    </td>
  </tr>
</table>`;
}

/** Shared email wrapper — Archival Stationery layout */
function emailWrapper(title, bodyContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${PARCHMENT};font-family:${FONT_BODY};-webkit-font-smoothing:antialiased">
  <!-- Outer wrapper for email client background -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PARCHMENT}">
    <tr>
      <td align="center" style="padding:32px 16px">

        <!-- Main container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #E8E4DB;border-radius:4px">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding:36px 40px 20px 40px;border-bottom:1px solid #E8E4DB">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="${FRONTEND_URL}/logo.png" alt="FamilyVine" width="180" style="display:block;max-width:180px;height:auto" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:6px;font-family:${FONT_BODY};font-size:11px;color:${SAGE};letter-spacing:2px;text-transform:uppercase">
                    Connecting Generations
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section Title -->
          <tr>
            <td align="center" style="padding:28px 40px 8px 40px">
              <h1 style="margin:0;font-family:${FONT_HEADER};font-size:24px;font-weight:700;color:${VINE_DARK};letter-spacing:0.3px">${title}</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:8px 40px 32px 40px">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #E8E4DB;background-color:${PARCHMENT}">
              <!-- Vine flourish -->
              ${vineDivider}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-family:${FONT_HEADER};font-size:16px;color:${VINE_GREEN};font-weight:600;padding-bottom:8px">
                    FamilyVine
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:${FONT_BODY};font-size:12px;color:${MUTED_TEXT};line-height:1.6">
                    This is an automated message. Please do not reply to this email.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px">
                    <a href="${FRONTEND_URL}/settings?tab=notifications" style="font-family:${FONT_BODY};font-size:12px;color:${SAGE};text-decoration:underline">Manage notification preferences</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/** Vellum card with gold-leaf left border */
function vellumCard(content) {
  return `
<table role="presentation" width="100%" style="background-color:#ffffff;border:1px solid #E8E4DB;border-left:4px solid ${GOLD_LEAF};margin-bottom:12px" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:16px 20px">
      ${content}
    </td>
  </tr>
</table>`;
}

/** Info card with sage accent (for non-celebratory info) */
function infoCard(content) {
  return `
<table role="presentation" width="100%" style="background-color:${PARCHMENT};border:1px solid #E8E4DB;border-left:4px solid ${SAGE};margin-bottom:12px" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:16px 20px">
      ${content}
    </td>
  </tr>
</table>`;
}

// ─── Email Functions ───

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, username, resetToken) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const bodyContent = `
    <p style="font-family:${FONT_BODY};font-size:15px;color:${BODY_TEXT};line-height:1.7;margin:16px 0">
      Hello <strong style="color:${VINE_DARK}">${username}</strong>,
    </p>
    <p style="font-family:${FONT_BODY};font-size:15px;color:${BODY_TEXT};line-height:1.7;margin:16px 0">
      We received a request to reset the password for your FamilyVine account. Click the button below to choose a new password.
    </p>

    ${ctaButton('Reset Your Password', resetUrl)}

    <p style="font-family:${FONT_BODY};font-size:13px;color:${MUTED_TEXT};line-height:1.6;margin:16px 0">
      Or copy and paste this link into your browser:
    </p>
    <table role="presentation" width="100%" style="margin-bottom:20px">
      <tr>
        <td style="padding:12px 16px;background-color:${PARCHMENT};border:1px solid #E8E4DB;border-radius:4px;word-break:break-all;font-family:${FONT_BODY};font-size:13px;color:${MUTED_TEXT}">
          ${resetUrl}
        </td>
      </tr>
    </table>

    ${infoCard(`
      <p style="margin:0;font-family:${FONT_BODY};font-size:14px;color:${VINE_DARK};font-weight:600">
        This link will expire in 1 hour
      </p>
      <p style="margin:4px 0 0 0;font-family:${FONT_BODY};font-size:13px;color:${MUTED_TEXT}">
        For security, this reset link can only be used once and expires after 60 minutes.
      </p>
    `)}

    <p style="font-family:${FONT_BODY};font-size:14px;color:${MUTED_TEXT};line-height:1.6;margin:20px 0 0 0">
      If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>`;

  const mailOptions = {
    from: { name: 'FamilyVine', address: EMAIL_FROM },
    to: email,
    subject: 'Reset Your FamilyVine Password',
    text: `Hello ${username},\n\nYou requested to reset your FamilyVine password.\n\nReset link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n— FamilyVine`,
    html: emailWrapper('Reset Your Password', bodyContent),
  };

  return sendMail(mailOptions, 'Password reset', { to: email, username, resetUrl });
}

/**
 * Send welcome email to new users
 */
async function sendWelcomeEmail(email, username) {
  const loginUrl = `${FRONTEND_URL}/login`;

  const features = [
    { icon: '&#x1F333;', text: 'Build your family tree with unlimited members' },
    { icon: '&#x1F4F7;', text: 'Upload and organize family photos' },
    { icon: '&#x1F4D6;', text: 'Write and share family stories' },
    { icon: '&#x1F5FA;', text: 'Explore your family across the globe' },
    { icon: '&#x1F382;', text: 'Never miss a birthday or anniversary' },
  ];

  const featureRows = features.map(f => `
    <tr>
      <td style="padding:8px 0;font-family:${FONT_BODY};font-size:14px;color:${BODY_TEXT};line-height:1.6">
        <span style="margin-right:10px">${f.icon}</span> ${f.text}
      </td>
    </tr>`).join('');

  const bodyContent = `
    <p style="font-family:${FONT_BODY};font-size:15px;color:${BODY_TEXT};line-height:1.7;margin:16px 0">
      Hello <strong style="color:${VINE_DARK}">${username}</strong>,
    </p>
    <p style="font-family:${FONT_BODY};font-size:15px;color:${BODY_TEXT};line-height:1.7;margin:16px 0">
      Your FamilyVine account has been created. We're honored to help you preserve and share your family's story for generations to come.
    </p>

    ${ctaButton('Get Started', loginUrl)}

    ${vineDivider}

    <p style="font-family:${FONT_HEADER};font-size:18px;color:${VINE_DARK};font-weight:600;margin:20px 0 12px 0">
      What you can do
    </p>
    <table role="presentation" width="100%" style="background-color:${PARCHMENT};border:1px solid #E8E4DB;border-radius:4px;padding:4px 20px" cellpadding="0" cellspacing="0">
      ${featureRows}
    </table>

    <p style="font-family:${FONT_BODY};font-size:14px;color:${MUTED_TEXT};line-height:1.6;margin:24px 0 0 0">
      Every family has a story worth telling. Yours starts here.
    </p>`;

  const mailOptions = {
    from: { name: 'FamilyVine', address: EMAIL_FROM },
    to: email,
    subject: 'Welcome to FamilyVine',
    text: `Welcome to FamilyVine, ${username}!\n\nYour account has been created. Start building your family tree at ${loginUrl}\n\n— FamilyVine`,
    html: emailWrapper('Welcome to FamilyVine', bodyContent),
  };

  return sendMail(mailOptions, 'Welcome', { to: email, username });
}

/**
 * Send notification about member updates
 */
async function sendMemberUpdateNotification(recipient, member, action, updatedBy) {
  const memberName = `${member.first_name} ${member.last_name}`;
  const actionText = { created: 'added to', updated: 'updated in', deleted: 'removed from' }[action];
  const actionVerb = { created: 'added', updated: 'updated', deleted: 'removed' }[action];

  const details = [];
  if (member.birth_date) details.push(`<strong>Born:</strong> ${member.birth_date}`);
  if (member.location) details.push(`<strong>Location:</strong> ${member.location}`);

  const detailRows = details.map(d =>
    `<p style="margin:4px 0;font-family:${FONT_BODY};font-size:14px;color:${MUTED_TEXT}">${d}</p>`
  ).join('');

  const bodyContent = `
    <p style="font-family:${FONT_BODY};font-size:15px;color:${BODY_TEXT};line-height:1.7;margin:16px 0">
      Hello <strong style="color:${VINE_DARK}">${recipient.username}</strong>,
    </p>
    <p style="font-family:${FONT_BODY};font-size:15px;color:${BODY_TEXT};line-height:1.7;margin:16px 0">
      <strong style="color:${VINE_DARK}">${updatedBy.username}</strong> has ${actionText} the family tree:
    </p>

    ${vellumCard(`
      <p style="margin:0;font-family:${FONT_HEADER};font-size:18px;color:${VINE_DARK};font-weight:600">
        ${memberName}
      </p>
      <p style="margin:6px 0 0 0;font-family:${FONT_BODY};font-size:13px;color:${GOLD_LEAF};font-weight:600;text-transform:uppercase;letter-spacing:1px">
        ${actionVerb}
      </p>
      ${detailRows}
    `)}

    ${ctaButton('View Family Tree', `${FRONTEND_URL}/tree`)}`;

  const mailOptions = {
    from: { name: 'FamilyVine', address: EMAIL_FROM },
    to: recipient.email,
    subject: `Family Tree Update: ${memberName} ${actionVerb}`,
    text: `Hello ${recipient.username},\n\n${updatedBy.username} has ${actionText} the family tree:\n\n${memberName}${member.birth_date ? `\nBorn: ${member.birth_date}` : ''}${member.location ? `\nLocation: ${member.location}` : ''}\n\nView the tree: ${FRONTEND_URL}/tree\n\n— FamilyVine`,
    html: emailWrapper('Family Tree Update', bodyContent),
  };

  return sendMail(mailOptions, 'Member update', { to: recipient.email, member: memberName, action });
}

/**
 * Send birthday reminder digest
 */
async function sendBirthdayReminder(recipient, birthdays) {
  const count = birthdays.length;
  const plural = count !== 1;

  const birthdayCards = birthdays.map(m => {
    const name = `${m.first_name} ${m.last_name}`;
    const ageLine = m.turning_age
      ? `<span style="color:${GOLD_LEAF};font-weight:700">Turning ${m.turning_age}</span>`
      : '';
    const daysText = m.days_until === 0
      ? '<strong style="color:' + VINE_GREEN + '">Today!</strong>'
      : m.days_until === 1
        ? 'Tomorrow'
        : `in ${m.days_until} days`;

    // Circular member photo (matches family tree style)
    const photoUrl = m.photo_url ? `${FRONTEND_URL}/${m.photo_url}` : null;
    const photoHtml = photoUrl
      ? `<img src="${photoUrl}" alt="${name}" width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;border:2px solid ${GOLD_LEAF}" />`
      : `<div style="width:48px;height:48px;border-radius:50%;background-color:${PARCHMENT};border:2px solid ${SAGE};display:flex;align-items:center;justify-content:center">
          <span style="font-family:${FONT_HEADER};font-size:18px;color:${VINE_GREEN};font-weight:700;line-height:48px;text-align:center;display:block;width:48px">${m.first_name.charAt(0)}</span>
        </div>`;

    return vellumCard(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:60px;vertical-align:top;padding-right:14px">
            ${photoHtml}
          </td>
          <td style="vertical-align:top">
            <p style="margin:0;font-family:${FONT_HEADER};font-size:18px;color:${VINE_DARK};font-weight:600">
              ${name}
            </p>
            <p style="margin:6px 0 0 0;font-family:${FONT_BODY};font-size:14px;color:${MUTED_TEXT}">
              ${m.birth_date} &mdash; ${daysText}${ageLine ? ` &middot; ${ageLine}` : ''}
            </p>
          </td>
        </tr>
      </table>
    `);
  }).join('');

  const bodyContent = `
    <p style="font-family:${FONT_BODY};font-size:15px;color:${BODY_TEXT};line-height:1.7;margin:16px 0">
      Your family has <strong style="color:${VINE_DARK}">${count}</strong> upcoming birthday${plural ? 's' : ''} in the next 7 days:
    </p>

    ${birthdayCards}

    ${ctaButton('View Calendar', `${FRONTEND_URL}/calendar`)}

    ${vineDivider}

    <p style="font-family:${FONT_BODY};font-size:13px;color:${MUTED_TEXT};line-height:1.6;text-align:center;margin:0">
      Have a memory to share? <a href="${FRONTEND_URL}/stories/new" style="color:${VINE_GREEN};font-weight:600;text-decoration:underline">Write a birthday tribute</a> in the Family Anthology.
    </p>`;

  const birthdayLines = birthdays.map(m =>
    `${m.first_name} ${m.last_name} — ${m.birth_date} (in ${m.days_until} day${m.days_until !== 1 ? 's' : ''})${m.turning_age ? `, turning ${m.turning_age}` : ''}`
  );

  const mailOptions = {
    from: { name: 'FamilyVine', address: EMAIL_FROM },
    to: recipient.email,
    subject: `Upcoming Birthday${plural ? 's' : ''} in Your Family Tree`,
    text: `Your family has ${count} upcoming birthday${plural ? 's' : ''} in the next 7 days:\n\n${birthdayLines.join('\n')}\n\nView calendar: ${FRONTEND_URL}/calendar\n\n— FamilyVine`,
    html: emailWrapper('Upcoming Birthdays', bodyContent),
  };

  return sendMail(mailOptions, 'Birthday reminder', { to: recipient.email, count });
}

// ─── Send helper ───

async function sendMail(mailOptions, label, logContext) {
  if (!transporter) {
    logger.info(`${label} email would be sent (email service not configured)`, logContext);
    return true;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`${label} email sent`, { ...logContext, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error(`Failed to send ${label} email`, { ...logContext, error: error.message });
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendMemberUpdateNotification,
  sendBirthdayReminder,
};
