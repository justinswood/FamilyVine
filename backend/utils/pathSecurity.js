/**
 * Path Security Utilities
 *
 * Validates file paths to prevent path traversal attacks.
 * All file deletion operations should validate paths through these helpers.
 */

const path = require('path');

const UPLOADS_DIR = path.resolve(path.join(__dirname, '..', 'uploads'));

/**
 * Validate that a file path resolves within the uploads directory.
 * Prevents path traversal via '../' or symlink attacks.
 *
 * @param {string} filePath - The file path to validate (relative or absolute)
 * @returns {string} The resolved absolute path
 * @throws {Error} If path is outside the uploads directory
 */
function validateUploadPath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }

  // Resolve to absolute path, handling both relative and absolute inputs
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(UPLOADS_DIR + path.sep) && resolved !== UPLOADS_DIR) {
    throw new Error('Path traversal detected: file path is outside uploads directory');
  }

  return resolved;
}

/**
 * Safely delete a file, validating it's within the uploads directory first.
 *
 * @param {string} filePath - Path to the file to delete
 * @param {object} logger - Logger instance for warnings
 * @returns {boolean} true if deleted, false if skipped/failed
 */
async function safeUnlink(filePath, logger) {
  const fs = require('fs').promises;

  try {
    const resolved = validateUploadPath(filePath);
    await fs.unlink(resolved);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File already gone — not an error
      return false;
    }
    if (logger) {
      logger.warn('Safe file deletion failed', { path: filePath, error: err.message });
    }
    return false;
  }
}

/**
 * Synchronous version of safeUnlink for legacy code paths.
 */
function safeUnlinkSync(filePath, logger) {
  const fs = require('fs');

  try {
    const resolved = validateUploadPath(filePath);
    fs.unlinkSync(resolved);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    if (logger) {
      logger.warn('Safe file deletion failed', { path: filePath, error: err.message });
    }
    return false;
  }
}

module.exports = {
  UPLOADS_DIR,
  validateUploadPath,
  safeUnlink,
  safeUnlinkSync
};
