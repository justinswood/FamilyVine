
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditMember = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    death_date: '',
    death_place: '',
    alive: true,
    gender: '',
    email: '',
    phone: '',
    photo_url: '',
    photo_file: null
  });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/api/members/${id}`)
      .then(res => {
        setFormData({ ...res.data, photo_file: null });
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, photo_file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) payload.append(key, value);
    });
    try {
      await axios.put(`${process.env.REACT_APP_API}/api/members/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/members/${id}`);
    } catch (err) {
      console.error('Error updating member:', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Edit Member</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">First Name</label>
          <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full border p-2" />
        </div>
        <div>
          <label className="block font-medium">Middle Name</label>
          <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} className="w-full border p-2" />
        </div>
        <div>
          <label className="block font-medium">Last Name</label>
          <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full border p-2" />
        </div>
        <div>
          <label className="block font-medium">Photo Upload</label>
          <input type="file" name="photo_file" onChange={handleChange} className="w-full border p-2" />
        </div>
        <div>
          <label className="block font-medium">Photo URL</label>
          <input type="text" name="photo_url" value={formData.photo_url} onChange={handleChange} className="w-full border p-2" />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
};

export default EditMember;
