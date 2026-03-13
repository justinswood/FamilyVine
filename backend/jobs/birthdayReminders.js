const cron = require('node-cron');
const pool = require('../config/database');
const logger = require('../config/logger');
const { sendBirthdayReminder } = require('../services/emailService');

/**
 * Check for upcoming birthdays and send reminders.
 * Runs daily at 9:00 AM.
 */
function startBirthdayReminderJob() {
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('Running birthday reminder job');

      // Members with birthdays in the next 7 days (include age calculation)
      const upcomingBirthdays = await pool.query(`
        SELECT
          id, first_name, last_name, photo_url,
          TO_CHAR(birth_date, 'Mon DD') AS birth_date_display,
          EXTRACT(YEAR FROM AGE(
            DATE(
              EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
              EXTRACT(MONTH FROM birth_date) || '-' ||
              EXTRACT(DAY FROM birth_date)
            ),
            birth_date
          ))::int AS turning_age,
          (
            DATE(
              EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
              EXTRACT(MONTH FROM birth_date) || '-' ||
              EXTRACT(DAY FROM birth_date)
            ) - CURRENT_DATE
          )::int AS days_until
        FROM members
        WHERE birth_date IS NOT NULL
          AND is_alive = true
          AND first_name != 'Unknown'
          AND (
            DATE(
              EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
              EXTRACT(MONTH FROM birth_date) || '-' ||
              EXTRACT(DAY FROM birth_date)
            ) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          )
        ORDER BY days_until ASC
      `);

      if (upcomingBirthdays.rows.length === 0) {
        logger.info('No upcoming birthdays in next 7 days');
        return;
      }

      // Users who opted in to notifications
      const subscribedUsers = await pool.query(`
        SELECT u.id, u.username, u.email, up.default_root_member_id
        FROM users u
        JOIN user_preferences up ON u.id = up.user_id
        WHERE up.email_notifications = true
          AND up.member_updates = true
          AND u.email IS NOT NULL
          AND u.email != ''
      `);

      if (subscribedUsers.rows.length === 0) {
        logger.info('No users subscribed to birthday notifications');
        return;
      }

      // Format birthdays for email
      const formatted = upcomingBirthdays.rows.map(m => ({
        ...m,
        birth_date: m.birth_date_display,
      }));

      for (const recipient of subscribedUsers.rows) {
        await sendBirthdayReminder(
          { email: recipient.email, username: recipient.username },
          formatted
        );
      }

      logger.info('Birthday reminders sent', {
        birthdayCount: upcomingBirthdays.rows.length,
        recipientCount: subscribedUsers.rows.length,
      });
    } catch (error) {
      logger.error('Birthday reminder job failed', { error: error.message });
    }
  });

  logger.info('Birthday reminder job scheduled (daily at 9:00 AM)');
}

module.exports = { startBirthdayReminderJob };
