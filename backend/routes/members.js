const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');
const fs = require('fs');

const pool = new Pool({
  user: 'user',
  host: 'db',
  database: 'familytree',
  password: 'pass',
  port: 5432,
});

// Fix: Use absolute path to ensure uploads go to backend/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to parse dates properly (fixes timezone issues)
const parseDate = (dateStr) => {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return null;

  // Handle various input formats
  let dateInput = dateStr.toString();

  // If the input contains 'T' (ISO format), strip the time part
  if (dateInput.includes('T')) {
    dateInput = dateInput.split('T')[0];
  }

  // If the input contains 'Z' or timezone info, handle it
  if (dateInput.includes('Z') || dateInput.match(/[+-]\d{2}:\d{2}$/)) {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  // Check if it's already in YYYY-MM-DD format
  if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateInput;
  }

  // Try to parse as date and format
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn(`Could not parse date: ${dateStr}`);
  }

  return null;
};

/**
 * Helper function to automatically link spouses
 * When Person A marries Person B, this ensures Person B also shows as married to Person A
 */
const linkSpouses = async (memberId, spouseId, marriageDate) => {
  try {
    // Only proceed if we have both member IDs
    if (!memberId || !spouseId) return;

    console.log(`Linking spouses: Member ${memberId} ↔ Member ${spouseId}`);

    // Update the spouse to also show they're married to this member
    const updateSpouseQuery = `
      UPDATE members 
      SET is_married = true, 
          spouse_id = $1, 
          marriage_date = $2
      WHERE id = $3 AND (spouse_id IS NULL OR spouse_id != $1)
    `;

    await pool.query(updateSpouseQuery, [memberId, marriageDate, spouseId]);
    console.log(`Successfully linked spouse ${spouseId} to member ${memberId}`);

  } catch (error) {
    console.error('Error linking spouses:', error);
    // Don't throw the error - we want the main operation to succeed even if spouse linking fails
  }
};

/**
 * Helper function to unlink spouses when marriage status changes
 */
const unlinkSpouses = async (memberId, oldSpouseId) => {
  try {
    if (!oldSpouseId) return;

    console.log(`Unlinking spouse: removing marriage link from member ${oldSpouseId}`);

    // Remove the marriage link from the old spouse
    const unlinkQuery = `
      UPDATE members 
      SET is_married = false, 
          spouse_id = NULL, 
          marriage_date = NULL
      WHERE id = $1 AND spouse_id = $2
    `;

    await pool.query(unlinkQuery, [oldSpouseId, memberId]);
    console.log(`Successfully unlinked spouse ${oldSpouseId}`);

  } catch (error) {
    console.error('Error unlinking spouse:', error);
  }
};

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM members ORDER BY id DESC');
  res.json(result.rows);
});

router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM members WHERE id = $1', [req.params.id]);
  res.json(result.rows[0]);
});

// UPDATED POST route with marriage fields and automatic spouse linking
router.post('/', upload.single('photo'), async (req, res) => {
  const {
    first_name, middle_name, last_name, relationship,
    gender, is_alive, birth_date, death_date,
    birth_place, death_place, location,
    occupation, pronouns, email, phone,
    is_married, marriage_date, spouse_id  // NEW: Add marriage fields
  } = req.body;

  // Fix: Store path without leading slash
  const photo_url = req.file ? `uploads/${req.file.filename}` : null;

  try {
    // First, create the new member
    const result = await pool.query(
      'INSERT INTO members (first_name, middle_name, last_name, relationship, gender, is_alive, birth_date, death_date, birth_place, death_place, location, occupation, pronouns, email, phone, photo_url, is_married, marriage_date, spouse_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *',
      [
        first_name, middle_name, last_name, relationship, gender, is_alive === 'true',
        parseDate(birth_date), parseDate(death_date), // Fix: Use parseDate function
        birth_place || null, death_place || null,
        location || null, occupation || null, pronouns || null, email || null, phone || null, photo_url,
        is_married === 'true',  // NEW: Convert to boolean
        parseDate(marriage_date),  // NEW: Parse marriage date
        spouse_id ? parseInt(spouse_id) : null  // NEW: Convert to integer or null
      ]
    );

    const newMember = result.rows[0];

    // NEW: If they're married and have a spouse, link them automatically
    if (is_married === 'true' && spouse_id) {
      await linkSpouses(newMember.id, parseInt(spouse_id), parseDate(marriage_date));
    }

    res.status(201).json(newMember);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member.' });
  }
});

// UPDATED PUT route with marriage fields and automatic spouse linking
router.put('/:id', upload.single('photo'), async (req, res) => {
  console.log('=== MEMBER UPDATE DEBUG ===');
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file ? req.file.filename : 'No file uploaded');
  console.log('All form fields:');
  Object.keys(req.body).forEach(key => {
    console.log(`  ${key}: "${req.body[key]}" (type: ${typeof req.body[key]})`);
  });

  const {
    first_name, middle_name, last_name, relationship,
    gender, is_alive, birth_date, death_date,
    birth_place, death_place, location,
    occupation, pronouns, email, phone, photo_url,
    is_married, marriage_date, spouse_id  // NEW: Add marriage fields
  } = req.body;

  console.log('Extracted first_name:', first_name);
  console.log('Extracted last_name:', last_name);

  // Add better validation with detailed error messages
  if (!first_name || first_name.trim() === '') {
    console.log('ERROR: first_name is missing or empty');
    return res.status(400).json({ error: 'First name is required and cannot be empty.' });
  }

  if (!last_name || last_name.trim() === '') {
    console.log('ERROR: last_name is missing or empty');
    return res.status(400).json({ error: 'Last name is required and cannot be empty.' });
  }

  // Handle photo during update
  let finalPhotoUrl = photo_url || null;
  if (req.file) {
    // Fix: Store path without leading slash
    finalPhotoUrl = `uploads/${req.file.filename}`;
    console.log('Using uploaded file for photo_url:', finalPhotoUrl);
  } else {
    console.log('Using existing photo_url:', finalPhotoUrl);
  }

  try {
    // NEW: Get the current member data to see what changed
    const currentMemberResult = await pool.query('SELECT spouse_id FROM members WHERE id = $1', [req.params.id]);
    const currentMember = currentMemberResult.rows[0];
    const oldSpouseId = currentMember ? currentMember.spouse_id : null;

    console.log(`Old spouse ID: ${oldSpouseId}, New spouse ID: ${spouse_id}`);

    console.log('Attempting database update...');
    const result = await pool.query(
      'UPDATE members SET first_name = $1, middle_name = $2, last_name = $3, relationship = $4, gender = $5, is_alive = $6, birth_date = $7, death_date = $8, birth_place = $9, death_place = $10, location = $11, occupation = $12, pronouns = $13, email = $14, phone = $15, photo_url = $16, is_married = $17, marriage_date = $18, spouse_id = $19 WHERE id = $20 RETURNING *',
      [
        first_name, middle_name, last_name,
        relationship, gender, is_alive === 'true',
        parseDate(birth_date), parseDate(death_date), // Fix: Use parseDate function
        birth_place || null, death_place || null,
        location || null, occupation || null, pronouns || null,
        email || null, phone || null, finalPhotoUrl,
        is_married === 'true',  // NEW: Convert to boolean
        parseDate(marriage_date),  // NEW: Parse marriage date
        spouse_id ? parseInt(spouse_id) : null,  // NEW: Convert to integer or null
        req.params.id
      ]
    );

    const updatedMember = result.rows[0];

    // NEW: Handle spouse linking/unlinking
    const newSpouseId = spouse_id ? parseInt(spouse_id) : null;

    // If spouse changed, unlink the old spouse first
    if (oldSpouseId && oldSpouseId !== newSpouseId) {
      await unlinkSpouses(req.params.id, oldSpouseId);
    }

    // If they're married and have a spouse, link them
    if (is_married === 'true' && newSpouseId) {
      await linkSpouses(req.params.id, newSpouseId, parseDate(marriage_date));
    }

    // If they're no longer married, unlink current spouse
    if (is_married !== 'true' && newSpouseId) {
      await unlinkSpouses(req.params.id, newSpouseId);
    }

    console.log('Database update successful');
    console.log('Updated member:', updatedMember);
    res.json(updatedMember);
  } catch (err) {
    console.error('Database update error:', err);
    res.status(500).json({ error: 'Failed to update member.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error(err);
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

    // Define expected CSV columns (UPDATED to include marriage fields)
    const requiredColumns = ['first_name', 'last_name'];
    const allowedColumns = [
      'first_name', 'middle_name', 'last_name', 'gender', 'birth_date',
      'birth_place', 'death_date', 'death_place', 'location', 'occupation',
      'email', 'phone', 'is_alive', 'relationship', 'pronouns',
      'is_married', 'marriage_date'  // NEW: Add marriage fields (note: spouse_id would need special handling)
    ];

    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;

          // Validate required fields
          const missingFields = requiredColumns.filter(field => !row[field] || row[field].trim() === '');
          if (missingFields.length > 0) {
            errors.push({
              row: rowNumber,
              error: `Missing required fields: ${missingFields.join(', ')}`,
              data: row
            });
            return;
          }

          // Process the row data
          const memberData = {};

          // Copy allowed fields
          allowedColumns.forEach(col => {
            if (row[col] !== undefined) {
              memberData[col] = row[col] || null;
            }
          });

          // Convert is_alive to boolean
          if (memberData.is_alive) {
            memberData.is_alive = ['true', 'yes', '1', 'y'].includes(memberData.is_alive.toLowerCase());
          } else {
            memberData.is_alive = true; // Default to true if not specified
          }

          // NEW: Convert is_married to boolean
          if (memberData.is_married) {
            memberData.is_married = ['true', 'yes', '1', 'y'].includes(memberData.is_married.toLowerCase());
          } else {
            memberData.is_married = false; // Default to false if not specified
          }

          // Validate dates
          if (memberData.birth_date && !isValidDate(memberData.birth_date)) {
            errors.push({
              row: rowNumber,
              error: 'Invalid birth_date format (use YYYY-MM-DD)',
              data: row
            });
            return;
          }

          if (memberData.death_date && !isValidDate(memberData.death_date)) {
            errors.push({
              row: rowNumber,
              error: 'Invalid death_date format (use YYYY-MM-DD)',
              data: row
            });
            return;
          }

          // NEW: Validate marriage_date
          if (memberData.marriage_date && !isValidDate(memberData.marriage_date)) {
            errors.push({
              row: rowNumber,
              error: 'Invalid marriage_date format (use YYYY-MM-DD)',
              data: row
            });
            return;
          }

          results.push(memberData);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Delete the uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV contains errors',
        errors: errors,
        validRecords: results.length
      });
    }

    // Insert valid records into database
    const insertedMembers = [];
    const insertErrors = [];

    for (const member of results) {
      try {
        const insertQuery = `
          INSERT INTO members (
            first_name, middle_name, last_name, gender, birth_date, birth_place,
            death_date, death_place, location, occupation, email, phone, 
            is_alive, relationship, pronouns, is_married, marriage_date
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          ) RETURNING id
        `;

        const values = [
          member.first_name,
          member.middle_name || null,
          member.last_name,
          member.gender || null,
          parseDate(member.birth_date), // Fix: Use parseDate function
          member.birth_place || null,
          parseDate(member.death_date), // Fix: Use parseDate function
          member.death_place || null,
          member.location || null,
          member.occupation || null,
          member.email || null,
          member.phone || null,
          member.is_alive,
          member.relationship || null,
          member.pronouns || null,
          member.is_married,  // NEW: Include is_married
          parseDate(member.marriage_date)  // NEW: Include marriage_date
        ];

        const result = await pool.query(insertQuery, values);
        insertedMembers.push({
          id: result.rows[0].id,
          name: `${member.first_name} ${member.last_name}`
        });
      } catch (error) {
        console.error('Database insert error:', error);
        insertErrors.push({
          member: `${member.first_name} ${member.last_name}`,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${insertedMembers.length} members`,
      imported: insertedMembers,
      errors: insertErrors,
      total: results.length
    });

  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Helper function to validate date format
function isValidDate(dateString) {
  if (!dateString) return true; // Allow empty dates
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

// Set a tagged photo as profile picture
router.put('/:id/profile-photo/:photoId', async (req, res) => {
  try {
    const { id, photoId } = req.params;

    // Verify that the member is tagged in this photo
    const tagCheck = await pool.query(
      'SELECT id FROM photo_tags WHERE photo_id = $1 AND member_id = $2',
      [photoId, id]
    );

    if (tagCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Member is not tagged in this photo' });
    }

    // Get the photo path
    const photoResult = await pool.query(
      'SELECT file_path FROM photos WHERE id = $1',
      [photoId]
    );

    if (photoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photoPath = photoResult.rows[0].file_path;

    // Update the member's profile photo
    const result = await pool.query(
      'UPDATE members SET photo_url = $1 WHERE id = $2 RETURNING *',
      [photoPath, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error setting profile photo:', error);
    res.status(500).json({ error: 'Failed to set profile photo' });
  }
});

module.exports = router;