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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Family Member</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name] || ''}
              onChange={handleChange}
              placeholder={placeholder}
              required={required}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Alive?</label>
          <select
            name="is_alive"
            value={formData.is_alive}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {formData.is_alive === 'false' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Death Date</label>
              <input
                type="date"
                name="death_date"
                value={formData.death_date || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Death Place</label>
              <input
                type="text"
                name="death_place"
                value={formData.death_place || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </>
        )}

        {/* NEW: Marriage Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Marriage Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">Married?</label>
            <select
              name="is_married"
              value={formData.is_married}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          {/* Show marriage fields only if married is Yes */}
          {formData.is_married === 'true' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Marriage Date</label>
                <input
                  type="date"
                  name="marriage_date"
                  value={formData.marriage_date || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Spouse</label>
                {loadingMembers ? (
                  <div className="mt-1 text-sm text-gray-500">Loading family members...</div>
                ) : (
                  <select
                    name="spouse_id"
                    value={formData.spouse_id || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                <p className="text-xs text-gray-500 mt-1">
                  Select the spouse from existing family members. If the spouse is not in the system yet, add them first.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Photo Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>

          <div className="flex space-x-3 mb-3">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload & Crop Photo
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGalleryPicker(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Choose from Gallery
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            Upload a new photo to crop it, or choose an existing photo from your gallery
          </p>

          {previewUrl && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selected Photo:</label>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-full border"
              />
              {galleryPhotoPath && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Using photo from gallery
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Photo URL (optional)</label>
          <input
            type="text"
            name="photo_url"
            value={formData.photo_url || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter a direct URL to a photo"
          />
          <p className="text-sm text-gray-500 mt-1">
            If you provide a photo URL, it will override the uploaded photo
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Add Member
          </button>
          <button
            type="button"
            onClick={() => navigate('/members')}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>

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