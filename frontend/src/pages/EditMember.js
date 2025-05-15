import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import PhotoCropper from '../components/PhotoCropper';

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
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/api/members/${id}`)
      .then(res => {
        const memberData = { ...res.data, is_alive: res.data.is_alive ? 'true' : 'false' };
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Set the selected file and show cropper
      setSelectedImageFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setPhotoFile(croppedFile);
    setShowCropper(false);
    setSelectedImageFile(null);
    
    // Create preview URL for cropped image
    const url = URL.createObjectURL(croppedFile);
    setPreviewUrl(url);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImageFile(null);
    // Reset the file input
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    try {
      // Always use FormData for member updates since we might have files
      const form = new FormData();
      
      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          form.append(key, value);
        }
      });
      
      // Add photo file if selected and cropped
      if (photoFile) {
        form.append('photo', photoFile);
      }

      // Send FormData (not JSON)
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

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

        <div>
          <label className="block text-sm font-medium text-gray-700">Upload & Crop Photo</label>
          <input 
            id="photo-upload"
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            Select an image to crop it to the perfect profile photo
          </p>
          {previewUrl && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Photo:</label>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-full border"
              />
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

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Save Changes
        </button>
      </form>

      {/* Photo Cropper Modal */}
      {showCropper && selectedImageFile && (
        <PhotoCropper
          imageFile={selectedImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default EditMember;