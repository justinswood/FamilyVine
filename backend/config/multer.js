const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isImageSupported } = require('../utils/imageProcessor');

/**
 * Check if a file is a supported audio format
 */
function isAudioSupported(file) {
  const supportedExtensions = ['.mp3', '.wav', '.webm', '.ogg', '.m4a'];
  const supportedMimeTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  return supportedExtensions.includes(ext) || supportedMimeTypes.includes(file.mimetype);
}

/**
 * Creates a multer upload instance with specified configuration
 * @param {Object} options - Upload configuration options
 * @param {string} options.destination - Upload directory path
 * @param {string} options.filenamePrefix - Prefix for generated filenames (e.g., 'photo', 'hero')
 * @param {number} options.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param {number} options.maxFiles - Maximum number of files (default: undefined)
 * @param {string} options.fileType - Type of files to accept: 'image' (default) or 'audio'
 * @returns {Object} Multer upload instance
 */
function createUploadConfig(options = {}) {
  const {
    destination = 'uploads/',
    filenamePrefix = 'file',
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = undefined,
    fileType = 'image'
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
      if (fileType === 'audio') {
        if (isAudioSupported(file)) {
          cb(null, true);
        } else {
          cb(new Error('Only audio files are allowed (MP3, WAV, WebM, OGG, M4A)'));
        }
      } else {
        if (isImageSupported(file)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed (JPG, PNG, GIF, WebP, HEIC)'));
        }
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
  }),

  // For story audio recordings
  audio: createUploadConfig({
    destination: 'uploads/audio/',
    filenamePrefix: 'audio',
    maxFileSize: 150 * 1024 * 1024, // 150MB for audio
    maxFiles: 1,
    fileType: 'audio'
  })
};

module.exports = {
  createUploadConfig,
  uploadConfigs,
  isAudioSupported
};
