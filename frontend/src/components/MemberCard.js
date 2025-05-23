// Update your frontend/src/components/MemberCard.js

import React from 'react';
import { Link } from 'react-router-dom';
import ProfileImage from './ProfileImage'; // Add this import

const MemberCard = ({ member }) => {
  const fullName = `${member.first_name || ''} ${member.middle_name ? ' ' + member.middle_name + ' ' : ' '}${member.last_name || ''}`.trim();
  
  const calculateAge = (birthDate, deathDate = null) => {
    if (!birthDate) return null;
    
    const birthOnly = birthDate.split('T')[0];
    const [birthYear, birthMonth, birthDay] = birthOnly.split('-').map(Number);
    const birth = new Date(birthYear, birthMonth - 1, birthDay);
    
    let endDate;
    if (deathDate) {
      const deathOnly = deathDate.split('T')[0];
      const [deathYear, deathMonth, deathDay] = deathOnly.split('-').map(Number);
      endDate = new Date(deathYear, deathMonth - 1, deathDay);
    } else {
      endDate = new Date();
    }
    
    let age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = calculateAge(member.birth_date, member.death_date);

  const formatAgeDisplay = (age, isAlive) => {
    if (age === null) return null;
    
    if (isAlive !== false) {
      return `${age} years old`;
    } else {
      return `Lived ${age} years`;
    }
  };

  const isDeceased = member.is_alive === false || member.death_date !== null;

  return (
    <div className="bg-white shadow rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
      <div className="relative mb-4 flex justify-center">
        <ProfileImage 
          member={member} 
          size="medium"
          className="shadow-md"
        />
        {/* Deceased indicator */}
        {isDeceased && (
          <div className="absolute -top-1 -right-1 bg-gray-100 rounded-full p-1 border-2 border-white shadow-sm">
            <span 
              className="text-gray-600" 
              title="Deceased"
              style={{ fontSize: '1.5em', lineHeight: '1' }}
            >
              ✝
            </span>
          </div>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{fullName}</h3>
      
      {/* Age display */}
      {age !== null && (
        <p className="text-gray-500 text-sm mb-2">
          {formatAgeDisplay(age, member.is_alive)}
        </p>
      )}
      
      {/* Location with icon */}
      <div className="text-gray-600 mb-2 flex justify-center items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{member.location || 'Location not specified'}</span>
      </div>
      
      {/* Occupation */}
      {member.occupation && (
        <p className="text-gray-500 text-sm italic mb-3">{member.occupation}</p>
      )}
      
      <div className="flex justify-center space-x-3">
        <Link 
          to={`/members/${member.id}`} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          View
        </Link>
        <Link 
          to={`/members/${member.id}/edit`} 
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Edit
        </Link>
      </div>
    </div>
  );
};

export default MemberCard;

const MemberPage = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [taggedPhotos, setTaggedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRelationship, setShowAddRelationship] = useState(false);

  useEffect(() => {
    fetchMember();
    fetchTaggedPhotos();
  }, [id]);

  const fetchMember = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members/${id}`);
      setMember(response.data);
    } catch (error) {
      console.error('Error fetching member:', error);
    }
  };

  const fetchTaggedPhotos = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/albums/tagged/${id}`);
      setTaggedPhotos(response.data);
    } catch (error) {
      console.error('Error fetching tagged photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const setAsProfilePhoto = async (photoId) => {
    if (!window.confirm('Set this photo as your profile picture?')) return;
    
    try {
      await axios.put(`${process.env.REACT_APP_API}/api/members/${id}/profile-photo/${photoId}`);
      fetchMember(); // Refresh member data to show new profile photo
      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error setting profile photo:', error);
      alert('Failed to update profile photo. Please try again.');
    }
  };

  const handleRelationshipAdded = () => {
    setShowAddRelationship(false);
  };

  // Helper function to format dates correctly (avoids timezone issues)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to calculate age
  const calculateAge = (birthDateString, deathDateString = null) => {
    if (!birthDateString) return null;
    
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
  };

  if (loading || !member) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow rounded p-6 text-center">
        {/* Replace the old image code with ProfileImage component */}
        <div className="mb-4 flex justify-center">
          <ProfileImage 
            member={member} 
            size="large"
            className="shadow-lg"
          />
        </div>

        <h1 className="text-2xl font-bold mb-1">
          {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
        </h1>
        {member.pronouns && <p className="text-gray-500 italic">{member.pronouns}</p>}
        {member.birth_date && (
          <div className="text-gray-600 mt-2 text-center">
            <p>
              {formatDate(member.birth_date)} – {member.death_date ? formatDate(member.death_date) : 'Present'}
            </p>
            {(() => {
              const age = calculateAge(member.birth_date, member.death_date);
              if (age !== null) {
                return (
                  <p className="text-sm text-gray-500 mt-1">
                    {member.death_date ? `(Lived ${age} years)` : `(${age} years old)`}
                  </p>
                );
              }
              return null;
            })()}
          </div>
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

        <div className="mt-4 space-x-4">
          <Link to={`/members/${member.id}/edit`} className="text-blue-600 underline">
            Edit
          </Link>
          <Link to={`/family-tree/${member.id}`} className="text-green-600 underline">
            View Family Tree
          </Link>
        </div>

        {/* Relationships Section */}
        <div className="mt-8 text-left">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Family Relationships</h2>
            <button
              onClick={() => setShowAddRelationship(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Relationship
            </button>
          </div>
          
          <RelationshipsList memberId={parseInt(id)} key={showAddRelationship ? 'refresh' : 'normal'} />
        </div>

        {/* Tagged Photos Section */}
        {taggedPhotos.length > 0 && (
          <div className="mt-8 text-left">
            <h2 className="text-xl font-bold mb-4">Photos of {member.first_name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {taggedPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                    alt="Tagged photo"
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setAsProfilePhoto(photo.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Set as Profile Photo
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">From: {photo.album_title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Relationship Modal */}
      {showAddRelationship && (
        <AddRelationship
          member={member}
          onRelationshipAdded={handleRelationshipAdded}
          onClose={() => setShowAddRelationship(false)}
        />
      )}
    </div>
  );
};

export default MemberPage;