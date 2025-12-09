let sharp, convert, fileTypeFromBuffer;

// Try to load dependencies, make them optional
try {
  sharp = require('sharp');
} catch (error) {
  // Sharp not available - image optimization will be disabled
}

try {
  convert = require('heic-convert');
} catch (error) {
  // HEIC-convert not available - HEIC conversion will be disabled
}

try {
  const fileType = require('file-type');
  fileTypeFromBuffer = fileType.fileTypeFromBuffer || fileType.fromBuffer;
} catch (error) {
  // file-type not available - magic number validation will be disabled
}

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

/**
 * Process uploaded image file and convert HEIC to JPEG if needed
 * @param {Object} file - Multer file object
 * @param {string} outputPath - Desired output path
 * @returns {Object} - File info with processed path and metadata
 */
async function processImage(file, outputPath) {
  try {
    let inputBuffer;
    let isHeic = false;

    // Check if file is HEIC
    if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif' ||
        file.originalname.toLowerCase().endsWith('.heic') ||
        file.originalname.toLowerCase().endsWith('.heif')) {
      isHeic = true;

      if (!convert) {
        return {
          success: false,
          error: 'HEIC conversion not available on this server'
        };
      }

      // Read the HEIC file
      inputBuffer = await fsPromises.readFile(file.path);

      // Convert HEIC to JPEG
      const jpegBuffer = await convert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.9
      });

      // Update output path to use .jpg extension
      const parsedPath = path.parse(outputPath);
      outputPath = path.join(parsedPath.dir, parsedPath.name + '.jpg');

      // Write converted JPEG
      await fsPromises.writeFile(outputPath, jpegBuffer);

      // Clean up original HEIC file
      await fsPromises.unlink(file.path);

      inputBuffer = jpegBuffer;
    } else {
      // For non-HEIC files, just move to final location
      if (file.path !== outputPath) {
        await fsPromises.rename(file.path, outputPath);
      }
      inputBuffer = await fsPromises.readFile(outputPath);
    }

    // Validate image using magic numbers
    const isValidImage = await validateImageMagicNumber(outputPath);
    if (!isValidImage) {
      // Clean up invalid file
      try {
        await fsPromises.unlink(outputPath);
      } catch (err) {
        // File may not exist, ignore
      }
      return {
        success: false,
        error: 'Invalid image file - file type verification failed'
      };
    }
    
    let metadata = { width: null, height: null };
    
    // Get image metadata using Sharp if available
    if (sharp) {
      try {
        metadata = await sharp(inputBuffer).metadata();

        // Create optimized version if image is large or if optimization is beneficial
        const needsOptimization = metadata.width > 2048 || metadata.height > 2048;

        if (needsOptimization) {
          // Determine output format (prefer WebP for smaller file size, fallback to JPEG)
          const outputFormat = metadata.format === 'png' ? 'png' : 'jpeg';

          const sharpInstance = sharp(inputBuffer)
            .resize(2048, 2048, {
              fit: 'inside',
              withoutEnlargement: true,
              kernel: sharp.kernel.lanczos3 // High-quality resizing algorithm
            });

          // Apply format-specific optimizations
          if (outputFormat === 'jpeg') {
            sharpInstance.jpeg({
              quality: 85,
              progressive: true, // Enable progressive JPEG for better perceived loading
              mozjpeg: true // Use mozjpeg for better compression
            });
          } else if (outputFormat === 'png') {
            sharpInstance.png({
              quality: 85,
              compressionLevel: 9, // Maximum PNG compression
              progressive: true
            });
          }

          await sharpInstance.toFile(outputPath);

          // Update metadata after optimization
          const optimizedBuffer = await fsPromises.readFile(outputPath);
          const optimizedMetadata = await sharp(optimizedBuffer).metadata();
          metadata.width = optimizedMetadata.width;
          metadata.height = optimizedMetadata.height;

          logger.info('Image optimized', {
            originalSize: inputBuffer.length,
            optimizedSize: optimizedBuffer.length,
            savings: `${Math.round((1 - optimizedBuffer.length / inputBuffer.length) * 100)}%`
          });
        }
      } catch (sharpError) {
        logger.warn('Sharp processing failed, continuing without optimization', {
          error: sharpError.message
        });
        // Sharp processing failed - continue without optimization
      }
    }
    
    // Get file stats
    const stats = await fsPromises.stat(outputPath);
    
    return {
      success: true,
      path: outputPath,
      filename: path.basename(outputPath),
      originalName: file.originalname,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimetype: isHeic ? 'image/jpeg' : file.mimetype,
      wasConverted: isHeic
    };
    
  } catch (error) {
    // Clean up any partial files
    try {
      try {
        await fsPromises.unlink(file.path);
      } catch (err) {
        // File may not exist, ignore
      }
      try {
        await fsPromises.unlink(outputPath);
      } catch (err) {
        // File may not exist, ignore
      }
    } catch (cleanupError) {
      // Cleanup failed - files may not exist
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if file type is supported
 * @param {Object} file - Multer file object
 * @returns {boolean}
 */
function isImageSupported(file) {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ];
  
  const supportedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'
  ];
  
  const mimeTypeSupported = supportedTypes.includes(file.mimetype);
  const extensionSupported = supportedExtensions.some(ext => 
    file.originalname.toLowerCase().endsWith(ext)
  );
  
  return mimeTypeSupported || extensionSupported;
}

module.exports = {
  processImage,
  isImageSupported
};
/**
 * Validate file is actually an image using magic numbers
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if valid image
 */
async function validateImageMagicNumber(filePath) {
  if (!fileTypeFromBuffer) {
    logger.warn('file-type library not available, skipping magic number validation');
    return true; // Skip validation if library not available
  }

  try {
    const buffer = await fsPromises.readFile(filePath);
    const type = await fileTypeFromBuffer(buffer);

    if (!type) {
      logger.warn('Could not determine file type for', { filePath });
      return false;
    }

    const validMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif'
    ];

    const isValid = validMimeTypes.includes(type.mime);

    if (!isValid) {
      logger.warn('Invalid image file type detected', {
        filePath,
        detectedType: type.mime,
        extension: type.ext
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Error validating image magic number', {
      error: error.message,
      filePath
    });
    return false;
  }
}

module.exports.validateImageMagicNumber = validateImageMagicNumber;
