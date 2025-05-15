import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const PhotoCropper = ({ onCropComplete, onCancel, imageFile }) => {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 50,
    aspect: 1, // Square aspect ratio for profile photos
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  // Load the selected image
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onImageLoaded = useCallback((img) => {
    imgRef.current = img;
    setImageLoaded(true);
    
    // Set initial crop to center of image
    const { width, height } = img;
    const size = Math.min(width, height);
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x: x,
      y: y,
      aspect: 1,
    });
  }, []);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onCropCompleteInternal = (crop) => {
    setCompletedCrop(crop);
  };

  const getCroppedImage = useCallback(async (crop) => {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    
    if (!image || !canvas || !crop || !crop.width || !crop.height) {
      console.error('Missing required elements for cropping');
      return null;
    }

    const ctx = canvas.getContext('2d');
    
    // Calculate the pixel crop values
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Set canvas size to match crop size
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the cropped image
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            resolve(null);
            return;
          }
          // Preserve original file name and set as JPEG
          blob.name = imageFile.name.replace(/\.[^/.]+$/, '') + '.jpg';
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, [imageFile?.name]);

  const handleSaveCrop = async () => {
    if (!completedCrop || !completedCrop.width || !completedCrop.height) {
      alert('Please select an area to crop');
      return;
    }

    if (!imgRef.current) {
      alert('Image not loaded properly. Please try again.');
      return;
    }

    try {
      const croppedBlob = await getCroppedImage(completedCrop);
      if (croppedBlob) {
        // Create a new File object from the blob
        const croppedFile = new File([croppedBlob], croppedBlob.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onCropComplete(croppedFile);
      } else {
        alert('Failed to crop image. Please try again.');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error cropping image. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Crop Profile Photo</h2>
        
        {imageSrc && (
          <div className="flex flex-col items-center">
            <div className="mb-4 max-h-96 overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={onCropChange}
                onComplete={onCropCompleteInternal}
                aspect={1}
                circularCrop
                minWidth={50}
                minHeight={50}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  onLoad={(e) => onImageLoaded(e.target)}
                  className="max-w-full max-h-96"
                  style={{ display: imageLoaded ? 'block' : 'none' }}
                  alt="Crop preview"
                />
              </ReactCrop>
            </div>
            
            {!imageLoaded && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <div className="mt-2">Loading image...</div>
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={handleSaveCrop}
                disabled={!completedCrop || !imageLoaded}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save Cropped Photo
              </button>
              <button
                onClick={onCancel}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
            
            {completedCrop && (
              <div className="mt-2 text-sm text-gray-600">
                Crop area: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}
              </div>
            )}
          </div>
        )}
        
        {/* Hidden canvas for cropping */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default PhotoCropper;