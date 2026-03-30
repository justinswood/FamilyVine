const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const { processImage, isImageSupported } = require('../utils/imageProcessor');
const logger = require('../config/logger');
const { validateId, validateMember, validateSearchQuery } = require('../middleware/validators');
const { geocodeLocation } = require('../services/geocodingService');
const memberService = require('../services/memberService');
const { sendMemberUpdateNotification } = require('../services/emailService');
const pool = require('../config/database');

// Send notification emails to subscribed users (non-blocking)
async function notifyMemberUpdate(member, action, updatedByUsername) {
  try {
    const subscribedUsers = await pool.query(`
      SELECT u.id, u.username, u.email
      FROM users u
      JOIN user_preferences up ON u.id = up.user_id
      WHERE up.email_notifications = true
        AND up.member_updates = true
        AND u.email IS NOT NULL
        AND u.email != ''
    `);

    for (const recipient of subscribedUsers.rows) {
      sendMemberUpdateNotification(
        { email: recipient.email, username: recipient.username },
        member,
        action,
        { username: updatedByUsername }
      ).catch(err => logger.error('Notification send failed', { error: err.message }));
    }
  } catch (error) {
    logger.error('Failed to send member update notifications', { error: error.message });
  }
}

// Fix: Use absolute path to ensure uploads go to backend/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (isImageSupported(file)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPG, PNG, GIF, WebP, HEIC)!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await memberService.getAllMembers(req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching members', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.get('/memory-counts', async (req, res) => {
  try {
    const counts = await memberService.getMemoryCounts();
    res.json(counts);
  } catch (error) {
    logger.error('Error fetching memory counts', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch memory counts' });
  }
});

router.get('/search', validateSearchQuery, async (req, res) => {
  try {
    const results = await memberService.searchMembers(req.query.q);
    res.json(results);
  } catch (error) {
    logger.error('Search error', { error: error.message });
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/living-with-coordinates', async (req, res) => {
  try {
    const result = await memberService.getLivingWithCoordinates();
    res.json(result);
  } catch (error) {
    logger.error('Error fetching living members with coordinates', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch member locations' });
  }
});

router.get('/migration-paths', async (req, res) => {
  try {
    const result = await memberService.getMigrationPaths();
    res.json(result);
  } catch (error) {
    logger.error('Error fetching migration paths', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch migration paths' });
  }
});

router.get('/:id', validateId('id'), async (req, res) => {
  try {
    const member = await memberService.getMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    logger.error('Error fetching member', { error: error.message, memberId: req.params.id });
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    // Process uploaded photo if present, or use gallery photo path
    let photo_url = req.body.photo_url || null;
    if (req.file) {
      const finalPath = path.join('uploads/', `profile_${Date.now()}`);
      const processResult = await processImage(req.file, finalPath);

      if (processResult.success) {
        photo_url = `uploads/${processResult.filename}`;
        logger.debug('Profile photo processed', { filename: processResult.filename, converted: processResult.wasConverted });
      } else {
        logger.error('Failed to process profile photo', { error: processResult.error });
      }
    }

    const newMember = await memberService.createMember(req.body, photo_url);

    // Geocode location in the background
    const location = req.body.location;
    if (location && location.trim()) {
      geocodeLocation(location.trim()).catch(err =>
        logger.error('Background geocoding failed for new member', { location, error: err.message })
      );
    }

    // Send notifications (non-blocking)
    notifyMemberUpdate(newMember, 'created', req.user?.username || 'System');

    res.status(201).json(newMember);
  } catch (err) {
    logger.error('Failed to add member', { error: err.message });
    res.status(500).json({ error: 'Failed to add member.' });
  }
});

router.put('/:id', validateId('id'), upload.single('photo'), async (req, res) => {
  logger.debug('Member update request', { memberId: req.params.id, hasFile: !!req.file });

  const { first_name, last_name, photo_url } = req.body;

  // Validate required fields
  if (!first_name || first_name.trim() === '') {
    return res.status(400).json({ error: 'First name is required and cannot be empty.' });
  }

  if (!last_name || last_name.trim() === '') {
    return res.status(400).json({ error: 'Last name is required and cannot be empty.' });
  }

  // Handle photo during update
  let finalPhotoUrl = photo_url || null;
  if (req.file) {
    try {
      const finalPath = path.join('uploads/', `profile_update_${Date.now()}`);
      const processResult = await processImage(req.file, finalPath);

      if (processResult.success) {
        finalPhotoUrl = `uploads/${processResult.filename}`;
        logger.debug('Profile photo updated', { filename: processResult.filename, converted: processResult.wasConverted });
      } else {
        logger.error('Failed to process updated profile photo', { error: processResult.error });
      }
    } catch (photoError) {
      logger.error('Error processing profile photo', { error: photoError.message });
    }
  }

  try {
    const memberId = parseInt(req.params.id);
    const updatedMember = await memberService.updateMember(memberId, req.body, finalPhotoUrl);

    // Geocode location in the background
    const location = req.body.location;
    if (location && location.trim()) {
      geocodeLocation(location.trim()).catch(err =>
        logger.error('Background geocoding failed for updated member', { location, error: err.message })
      );
    }

    logger.debug('Database update successful', { memberId: updatedMember.id });

    // Send notifications (non-blocking)
    notifyMemberUpdate(updatedMember, 'updated', req.user?.username || 'System');

    res.json(updatedMember);
  } catch (err) {
    logger.error('Database update error', { error: err.message, memberId: req.params.id });
    res.status(500).json({ error: 'Failed to update member.' });
  }
});

router.delete('/:id', validateId('id'), async (req, res) => {
  try {
    const deleted = await memberService.deleteMember(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete member', { error: err.message, memberId: req.params.id });
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// CSV import endpoint
router.post('/import-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];
    let rowNumber = 1;

    const requiredColumns = ['first_name', 'last_name'];
    const allowedColumns = [
      'first_name', 'middle_name', 'last_name', 'nickname', 'suffix', 'gender', 'birth_date',
      'birth_place', 'death_date', 'death_place', 'location', 'occupation',
      'email', 'phone', 'is_alive', 'relationship', 'pronouns',
      'is_married', 'marriage_date'
    ];

    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;

          const missingFields = requiredColumns.filter(field => !row[field] || row[field].trim() === '');
          if (missingFields.length > 0) {
            errors.push({ row: rowNumber, error: `Missing required fields: ${missingFields.join(', ')}`, data: row });
            return;
          }

          const memberData = {};
          allowedColumns.forEach(col => {
            if (row[col] !== undefined) {
              memberData[col] = row[col] || null;
            }
          });

          if (memberData.is_alive) {
            memberData.is_alive = ['true', 'yes', '1', 'y'].includes(memberData.is_alive.toLowerCase());
          } else {
            memberData.is_alive = true;
          }

          if (memberData.is_married) {
            memberData.is_married = ['true', 'yes', '1', 'y'].includes(memberData.is_married.toLowerCase());
          } else {
            memberData.is_married = false;
          }

          if (memberData.birth_date && !memberService.isValidDate(memberData.birth_date)) {
            errors.push({ row: rowNumber, error: 'Invalid birth_date format (use YYYY-MM-DD)', data: row });
            return;
          }

          if (memberData.death_date && !memberService.isValidDate(memberData.death_date)) {
            errors.push({ row: rowNumber, error: 'Invalid death_date format (use YYYY-MM-DD)', data: row });
            return;
          }

          if (memberData.marriage_date && !memberService.isValidDate(memberData.marriage_date)) {
            errors.push({ row: rowNumber, error: 'Invalid marriage_date format (use YYYY-MM-DD)', data: row });
            return;
          }

          results.push(memberData);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Delete the uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) logger.error('Error deleting temp file', { error: err.message });
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV contains errors',
        errors: errors,
        validRecords: results.length
      });
    }

    const { imported, errors: insertErrors } = await memberService.importFromCSV(results);

    res.json({
      success: true,
      message: `Successfully imported ${imported.length} members`,
      imported,
      errors: insertErrors,
      total: results.length
    });

  } catch (error) {
    logger.error('CSV import error', { error: error.message });
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Set a tagged photo as profile picture
router.put('/:id/profile-photo/:photoId', async (req, res) => {
  try {
    const member = await memberService.setProfilePhotoFromTag(req.params.id, req.params.photoId);
    res.json(member);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    logger.error('Error setting profile photo', { error: error.message });
    res.status(500).json({ error: 'Failed to set profile photo' });
  }
});

module.exports = router;
