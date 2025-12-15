const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isImageSupported } = require('../utils/imageProcessor');

/**
 * Creates a multer upload instance with specified configuration
 * @param {Object} options - Upload configuration options
 * @param {string} options.destination - Upload directory path
 * @param {string} options.filenamePrefix - Prefix for generated filenames (e.g., 'photo', 'hero')
 * @param {number} options.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param {number} options.maxFiles - Maximum number of files (default: undefined)
 * @returns {Object} Multer upload instance
 */
function createUploadConfig(options = {}) {
  const {
    destination = 'uploads/',
    filenamePrefix = 'file',
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = undefined
  } = options;

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.isAbsolute(destination)
        ? destination
        : path.join(__dirname, '..', destination);

      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${filenamePrefix}_${timestamp}_${randomSuffix}${ext}`);
    }
  });

  const uploadConfig = {
    storage,
    fileFilter: (req, file, cb) => {
      if (isImageSupported(file)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed (JPG, PNG, GIF, WebP, HEIC)'));
      }
    },
    limits: {
      fileSize: maxFileSize
    }
  };

  // Add files limit if specified
  if (maxFiles) {
    uploadConfig.limits.files = maxFiles;
  }

  return multer(uploadConfig);
}

/**
 * Pre-configured upload instances for common use cases
 */
const uploadConfigs = {
  // For album/gallery photos
  gallery: createUploadConfig({
    destination: 'uploads/gallery/',
    filenamePrefix: 'photo',
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 50
  }),

  // For member profile photos
  profile: createUploadConfig({
    destination: 'uploads/',
    filenamePrefix: 'member',
    maxFileSize: 10 * 1024 * 1024
  }),

  // For hero images
  hero: createUploadConfig({
    destination: 'uploads/hero/',
    filenamePrefix: 'hero',
    maxFileSize: 10 * 1024 * 1024
  }),

  // For recipe photos
  recipes: createUploadConfig({
    destination: 'uploads/recipes/',
    filenamePrefix: 'recipe',
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 1  // Single photo per recipe
  })
};

module.exports = {
  createUploadConfig,
  uploadConfigs
};
