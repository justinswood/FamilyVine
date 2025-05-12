import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const MemberPage = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/api/members/${id}`)
      .then(res => setMember(res.data))
      .catch(err => console.error('Error fetching member:', err));
  }, [id]);

  if (!member) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow rounded p-6 text-center">
        {member.photo_url && (
          <img
            src={`${process.env.REACT_APP_API}${member.photo_url}`}
            alt={member.first_name + ' ' + member.last_name}
            className="mx-auto mb-4 w-40 h-40 object-cover rounded-full border"
          />
        )}
        <h1 className="text-2xl font-bold mb-1">
          {member.first_name} {member.last_name}
        </h1>
        {member.pronouns && <p className="text-gray-500 italic">{member.pronouns}</p>}
        {member.birth_date && (
          <p className="text-gray-600 mt-2">
            {new Date(member.birth_date).toLocaleDateString()} – {member.death_date ? new Date(member.death_date).toLocaleDateString() : 'Present'}
          </p>
        )}

        <div className="text-left mt-6 space-y-2">
          {member.relationship && <p><strong>Relationship:</strong> {member.relationship}</p>}
          {member.gender && <p><strong>Gender:</strong> {member.gender}</p>}
          {member.birth_place && <p><strong>Birthplace:</strong> {member.birth_place}</p>}
          {member.death_place && <p><strong>Death Place:</strong> {member.death_place}</p>}
          {member.location && <p><strong>Location:</strong> {member.location}</p>}
          {member.occupation && <p><strong>Occupation:</strong> {member.occupation}</p>}
          {member.email && <p><strong>Email:</strong> {member.email}</p>}
          {member.phone && <p><strong>Phone:</strong> {member.phone}</p>}
        </div>

        <div className="mt-4">
          <Link to={`/members/${member.id}/edit`} className="text-blue-600 underline">
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MemberPage;
