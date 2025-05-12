
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MemberList = () => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/api/members`)
      .then(res => setMembers(res.data))
      .catch(err => console.error('Error fetching members:', err));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">All Family Members</h1>
      <div className="space-y-4">
        {members.map(member => (
          <div key={member.id} className="bg-white p-4 rounded shadow flex items-center space-x-4">
            <img
              src={
                member.photo_url
                  ? `${process.env.REACT_APP_API}${member.photo_url}`
                  : 'https://via.placeholder.com/80'
              }
              alt={`${member.first_name} ${member.last_name}`}
              className="w-16 h-16 rounded-full object-cover"
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
