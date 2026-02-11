#!/usr/bin/env node
/**
 * One-time script to physically rotate photos that have rotation_degrees metadata
 * and reset their rotation_degrees to 0.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const pool = require('./config/database');

async function fixRotatedPhotos() {
  try {
    // Find all photos with non-zero rotation
    const result = await pool.query(
      'SELECT id, file_path, rotation_degrees, width, height FROM photos WHERE rotation_degrees > 0'
    );

    console.log(`Found ${result.rows.length} photos to fix`);

    for (const photo of result.rows) {
      const filePath = path.join(__dirname, photo.file_path);

      if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${photo.id}: file not found at ${filePath}`);
        continue;
      }

      console.log(`Processing photo ${photo.id}: rotating ${photo.rotation_degrees}°`);

      try {
        // Read and rotate the image
        const buffer = await sharp(filePath)
          .rotate(photo.rotation_degrees)
          .toBuffer();

        // Write back to same file
        await sharp(buffer).toFile(filePath);

        // Get new metadata
        const metadata = await sharp(filePath).metadata();

        // Update database: reset rotation to 0, update dimensions
        await pool.query(
          `UPDATE photos
           SET rotation_degrees = 0,
               width = $1,
               height = $2,
               edited_at = NOW()
           WHERE id = $3`,
          [metadata.width, metadata.height, photo.id]
        );

        console.log(`  Fixed: ${metadata.width}x${metadata.height}`);
      } catch (err) {
        console.error(`  Error processing photo ${photo.id}:`, err.message);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixRotatedPhotos();
