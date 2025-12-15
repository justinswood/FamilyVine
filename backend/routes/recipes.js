const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const logger = require('../config/logger');
const { uploadConfigs } = require('../config/multer');
const { processImage } = require('../utils/imageProcessor');
const fs = require('fs').promises;
const path = require('path');

const upload = uploadConfigs.recipes;

// ============================================================================
// GET /api/recipes - Get all recipes with optional filtering
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { category, tag, contributed_by, search, favorites_only } = req.query;

    let query = `
      SELECT
        r.*,
        m.first_name || ' ' || m.last_name as contributor_name,
        m.photo_url as contributor_photo,
        rp.file_path as photo_url,
        rp.caption as photo_caption,
        (SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = r.id AND is_deleted = false) as comment_count
      FROM recipes r
      LEFT JOIN members m ON r.contributed_by = m.id
      LEFT JOIN recipe_photos rp ON r.id = rp.recipe_id
      WHERE r.is_active = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Filter by category
    if (category) {
      query += ` AND r.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    // Filter by contributed_by member
    if (contributed_by) {
      query += ` AND r.contributed_by = $${paramIndex}`;
      queryParams.push(parseInt(contributed_by));
      paramIndex++;
    }

    // Filter by family favorites
    if (favorites_only === 'true') {
      query += ` AND r.is_family_favorite = true`;
    }

    // Search in title, description, ingredients
    if (search) {
      query += ` AND (
        to_tsvector('english', r.title || ' ' || COALESCE(r.description, ''))
        @@ plainto_tsquery('english', $${paramIndex})
        OR r.ingredients ILIKE $${paramIndex + 1}
      )`;
      queryParams.push(search, `%${search}%`);
      paramIndex += 2;
    }

    // Filter by tag (check tags TEXT field or recipe_tags table)
    if (tag) {
      query += ` AND (
        r.tags ILIKE $${paramIndex}
        OR EXISTS (
          SELECT 1 FROM recipe_tags rt
          WHERE rt.recipe_id = r.id AND rt.tag_name = $${paramIndex + 1}
        )
      )`;
      queryParams.push(`%${tag}%`, tag);
      paramIndex += 2;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, queryParams);

    // Parse tags from comma-separated string to array
    const recipes = result.rows.map(recipe => ({
      ...recipe,
      tags: recipe.tags ? recipe.tags.split(',').map(t => t.trim()).filter(t => t) : []
    }));

    res.json(recipes);

  } catch (error) {
    logger.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// ============================================================================
// GET /api/recipes/meta/categories - Get all unique categories
// ============================================================================
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category
      FROM recipes
      WHERE category IS NOT NULL AND is_active = true
      ORDER BY category
    `);

    res.json(result.rows.map(r => r.category));

  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================================================
// GET /api/recipes/meta/tags - Get all unique tags
// ============================================================================
router.get('/meta/tags', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT tag_name, COUNT(*) as count
      FROM recipe_tags
      GROUP BY tag_name
      ORDER BY count DESC, tag_name
    `);

    res.json(result.rows);

  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ============================================================================
// GET /api/recipes/:id - Get single recipe with all details
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get recipe with contributor info and photo
    const recipeResult = await pool.query(`
      SELECT
        r.*,
        m.id as contributor_id,
        m.first_name || ' ' || m.last_name as contributor_name,
        m.photo_url as contributor_photo,
        rp.id as photo_id,
        rp.file_path as photo_url,
        rp.caption as photo_caption,
        rp.width as photo_width,
        rp.height as photo_height,
        rp.uploaded_at as photo_uploaded_at
      FROM recipes r
      LEFT JOIN members m ON r.contributed_by = m.id
      LEFT JOIN recipe_photos rp ON r.id = rp.recipe_id
      WHERE r.id = $1 AND r.is_active = true
    `, [id]);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = recipeResult.rows[0];

    // Get comments
    const commentsResult = await pool.query(`
      SELECT
        rc.*,
        m.first_name || ' ' || m.last_name as member_name,
        m.photo_url as member_photo
      FROM recipe_comments rc
      LEFT JOIN members m ON rc.member_id = m.id
      WHERE rc.recipe_id = $1 AND rc.is_deleted = false
      ORDER BY rc.created_at ASC
    `, [id]);

    // Get tags from recipe_tags table
    const tagsResult = await pool.query(`
      SELECT tag_name
      FROM recipe_tags
      WHERE recipe_id = $1
      ORDER BY tag_name
    `, [id]);

    // Get version history
    const versionsResult = await pool.query(`
      SELECT
        rv.*,
        u.username as updated_by_name
      FROM recipe_versions rv
      LEFT JOIN users u ON rv.created_by = u.id
      WHERE rv.recipe_id = $1
      ORDER BY rv.version_number DESC
    `, [id]);

    // Parse tags
    const tagsFromText = recipe.tags ? recipe.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const tagsFromTable = tagsResult.rows.map(t => t.tag_name);
    const allTags = [...new Set([...tagsFromText, ...tagsFromTable])];

    res.json({
      ...recipe,
      tags: allTags,
      comments: commentsResult.rows,
      versions: versionsResult.rows
    });

  } catch (error) {
    logger.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// ============================================================================
// POST /api/recipes - Create new recipe
// ============================================================================
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      title,
      description,
      ingredients,
      instructions,
      prep_time,
      cook_time,
      total_time,
      servings,
      category,
      tags,
      contributed_by,
      difficulty_level,
      is_family_favorite
    } = req.body;

    // Validate required fields
    if (!title || !ingredients || !instructions) {
      return res.status(400).json({
        error: 'Title, ingredients, and instructions are required'
      });
    }

    // Insert recipe
    const recipeResult = await client.query(`
      INSERT INTO recipes (
        title, description, ingredients, instructions,
        prep_time, cook_time, total_time, servings,
        category, tags, contributed_by, difficulty_level,
        is_family_favorite, created_by, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1)
      RETURNING *
    `, [
      title,
      description || null,
      ingredients,
      instructions,
      parseInt(prep_time) || null,
      parseInt(cook_time) || null,
      parseInt(total_time) || null,
      servings || null,
      category || null,
      tags || null,
      parseInt(contributed_by) || null,
      difficulty_level || null,
      is_family_favorite === 'true' || is_family_favorite === true,
      req.user?.id || null
    ]);

    const recipe = recipeResult.rows[0];

    // Create initial version record
    await client.query(`
      INSERT INTO recipe_versions (
        recipe_id, version_number, title, description,
        ingredients, instructions, prep_time, cook_time,
        total_time, servings, change_description, created_by
      ) VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      recipe.id,
      title,
      description,
      ingredients,
      instructions,
      prep_time,
      cook_time,
      total_time,
      servings,
      'Initial version',
      req.user?.id || null
    ]);

    // Insert tags into recipe_tags table
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      for (const tag of tagArray) {
        if (tag) {
          await client.query(`
            INSERT INTO recipe_tags (recipe_id, tag_name, created_by)
            VALUES ($1, $2, $3)
            ON CONFLICT (recipe_id, tag_name) DO NOTHING
          `, [recipe.id, tag.toLowerCase(), req.user?.id || null]);
        }
      }
    }

    await client.query('COMMIT');

    logger.info('Recipe created', { recipeId: recipe.id, title });
    res.status(201).json(recipe);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  } finally {
    client.release();
  }
});

// ============================================================================
// PUT /api/recipes/:id - Update recipe
// ============================================================================
router.put('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      title,
      description,
      ingredients,
      instructions,
      prep_time,
      cook_time,
      total_time,
      servings,
      category,
      tags,
      contributed_by,
      difficulty_level,
      is_family_favorite,
      change_description
    } = req.body;

    // Get current version
    const currentResult = await client.query(
      'SELECT * FROM recipes WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const currentRecipe = currentResult.rows[0];
    const newVersion = currentRecipe.version + 1;

    // Update recipe
    const updateResult = await client.query(`
      UPDATE recipes SET
        title = $1,
        description = $2,
        ingredients = $3,
        instructions = $4,
        prep_time = $5,
        cook_time = $6,
        total_time = $7,
        servings = $8,
        category = $9,
        tags = $10,
        contributed_by = $11,
        difficulty_level = $12,
        is_family_favorite = $13,
        version = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `, [
      title || currentRecipe.title,
      description !== undefined ? description : currentRecipe.description,
      ingredients || currentRecipe.ingredients,
      instructions || currentRecipe.instructions,
      prep_time !== undefined ? (parseInt(prep_time) || null) : currentRecipe.prep_time,
      cook_time !== undefined ? (parseInt(cook_time) || null) : currentRecipe.cook_time,
      total_time !== undefined ? (parseInt(total_time) || null) : currentRecipe.total_time,
      servings !== undefined ? servings : currentRecipe.servings,
      category !== undefined ? category : currentRecipe.category,
      tags !== undefined ? tags : currentRecipe.tags,
      contributed_by !== undefined ? (parseInt(contributed_by) || null) : currentRecipe.contributed_by,
      difficulty_level !== undefined ? difficulty_level : currentRecipe.difficulty_level,
      is_family_favorite !== undefined ? (is_family_favorite === 'true' || is_family_favorite === true) : currentRecipe.is_family_favorite,
      newVersion,
      id
    ]);

    const updatedRecipe = updateResult.rows[0];

    // Create version snapshot
    await client.query(`
      INSERT INTO recipe_versions (
        recipe_id, version_number, title, description,
        ingredients, instructions, prep_time, cook_time,
        total_time, servings, change_description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      id,
      newVersion,
      updatedRecipe.title,
      updatedRecipe.description,
      updatedRecipe.ingredients,
      updatedRecipe.instructions,
      updatedRecipe.prep_time,
      updatedRecipe.cook_time,
      updatedRecipe.total_time,
      updatedRecipe.servings,
      change_description || `Updated to version ${newVersion}`,
      req.user?.id || null
    ]);

    // Update tags if provided
    if (tags !== undefined) {
      // Delete old tags
      await client.query('DELETE FROM recipe_tags WHERE recipe_id = $1', [id]);

      // Insert new tags
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      for (const tag of tagArray) {
        if (tag) {
          await client.query(`
            INSERT INTO recipe_tags (recipe_id, tag_name, created_by)
            VALUES ($1, $2, $3)
            ON CONFLICT (recipe_id, tag_name) DO NOTHING
          `, [id, tag.toLowerCase(), req.user?.id || null]);
        }
      }
    }

    await client.query('COMMIT');

    logger.info('Recipe updated', { recipeId: id, version: newVersion });
    res.json(updatedRecipe);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  } finally {
    client.release();
  }
});

// ============================================================================
// DELETE /api/recipes/:id - Soft delete recipe
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE recipes
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, title
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    logger.info('Recipe deleted', { recipeId: id, title: result.rows[0].title });
    res.json({ message: 'Recipe deleted successfully', recipe: result.rows[0] });

  } catch (error) {
    logger.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// ============================================================================
// POST /api/recipes/:id/photo - Upload recipe photo
// ============================================================================
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { caption } = req.body;

    // Verify recipe exists
    const recipeResult = await client.query(
      'SELECT id FROM recipes WHERE id = $1 AND is_active = true',
      [id]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const file = req.file;
    const uploadDir = 'uploads/recipes';
    const finalPath = path.join(uploadDir, file.filename);

    // Process image (resize, convert HEIC, optimize)
    const processResult = await processImage(file, finalPath);

    // Delete existing photo if any
    const existingPhoto = await client.query(
      'SELECT file_path FROM recipe_photos WHERE recipe_id = $1',
      [id]
    );

    if (existingPhoto.rows.length > 0) {
      const oldPath = existingPhoto.rows[0].file_path;
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        logger.warn('Failed to delete old recipe photo', { path: oldPath });
      }

      // Delete from database
      await client.query('DELETE FROM recipe_photos WHERE recipe_id = $1', [id]);
    }

    // Insert new photo
    const photoResult = await client.query(`
      INSERT INTO recipe_photos (
        recipe_id, filename, file_path, file_size,
        mime_type, width, height, caption, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      id,
      processResult.filename,
      processResult.path,
      processResult.size,
      processResult.mimetype,
      processResult.width || null,
      processResult.height || null,
      caption || null,
      req.user?.id || null
    ]);

    await client.query('COMMIT');

    logger.info('Recipe photo uploaded', { recipeId: id, photoId: photoResult.rows[0].id });
    res.status(201).json(photoResult.rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error uploading recipe photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  } finally {
    client.release();
  }
});

// ============================================================================
// DELETE /api/recipes/:id/photo - Delete recipe photo
// ============================================================================
router.delete('/:id/photo', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get photo
    const photoResult = await client.query(
      'SELECT * FROM recipe_photos WHERE recipe_id = $1',
      [id]
    );

    if (photoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photoResult.rows[0];

    // Delete file
    try {
      await fs.unlink(photo.file_path);
    } catch (err) {
      logger.warn('Failed to delete recipe photo file', { path: photo.file_path });
    }

    // Delete from database
    await client.query('DELETE FROM recipe_photos WHERE id = $1', [photo.id]);

    await client.query('COMMIT');

    logger.info('Recipe photo deleted', { recipeId: id, photoId: photo.id });
    res.json({ message: 'Photo deleted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deleting recipe photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  } finally {
    client.release();
  }
});

// ============================================================================
// POST /api/recipes/:id/comments - Add comment to recipe
// ============================================================================
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text, member_id } = req.body;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const result = await pool.query(`
      INSERT INTO recipe_comments (
        recipe_id, comment_text, member_id, created_by
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      id,
      comment_text.trim(),
      member_id ? parseInt(member_id) : null,
      req.user?.id || null
    ]);

    logger.info('Recipe comment added', { recipeId: id, commentId: result.rows[0].id });
    res.status(201).json(result.rows[0]);

  } catch (error) {
    logger.error('Error adding recipe comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ============================================================================
// DELETE /api/recipes/:recipeId/comments/:commentId - Delete comment
// ============================================================================
router.delete('/:recipeId/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    const result = await pool.query(`
      UPDATE recipe_comments
      SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `, [commentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    logger.info('Recipe comment deleted', { commentId });
    res.json({ message: 'Comment deleted successfully' });

  } catch (error) {
    logger.error('Error deleting recipe comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
