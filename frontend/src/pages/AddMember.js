import React, { useState } from 'react';
import axios from 'axios';

const AddMember = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    death_date: '',
    death_place: '',
    alive: 'Yes',
    gender: '',
    occupation: '',
    phone: '',
    email: '',
    photo_url: ''
  });
  const [photoFile, setPhotoFile] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    setPhotoFile(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (photoFile) data.append('photo', photoFile);

    try {
      await axios.post(`${process.env.REACT_APP_API}/api/members`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      window.location.href = '/members';
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Add Family Member</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
        {[
          { label: 'First Name', name: 'first_name' },
          { label: 'Middle Name', name: 'middle_name' },
          { label: 'Last Name', name: 'last_name' },
          { label: 'Birth Date', name: 'birth_date', type: 'date' },
          { label: 'Birth Place', name: 'birth_place' },
          { label: 'Occupation', name: 'occupation' },
          { label: 'Phone Number', name: 'phone', pattern: '[0-9]{3}-[0-9]{3}-[0-9]{4}' },
          { label: 'Email Address', name: 'email', type: 'email' },
        ].map(({ label, name, type = 'text', pattern }) => (
          <div key={name}>
            <label className="block font-medium mb-1">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              pattern={pattern}
              required={['first_name', 'last_name', 'phone'].includes(name)}
              className="w-full border border-gray-400 rounded px-3 py-2"
            />
          </div>
        ))}

        {/* Gender Dropdown */}
        <div>
          <label className="block font-medium mb-1">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded px-3 py-2"
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        {/* Alive Toggle */}
        <div>
          <label className="block font-medium mb-1">Alive?</label>
          <select
            name="alive"
            value={formData.alive}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded px-3 py-2"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Death fields shown only if not alive */}
        {formData.alive === 'No' && (
          <>
            <div>
              <label className="block font-medium mb-1">Death Date</label>
              <input
                type="date"
                name="death_date"
                value={formData.death_date}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Death Place</label>
              <input
                type="text"
                name="death_place"
                value={formData.death_place}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded px-3 py-2"
              />
            </div>
          </>
        )}

        {/* Photo Upload */}
        <div>
          <label className="block font-medium mb-1">Upload Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>

        {/* Optional URL */}
        <div>
          <label className="block font-medium mb-1">Photo URL (optional)</label>
          <input
            type="text"
            name="photo_url"
            value={formData.photo_url}
            onChange={handleChange}
            className="w-full border border-gray-400 rounded px-3 py-2"
          />
        </div>

        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          Add Member
        </button>
      </form>
    </div>
  );
};

export default AddMember;
