import React, { useState, useCallback } from 'react';
import { Upload, X, Image, AlertCircle, CheckCircle } from 'lucide-react';

const EnhancedPhotoUpload = ({ 
  onUpload, 
  maxFiles = 10, 
  maxFileSize = 50 * 1024 * 1024, // 50MB for HEIC files
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
  className = ''
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [errors, setErrors] = useState([]);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Validate and process files
  const handleFiles = (files) => {
    const newErrors = [];
    const validFiles = [];

    // Check total number of files
    if (uploadQueue.length + files.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed. You're trying to add ${files.length} more.`);
      setErrors(newErrors);
      return;
    }

    files.forEach((file, index) => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        newErrors.push(`File "${file.name}" is not a supported image type.`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        newErrors.push(`File "${file.name}" is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          id: Date.now() + index,
          file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
          status: 'ready' // ready, uploading, success, error
        };
        
        setUploadQueue(prev => [...prev, fileData]);
      };
      reader.readAsDataURL(file);
      
      validFiles.push(file);
    });

    setErrors(newErrors);
  };

  // Handle file input change
  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Remove file from queue
  const removeFile = (fileId) => {
    setUploadQueue(prev => prev.filter(file => file.id !== fileId));
  };

  // Upload all files
  const uploadAllFiles = async () => {
    const filesToUpload = uploadQueue.filter(file => file.status === 'ready');
    
    for (const fileData of filesToUpload) {
      try {
        // Update status to uploading
        setUploadQueue(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, status: 'uploading' } : f)
        );

        // Call the upload function passed as prop
        await onUpload(fileData.file);

        // Update status to success
        setUploadQueue(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, status: 'success' } : f)
        );

      } catch (error) {
        console.error('Upload error:', error);
        
        // Update status to error
        setUploadQueue(prev => 
          prev.map(f => f.id === fileData.id ? { 
            ...f, 
            status: 'error', 
            error: error.message || 'Upload failed' 
          } : f)
        );
      }
    }
  };

  // Clear completed uploads
  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(file => 
      file.status !== 'success' && file.status !== 'error'
    ));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-3">
          <Upload className={`w-12 h-12 mx-auto ${
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          }`} />
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isDragActive ? 'Drop files here' : 'Drag and drop photos here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse files
            </p>
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500">
            <p>Supported: JPEG, PNG, GIF, WebP, HEIC</p>
            <p>Max size: {Math.round(maxFileSize / 1024 / 1024)}MB per file</p>
            <p>Max files: {maxFiles}</p>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Upload Queue ({uploadQueue.length})
            </h3>
            <div className="flex gap-2">
              {uploadQueue.some(f => f.status === 'ready') && (
                <button
                  onClick={uploadAllFiles}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors text-sm font-medium"
                >
                  Upload All
                </button>
              )}
              {uploadQueue.some(f => f.status === 'success' || f.status === 'error') && (
                <button
                  onClick={clearCompleted}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 
                           transition-colors text-sm font-medium"
                >
                  Clear Completed
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadQueue.map((fileData) => (
              <div
                key={fileData.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded-lg p-3 space-y-2"
              >
                {/* File Preview */}
                <div className="relative aspect-square rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={fileData.preview}
                    alt={fileData.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  {fileData.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {fileData.status === 'success' && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  )}
                  
                  {fileData.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full 
                             hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* File Info */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {fileData.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(fileData.size)}
                  </p>
                  
                  {fileData.status === 'error' && fileData.error && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      {fileData.error}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      fileData.status === 'ready' ? 'bg-yellow-500' :
                      fileData.status === 'uploading' ? 'bg-blue-500' :
                      fileData.status === 'success' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {fileData.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPhotoUpload;