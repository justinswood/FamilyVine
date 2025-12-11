import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { RotateCcw, RotateCw } from 'lucide-react';

const PhotoCropper = ({
  onCropComplete,
  onCancel,
  imageFile,
  aspectRatio = 1, // Default to square (1:1), can be overridden (e.g., 3/2 for landscape)
  title = "Crop Profile Photo",
  description = "Adjust the crop area to focus on the person's face."
}) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Function to resize large images
  const resizeImage = useCallback((file, maxSize = 2048) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions if image is too large
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Load and potentially resize the image
  useEffect(() => {
    if (imageFile) {
      setImageError(false);
      setImageLoaded(false);
      setProcessing(true);

      // Check file size (5MB threshold)
      const maxFileSize = 5 * 1024 * 1024; // 5MB

      const processImage = async () => {
        try {
          let fileToProcess = imageFile;

          // Resize if file is too large
          if (imageFile.size > maxFileSize) {
            console.log('Large file detected, resizing...');
            fileToProcess = await resizeImage(imageFile);
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            setImageSrc(e.target.result);
            setProcessing(false);
          };
          reader.onerror = () => {
            setImageError(true);
            setProcessing(false);
          };
          reader.readAsDataURL(fileToProcess);
        } catch (error) {
          console.error('Error processing image:', error);
          setImageError(true);
          setProcessing(false);
        }
      };

      processImage();
    }
  }, [imageFile, resizeImage]);

  const onImageLoad = useCallback((e) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;
    setImageLoaded(true);
    setImageSize({ width: naturalWidth, height: naturalHeight });
    
    // Use a small timeout to ensure the image is fully rendered and DOM is updated
    setTimeout(() => {
      const imageElement = imgRef.current;
      if (!imageElement) {
        console.warn('Image element not available for crop calculation');
        return;
      }
      
      // Get the actual displayed dimensions of the image
      const rect = imageElement.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) {
        // Fallback to the width/height attributes if getBoundingClientRect fails
        console.warn('Using fallback dimensions');
        const displayWidth = width || imageElement.offsetWidth;
        const displayHeight = height || imageElement.offsetHeight;
        
        if (displayWidth && displayHeight) {
          // Calculate crop size based on aspect ratio
          let cropWidth, cropHeight;
          if (aspectRatio >= 1) {
            // Landscape or square
            cropWidth = Math.min(displayWidth, displayHeight * aspectRatio) * 0.8;
            cropHeight = cropWidth / aspectRatio;
          } else {
            // Portrait
            cropHeight = Math.min(displayHeight, displayWidth / aspectRatio) * 0.8;
            cropWidth = cropHeight * aspectRatio;
          }

          const initialCrop = {
            unit: 'px',
            x: (displayWidth - cropWidth) / 2,
            y: (displayHeight - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight,
            aspect: aspectRatio,
          };
          setCrop(initialCrop);
          setCompletedCrop(initialCrop);
          console.log('Initial crop set:', initialCrop);
        }
        return;
      }
      
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      // Calculate initial crop based on displayed size and aspect ratio
      let cropWidth, cropHeight;
      if (aspectRatio >= 1) {
        // Landscape or square
        cropWidth = Math.min(displayWidth, displayHeight * aspectRatio) * 0.8;
        cropHeight = cropWidth / aspectRatio;
      } else {
        // Portrait
        cropHeight = Math.min(displayHeight, displayWidth / aspectRatio) * 0.8;
        cropWidth = cropHeight * aspectRatio;
      }

      const x = (displayWidth - cropWidth) / 2;
      const y = (displayHeight - cropHeight) / 2;

      const initialCrop = {
        unit: 'px',
        x: x,
        y: y,
        width: cropWidth,
        height: cropHeight,
        aspect: aspectRatio,
      };
      
      console.log('Image dimensions:', { displayWidth, displayHeight, naturalWidth, naturalHeight });
      console.log('Setting initial crop:', initialCrop);
      setCrop(initialCrop);
      setCompletedCrop(initialCrop);
    }, 200); // Increased timeout to 200ms for better reliability
  }, [aspectRatio]);

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const getCroppedImage = useCallback(async (image, cropPixels, rotationDegrees) => {
    if (!image || !cropPixels || !cropPixels.width || !cropPixels.height) {
      console.error('Invalid parameters for cropping');
      return null;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref not available');
      return null;
    }

    const ctx = canvas.getContext('2d');

    // Get the scale factors between display size and natural size
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate crop size (in natural image pixels)
    const cropWidth = cropPixels.width * scaleX;
    const cropHeight = cropPixels.height * scaleY;

    // For 90 or 270 degree rotations, swap width and height
    const rotationRad = (rotationDegrees * Math.PI) / 180;
    const is90or270 = rotationDegrees % 180 !== 0;

    if (is90or270) {
      canvas.width = cropHeight;
      canvas.height = cropWidth;
    } else {
      canvas.width = cropWidth;
      canvas.height = cropHeight;
    }

    // Configure canvas for high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Save context state
    ctx.save();

    // Apply rotation around the center of the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotationRad);

    // Draw the cropped part of the image
    if (is90or270) {
      ctx.drawImage(
        image,
        cropPixels.x * scaleX,
        cropPixels.y * scaleY,
        cropWidth,
        cropHeight,
        -cropHeight / 2,
        -cropWidth / 2,
        cropHeight,
        cropWidth
      );
    } else {
      ctx.drawImage(
        image,
        cropPixels.x * scaleX,
        cropPixels.y * scaleY,
        cropWidth,
        cropHeight,
        -cropWidth / 2,
        -cropHeight / 2,
        cropWidth,
        cropHeight
      );
    }

    // Restore context state
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            resolve(null);
            return;
          }
          // Create a file with timestamp
          const fileName = `cropped_${Date.now()}.jpg`;
          const file = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(file);
        },
        'image/jpeg',
        0.95
      );
    });
  }, []);

  const handleSaveCrop = async () => {
    if (!imgRef.current || !completedCrop) {
      alert('Please adjust the crop area before saving');
      return;
    }

    setProcessing(true);

    try {
      console.log('Cropping with:', completedCrop, 'rotation:', rotation);
      const croppedFile = await getCroppedImage(imgRef.current, completedCrop, rotation);

      if (croppedFile) {
        console.log('Crop successful, file size:', croppedFile.size);
        onCropComplete(croppedFile);
      } else {
        throw new Error('Failed to generate cropped image');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error cropping image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-1">
            {description}
            {imageSize.width > 0 && ` Original size: ${imageSize.width} × ${imageSize.height} pixels`}
          </p>
        </div>

        <div className="overflow-auto" style={{ maxHeight: 'calc(95vh - 180px)' }}>
          {processing && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {imageFile?.size > 5 * 1024 * 1024 ? 'Resizing large image...' : 'Loading image...'}
              </p>
            </div>
          )}

          {imageSrc && !imageError && !processing && (
            <div className="p-6 flex justify-center">
              <div className="relative inline-block">
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop, percentCrop) => {
                    setCrop(newCrop);
                  }}
                  onComplete={(c) => {
                    setCompletedCrop(c);
                  }}
                  aspect={aspectRatio}
                  circularCrop={false}
                  minWidth={50}
                  minHeight={50}
                  keepSelection={true}
                  ruleOfThirds={true}
                  locked={false}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    onLoad={onImageLoad}
                    onError={() => setImageError(true)}
                    alt="Crop preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      display: imageLoaded ? 'block' : 'none',
                      transform: `rotate(${rotation}deg)`,
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </ReactCrop>
              </div>
            </div>
          )}

          {imageError && (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-lg text-red-600">Failed to load image</p>
              <p className="text-gray-600 mt-2">Please try selecting a different image file</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {completedCrop && completedCrop.width && completedCrop.height && (
                  <span>
                    Crop size: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} pixels
                  </span>
                )}
                {imageFile && (
                  <span className="ml-4">
                    Original file: {(imageFile.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                )}
              </div>

              {/* Rotation buttons */}
              <div className="flex items-center space-x-2 pl-4 border-l border-gray-300">
                <button
                  onClick={handleRotateLeft}
                  disabled={processing}
                  className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Rotate left 90°"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">{rotation}°</span>
                <button
                  onClick={handleRotateRight}
                  disabled={processing}
                  className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Rotate right 90°"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                disabled={processing}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCrop}
                disabled={!completedCrop || !imageLoaded || processing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Processing...' : 'Save Cropped Photo'}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default PhotoCropper;