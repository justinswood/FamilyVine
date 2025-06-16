import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PhotoCropper from '../components/PhotoCropper';
import PhotoGalleryPicker from '../components/PhotoGalleryPicker';

const AddMember = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    location: '',
    occupation: '',
    phone: '',
    email: '',
    gender: '',
    is_alive: 'true',
    death_date: '',
    death_place: '',
    photo_url: '',
    // NEW: Add marriage fields
    is_married: 'false',
    marriage_date: '',
    spouse_id: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // States for gallery picker
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryPhotoPath, setGalleryPhotoPath] = useState(null);

  // NEW: State for loading family members for spouse selection
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // NEW: Load family members when component mounts
  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  // NEW: Function to fetch all family members for spouse selection
  const fetchFamilyMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      setFamilyMembers(response.data);
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setGalleryPhotoPath(null);
      setSelectedImageFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setPhotoFile(croppedFile);
    setShowCropper(false);
    setSelectedImageFile(null);

    const url = URL.createObjectURL(croppedFile);
    setPreviewUrl(url);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImageFile(null);
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleGalleryPhotoSelect = (photoPath) => {
    setGalleryPhotoPath(photoPath);
    setShowGalleryPicker(false);
    setPhotoFile(null);
    setPreviewUrl(`${process.env.REACT_APP_API}/${photoPath}`);

    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleGalleryCancel = () => {
    setShowGalleryPicker(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const form = new FormData();

      const formattedData = {
        ...formData,
        birth_date: formData.birth_date ? formData.birth_date.split('T')[0] : '',
        death_date: formData.death_date ? formData.death_date.split('T')[0] : '',
        marriage_date: formData.marriage_date ? formData.marriage_date.split('T')[0] : ''  // NEW: Format marriage date
      };

      Object.entries(formattedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          form.append(key, value);
        }
      });

      if (photoFile) {
        form.append('photo', photoFile);
      } else if (galleryPhotoPath) {
        form.set('photo_url', galleryPhotoPath);
      }

      const response = await axios.post(`${process.env.REACT_APP_API}/api/members`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/members/${response.data.id}`);
    } catch (err) {
      console.error('Error creating member:', err);
      alert('Error creating member. Please try again.');
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Helper function to calculate age
  const calculateAge = (birthDateString, deathDateString = null) => {
    if (!birthDateString) return null;

    try {
      const birthOnly = birthDateString.split('T')[0];
      const [birthYear, birthMonth, birthDay] = birthOnly.split('-').map(Number);
      const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

      let endDate;
      if (deathDateString) {
        const deathOnly = deathDateString.split('T')[0];
        const [deathYear, deathMonth, deathDay] = deathOnly.split('-').map(Number);
        endDate = new Date(deathYear, deathMonth - 1, deathDay);
      } else {
        endDate = new Date();
      }

      let age = endDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = endDate.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  // Helper function to determine if member is under 18
  const isMinor = () => {
    const age = calculateAge(formData.birth_date, formData.death_date);
    if (age === null) return false; // If no age available, show marriage section
    return age < 18;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-3">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="add-member-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M25,10 L25,40 M10,25 L40,25" stroke="currentColor" strokeWidth="1" className="text-blue-200" />
              <circle cx="25" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-purple-200" />
              <path d="M20,20 L30,30 M30,20 L20,30" stroke="currentColor" strokeWidth="0.5" className="text-pink-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#add-member-pattern)" />
        </svg>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-xl"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-blue-200/30 to-cyan-200/30 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-80 h-40 bg-gradient-to-t from-purple-200/30 to-pink-200/30 rounded-full blur-xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto p-6">
        {/* Enhanced header with flair */}
        <div className="text-center mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-xl relative overflow-hidden">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="absolute top-6 right-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-300"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-700"></div>
              <div className="absolute bottom-6 right-4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-500"></div>
            </div>

            {/* Background text effect */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-3xl font-black text-gray-400 transform rotate-12">ADD MEMBER</span>
            </div>

            <div className="relative z-10 flex items-center justify-center space-x-3">
              {/* Family icon with gradient */}
              <div className="flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 28 28" className="text-purple-600">
                  <defs>
                    <linearGradient id="familyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  {/* Family figures */}
                  <circle cx="9" cy="8" r="3" fill="url(#familyGradient)" />
                  <circle cx="19" cy="8" r="3" fill="url(#familyGradient)" />
                  <path d="M6 16c0-2 1.5-3 3-3s3 1 3 3v6H6v-6z" fill="url(#familyGradient)" />
                  <path d="M16 16c0-2 1.5-3 3-3s3 1 3 3v6h-6v-6z" fill="url(#familyGradient)" />
                  {/* Plus sign for adding */}
                  <circle cx="14" cy="18" r="4" fill="none" stroke="url(#familyGradient)" strokeWidth="1.5" strokeDasharray="2,2" />
                  <path d="M12 18h4M14 16v4" stroke="url(#familyGradient)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-cyan-700 bg-clip-text text-transparent">
                  Add New Family Member
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome a new member to your family tree
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-white/50 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent border-b border-purple-200 pb-2">
                Basic Information
              </h3>

              {[
                { label: 'First Name *', name: 'first_name', required: true },
                { label: 'Middle Name', name: 'middle_name' },
                { label: 'Last Name *', name: 'last_name', required: true },
                { label: 'Birth Date', name: 'birth_date', type: 'date' },
                { label: 'Birth Place', name: 'birth_place' },
                { label: 'Current Location', name: 'location', placeholder: 'e.g., New York, NY or 123 Main St, City, State' },
                { label: 'Occupation', name: 'occupation' },
                { label: 'Phone Number', name: 'phone', placeholder: 'Any format (e.g., 504-236-7578, 504.236.7578, or 5042367578)' },
                { label: 'Email Address', name: 'email', type: 'email' },
              ].map(({ label, name, type = 'text', placeholder, required }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alive?</label>
                <select
                  name="is_alive"
                  value={formData.is_alive}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {formData.is_alive === 'false' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium text-red-800">Death Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Death Date</label>
                    <input
                      type="date"
                      name="death_date"
                      value={formData.death_date || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Death Place</label>
                    <input
                      type="text"
                      name="death_place"
                      value={formData.death_place || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Marriage Information Section - Hidden for minors */}
            {!isMinor() && (
              <div className="border-t border-purple-200 pt-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent border-b border-purple-200 pb-2 mb-4">
                  Marriage Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Married?</label>
                    <select
                      name="is_married"
                      value={formData.is_married}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>

                  {/* Show marriage fields only if married is Yes */}
                  {formData.is_married === 'true' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Marriage Date</label>
                        <input
                          type="date"
                          name="marriage_date"
                          value={formData.marriage_date || ''}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spouse</label>
                        {loadingMembers ? (
                          <div className="text-sm text-gray-500 bg-white rounded-lg p-3 border">Loading family members...</div>
                        ) : (
                          <select
                            name="spouse_id"
                            value={formData.spouse_id || ''}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                          >
                            <option value="">Select Spouse</option>
                            {familyMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.first_name} {member.last_name}
                                {member.birth_date && ` (b. ${new Date(member.birth_date).getFullYear()})`}
                              </option>
                            ))}
                          </select>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Select the spouse from existing family members. If the spouse is not in the system yet, add them first.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photo Section */}
            <div className="border-t border-purple-200 pt-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent border-b border-purple-200 pb-2 mb-4">
                Profile Photo
              </h3>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-upload').click()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Upload & Crop Photo
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGalleryPicker(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Choose from Gallery
                  </button>
                </div>

                <p className="text-sm text-gray-500">
                  Upload a new photo to crop it, or choose an existing photo from your gallery
                </p>

                {previewUrl && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Selected Photo:</label>
                    <div className="flex items-center space-x-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg"
                      />
                      {galleryPhotoPath && (
                        <div className="flex items-center text-green-600">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Using photo from gallery
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo URL (optional)</label>
                  <input
                    type="text"
                    name="photo_url"
                    value={formData.photo_url || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-purple-300"
                    placeholder="Enter a direct URL to a photo"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    If you provide a photo URL, it will override the uploaded photo
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-purple-200">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                Add Member
              </button>
              <button
                type="button"
                onClick={() => navigate('/members')}
                className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Photo Cropper Modal */}
      {showCropper && selectedImageFile && (
        <PhotoCropper
          imageFile={selectedImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Gallery Picker Modal */}
      {showGalleryPicker && (
        <PhotoGalleryPicker
          onPhotoSelect={handleGalleryPhotoSelect}
          onCancel={handleGalleryCancel}
        />
      )}
    </div>
  );
};

export default AddMember;