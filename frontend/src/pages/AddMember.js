import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AddMember() {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    birth_date: '',
    death_date: '',
    location: ''
  });
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = e => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (photo) {
      data.append('photo', photo);
    }

    try {
      const res = await axios.post('http://localhost:5000/api/members', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/members/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to add member.');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow rounded mt-10">
      <h2 className="text-2xl font-bold mb-4">Add Family Member</h2>
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <input type="text" name="name" placeholder="Name" onChange={handleChange} required className="w-full border p-2 rounded" />
        <input type="text" name="bio" placeholder="Bio" onChange={handleChange} className="w-full border p-2 rounded" />
        <input type="date" name="birth_date" placeholder="Birth Date" onChange={handleChange} className="w-full border p-2 rounded" />
        <input type="date" name="death_date" placeholder="Death Date" onChange={handleChange} className="w-full border p-2 rounded" />
        <input type="text" name="location" placeholder="Location" onChange={handleChange} className="w-full border p-2 rounded" />
        <input type="file" name="photo" onChange={handlePhotoChange} className="w-full border p-2 rounded" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add Member</button>
      </form>
    </div>
  );
}

export default AddMember;
