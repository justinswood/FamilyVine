import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [imageErrors, setImageErrors] = useState(new Set());

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/api/members`)
      .then(res => setMembers(res.data))
      .catch(err => console.error('Error fetching members:', err));
  }, []);

  const getPhotoUrl = (member) => {
    // If we've already had an error with this image, return placeholder
    if (imageErrors.has(member.id)) {
      return 'https://via.placeholder.com/80x80/cccccc/666666?text=No+Photo';
    }

    if (!member.photo_url) {
      return 'https://via.placeholder.com/80x80/cccccc/666666?text=No+Photo';
    }

    // If it's already a full URL, use it
    if (member.photo_url.startsWith('http')) {
      return member.photo_url;
    }

    // If it starts with '/', remove it to avoid double slashes
    const cleanPath = member.photo_url.startsWith('/') 
      ? member.photo_url.substring(1) 
      : member.photo_url;

    return `${process.env.REACT_APP_API}/${cleanPath}`;
  };

  const handleImageError = (memberId) => {
    setImageErrors(prev => new Set([...prev, memberId]));
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">All Family Members</h1>
      <div className="space-y-4">
        {members.map(member => (
          <div key={member.id} className="bg-white p-4 rounded shadow flex items-center space-x-4">
            <img
              src={getPhotoUrl(member)}
              alt={`${member.first_name} ${member.last_name}`}
              className="w-16 h-16 rounded-full object-cover"
              onError={() => handleImageError(member.id)}
              loading="lazy"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{member.first_name} {member.last_name}</h2>
              <p className="text-gray-600">{member.location || '—'}</p>
            </div>
            <div className="space-x-4">
              <Link to={`/members/${member.id}`} className="text-blue-600 hover:underline">View</Link>
              <Link to={`/members/${member.id}/edit`} className="text-yellow-700 hover:underline">Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberList;