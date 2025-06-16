import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import PhotoCropper from '../components/PhotoCropper';
import PhotoGalleryPicker from '../components/PhotoGalleryPicker';

const EditMember = () => {
  const { id } = useParams();
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

  // NEW STATES for gallery picker
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
      // Filter out the current member from the spouse options
      setFamilyMembers(response.data.filter(member => member.id !== parseInt(id)));
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/api/members/${id}`)
      .then(res => {
        const memberData = {
          ...res.data,
          is_alive: res.data.is_alive ? 'true' : 'false',
          is_married: res.data.is_married ? 'true' : 'false',  // NEW: Convert marriage status to string
          // Format dates to YYYY-MM-DD format for date inputs
          birth_date: res.data.birth_date ? res.data.birth_date.split('T')[0] : '',
          death_date: res.data.death_date ? res.data.death_date.split('T')[0] : '',
          marriage_date: res.data.marriage_date ? res.data.marriage_date.split('T')[0] : '',  // NEW: Format marriage date
          spouse_id: res.data.spouse_id || ''  // NEW: Set spouse_id
        };
        setFormData(memberData);
        // Set preview URL if member has a photo
        if (memberData.photo_url) {
          setPreviewUrl(`${process.env.REACT_APP_API}/${memberData.photo_url}`);
        }
      })
      .catch(err => console.error('Error fetching member data:', err));
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;

    // For date fields, ensure we store only YYYY-MM-DD format
    if ((name === 'birth_date' || name === 'death_date' || name === 'marriage_date') && value) {
      const dateValue = value.includes('T') ? value.split('T')[0] : value;
      setFormData(prev => ({ ...prev, [name]: dateValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
        form.append('photo_url', galleryPhotoPath);
      }

      await axios.put(`${process.env.REACT_APP_API}/api/members/${id}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/members/${id}`);
    } catch (err) {
      console.error('Error updating member:', err);
      alert('Error updating member. Please try again.');
    }
  };

  const handleDelete = async () => {
    const memberName = `${formData.first_name} ${formData.last_name}`;

    const confirmMessage = `Are you sure you want to delete ${memberName}? This action cannot be undone.`;
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    const secondConfirm = window.confirm('This will permanently delete all associated data. Are you absolutely sure?');

    if (!secondConfirm) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API}/api/members/${id}`);
      alert(`${memberName} has been deleted successfully.`);
      navigate('/members');
    } catch (err) {
      console.error('Error deleting member:', err);
      alert('Error deleting member. Please try again.');
    }
  };

  // Helper function to calculate age (copied from MemberPage.js)
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
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Family Member</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'First Name', name: 'first_name' },
          { label: 'Middle Name', name: 'middle_name' },
          { label: 'Last Name', name: 'last_name' },
          { label: 'Birth Date', name: 'birth_date', type: 'date' },
          { label: 'Birth Place', name: 'birth_place' },
          { label: 'Current Location', name: 'location', placeholder: 'e.g., New York, NY or 123 Main St, City, State' },
          { label: 'Occupation', name: 'occupation' },
          { label: 'Phone Number', name: 'phone', placeholder: 'Any format (e.g., 504-236-7578, 504.236.7578, or 5042367578)' },
          { label: 'Email Address', name: 'email', type: 'email' },
        ].map(({ label, name, type = 'text', placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name] || ''}
              onChange={handleChange}
              placeholder={placeholder}
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

        {/* Marriage Section - Hidden for minors */}
        {!isMinor() && (
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
        )}

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Photo:</label>
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
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Delete Member
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

export default EditMember;