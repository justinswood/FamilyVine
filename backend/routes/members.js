const express = require('express');
const router = express.Router();
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { processImage } = require('../utils/imageProcessor');
const { uploadConfigs } = require('../config/multer');
const { parseDate } = require('../utils/dateUtils');

// Use centralized multer config for profile uploads
const upload = uploadConfigs.profile;

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

// NEW: Search endpoint for global search functionality (MUST come before /:id route)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    
    const searchTerm = `%${q.trim().toLowerCase()}%`;
    
    // Search in first_name, last_name, middle_name, and location
    const result = await pool.query(`
      SELECT id, first_name, middle_name, last_name, birth_date, birth_place, photo_url
      FROM members 
      WHERE 
        LOWER(first_name) LIKE $1 OR 
        LOWER(last_name) LIKE $1 OR 
        LOWER(middle_name) LIKE $1 OR
        LOWER(CONCAT(first_name, ' ', last_name)) LIKE $1 OR
        LOWER(birth_place) LIKE $1
      ORDER BY 
        -- Prioritize exact matches first
        CASE 
          WHEN LOWER(first_name) = LOWER($2) THEN 1
          WHEN LOWER(last_name) = LOWER($2) THEN 2
          WHEN LOWER(CONCAT(first_name, ' ', last_name)) = LOWER($2) THEN 3
          ELSE 4
        END,
        first_name, last_name
      LIMIT 20
    `, [searchTerm, q.trim()]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
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

  let photo_url = null;
  
  try {
    // Process uploaded photo if present
    if (req.file) {
      console.log(`Processing profile photo for ${first_name} ${last_name}`);
      
      const finalPath = path.join('uploads/', `profile_${Date.now()}`);
      const processResult = await processImage(req.file, finalPath);
      
      if (processResult.success) {
        photo_url = `uploads/${processResult.filename}`;
        console.log(`Profile photo processed: ${processResult.filename}${processResult.wasConverted ? ' (converted from HEIC)' : ''}`);
      } else {
        console.error('Failed to process profile photo:', processResult.error);
        // Continue without photo rather than failing the entire request
      }
    }

    // First, create the new member
    const result = await pool.query(
      'INSERT INTO members (first_name, middle_name, last_name, relationship, gender, is_alive, birth_date, death_date, birth_place, death_place, location, occupation, pronouns, email, phone, photo_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *',
      [
        first_name, middle_name, last_name, relationship, gender, is_alive === 'true',
        parseDate(birth_date), parseDate(death_date),
        birth_place || null, death_place || null,
        location || null, occupation || null, pronouns || null, email || null, phone || null, photo_url
      ]
    );

    const newMember = result.rows[0];

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
    console.log(`Processing updated profile photo for member ${req.params.id}`);
    
    try {
      const finalPath = path.join('uploads/', `profile_update_${Date.now()}`);
      const processResult = await processImage(req.file, finalPath);
      
      if (processResult.success) {
        finalPhotoUrl = `uploads/${processResult.filename}`;
        console.log(`Profile photo updated: ${processResult.filename}${processResult.wasConverted ? ' (converted from HEIC)' : ''}`);
      } else {
        console.error('Failed to process updated profile photo:', processResult.error);
        // Keep existing photo if processing fails
        console.log('Keeping existing photo due to processing error');
      }
    } catch (photoError) {
      console.error('Error processing profile photo:', photoError);
      // Keep existing photo if processing fails
    }
  } else {
    console.log('Using existing photo_url:', finalPhotoUrl);
  }

  try {
    console.log('Attempting database update...');
    const memberId = parseInt(req.params.id);
    const spouseIdInt = spouse_id ? parseInt(spouse_id) : null;
    const isMarriedBool = is_married === 'true' || is_married === true;

    // Update member record including marriage fields
    const result = await pool.query(
      'UPDATE members SET first_name = $1, middle_name = $2, last_name = $3, relationship = $4, gender = $5, is_alive = $6, birth_date = $7, death_date = $8, birth_place = $9, death_place = $10, location = $11, occupation = $12, pronouns = $13, email = $14, phone = $15, photo_url = $16, is_married = $17, marriage_date = $18, spouse_id = $19 WHERE id = $20 RETURNING *',
      [
        first_name, middle_name, last_name,
        relationship, gender, is_alive === 'true',
        parseDate(birth_date), parseDate(death_date),
        birth_place || null, death_place || null,
        location || null, occupation || null, pronouns || null,
        email || null, phone || null, finalPhotoUrl,
        isMarriedBool, parseDate(marriage_date), spouseIdInt,
        memberId
      ]
    );

    const updatedMember = result.rows[0];

    // If married with a spouse, create union and spouse relationships
    if (isMarriedBool && spouseIdInt) {
      console.log(`Creating/updating union for member ${memberId} and spouse ${spouseIdInt}`);

      // Order partner IDs (unions table requires partner1_id < partner2_id)
      const partner1 = Math.min(memberId, spouseIdInt);
      const partner2 = Math.max(memberId, spouseIdInt);

      // Check if union already exists
      const existingUnion = await pool.query(
        'SELECT id FROM unions WHERE partner1_id = $1 AND partner2_id = $2',
        [partner1, partner2]
      );

      if (existingUnion.rows.length === 0) {
        // Create new union
        await pool.query(
          'INSERT INTO unions (partner1_id, partner2_id, union_type, union_date, is_primary) VALUES ($1, $2, $3, $4, true)',
          [partner1, partner2, 'marriage', parseDate(marriage_date)]
        );
        console.log(`Created union for ${partner1} and ${partner2}`);
      } else {
        // Update existing union date if provided
        if (marriage_date) {
          await pool.query(
            'UPDATE unions SET union_date = $1 WHERE partner1_id = $2 AND partner2_id = $3',
            [parseDate(marriage_date), partner1, partner2]
          );
        }
        console.log(`Union already exists for ${partner1} and ${partner2}`);
      }

      // Get spouse gender for relationship type
      const spouseInfo = await pool.query('SELECT gender FROM members WHERE id = $1', [spouseIdInt]);
      const spouseGender = spouseInfo.rows[0]?.gender;
      const memberGender = gender;

      // Create spouse relationships if they don't exist
      const memberRelType = memberGender === 'Male' ? 'husband' : 'wife';
      const spouseRelType = spouseGender === 'Male' ? 'husband' : 'wife';

      // Member -> Spouse relationship
      const existingRel1 = await pool.query(
        'SELECT id FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type IN ($3, $4)',
        [memberId, spouseIdInt, 'husband', 'wife']
      );
      if (existingRel1.rows.length === 0) {
        await pool.query(
          'INSERT INTO relationships (member1_id, member2_id, relationship_type) VALUES ($1, $2, $3)',
          [memberId, spouseIdInt, memberRelType]
        );
      }

      // Spouse -> Member relationship
      const existingRel2 = await pool.query(
        'SELECT id FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type IN ($3, $4)',
        [spouseIdInt, memberId, 'husband', 'wife']
      );
      if (existingRel2.rows.length === 0) {
        await pool.query(
          'INSERT INTO relationships (member1_id, member2_id, relationship_type) VALUES ($1, $2, $3)',
          [spouseIdInt, memberId, spouseRelType]
        );
      }

      // Update spouse's member record
      await pool.query(
        'UPDATE members SET is_married = true, spouse_id = $1, marriage_date = $2 WHERE id = $3',
        [memberId, parseDate(marriage_date), spouseIdInt]
      );
      console.log(`Updated spouse ${spouseIdInt} with marriage info`);
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