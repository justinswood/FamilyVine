import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function MemberPage() {
  const { id } = useParams();
  const [member, setMember] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/members/${id}`)
      .then(res => setMember(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!member) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-2">{member.name}</h1>
      {member.photo_url && <img src={`http://localhost:5000${member.photo_url}`} alt={member.name} className="w-48 mb-4" />}
      <p className="text-gray-600 mb-2">{member.bio}</p>
      <p><strong>Born:</strong> {member.birth_date}</p>
      {member.death_date && <p><strong>Died:</strong> {member.death_date}</p>}
      <p><strong>Location:</strong> {member.location}</p>
    </div>
  );
}

export default MemberPage;
