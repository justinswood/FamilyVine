
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const MemberCard = ({ member }) => {
  const fullName = `${member.first_name || ''} ${member.middle_name || ''} ${member.last_name || ''}`.trim();
  const photoUrl = member.photo_url || 'https://via.placeholder.com/150';

  return (
    <div className="bg-white shadow rounded-xl p-4 text-center">
      <img
        src={photoUrl}
        alt={fullName}
        className="w-32 h-32 object-cover rounded-full mx-auto mb-4"
      />
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{fullName}</h3>
      <div className="text-gray-600 mb-2 flex justify-center items-center gap-1">
        <MapPin size={16} />
        <span>{member.location || '—'}</span>
      </div>
      <div className="space-x-4">
        <Link to={`/members/${member.id}`} className="text-blue-600 hover:underline">
          View
        </Link>
        <Link to={`/members/${member.id}/edit`} className="text-yellow-700 hover:underline">
          Edit
        </Link>
      </div>
    </div>
  );
};

export default MemberCard;
