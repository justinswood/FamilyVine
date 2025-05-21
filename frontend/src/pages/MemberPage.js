import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import RelationshipsList from '../components/RelationshipsList';
import AddRelationship from '../components/AddRelationship';

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
    // This will trigger a re-render of the RelationshipsList component
    // since the key prop will change
    setShowAddRelationship(false);
  };

  // Helper function to format dates correctly (avoids timezone issues)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Extract just the date part (YYYY-MM-DD) and parse manually
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    
    // Create date using local timezone (not UTC)
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
    
    // Parse birth date
    const birthOnly = birthDateString.split('T')[0];
    const [birthYear, birthMonth, birthDay] = birthOnly.split('-').map(Number);
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    
    // Use death date if person is deceased, otherwise use current date
    let endDate;
    if (deathDateString) {
      const deathOnly = deathDateString.split('T')[0];
      const [deathYear, deathMonth, deathDay] = deathOnly.split('-').map(Number);
      endDate = new Date(deathYear, deathMonth - 1, deathDay);
    } else {
      endDate = new Date();
    }
    
    // Calculate age
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
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
        {member.photo_url && (
          <img
            src={`${process.env.REACT_APP_API}/${member.photo_url}`}
            alt={member.first_name + ' ' + member.last_name}
            className="mx-auto mb-4 w-40 h-40 object-cover rounded-full border"
          />
        )}
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