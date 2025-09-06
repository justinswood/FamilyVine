let sharp, convert;

// Try to load dependencies, make them optional
try {
  sharp = require('sharp');
  console.log('✅ Sharp loaded successfully');
} catch (error) {
  console.warn('⚠️ Sharp not available:', error.message);
  console.warn('⚠️ HEIC conversion will be disabled');
}

try {
  convert = require('heic-convert');
  console.log('✅ HEIC-convert loaded successfully');
} catch (error) {
  console.warn('⚠️ HEIC-convert not available:', error.message);
  console.warn('⚠️ HEIC conversion will be disabled');
}

const fs = require('fs');
const path = require('path');

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
      console.log('Processing HEIC file:', file.originalname);
      
      if (!convert) {
        console.error('HEIC conversion not available - heic-convert not loaded');
        return {
          success: false,
          error: 'HEIC conversion not available on this server'
        };
      }
      
      // Read the HEIC file
      inputBuffer = fs.readFileSync(file.path);
      
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
      fs.writeFileSync(outputPath, jpegBuffer);
      
      // Clean up original HEIC file
      fs.unlinkSync(file.path);
      
      inputBuffer = jpegBuffer;
    } else {
      // For non-HEIC files, just move to final location
      if (file.path !== outputPath) {
        fs.renameSync(file.path, outputPath);
      }
      inputBuffer = fs.readFileSync(outputPath);
    }
    
    let metadata = { width: null, height: null };
    
    // Get image metadata using Sharp if available
    if (sharp) {
      try {
        metadata = await sharp(inputBuffer).metadata();
        
        // Create optimized version if image is large
        if (metadata.width > 2048 || metadata.height > 2048) {
          console.log('Optimizing large image:', file.originalname);
          
          await sharp(inputBuffer)
            .resize(2048, 2048, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 85 })
            .toFile(outputPath);
          
          // Update metadata after optimization
          const optimizedBuffer = fs.readFileSync(outputPath);
          const optimizedMetadata = await sharp(optimizedBuffer).metadata();
          metadata.width = optimizedMetadata.width;
          metadata.height = optimizedMetadata.height;
        }
      } catch (sharpError) {
        console.warn('Sharp processing failed:', sharpError.message);
        // Continue without optimization
      }
    } else {
      console.warn('Sharp not available - skipping image optimization');
    }
    
    // Get file stats
    const stats = fs.statSync(outputPath);
    
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
    console.error('Error processing image:', error);
    
    // Clean up any partial files
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError);
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