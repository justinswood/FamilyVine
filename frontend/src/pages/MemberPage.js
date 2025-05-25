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
  const [error, setError] = useState(null);
  const [showAddRelationship, setShowAddRelationship] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMember();
      fetchTaggedPhotos();
    }
  }, [id]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members/${id}`);
      
      // Safety check for response data
      if (response.data) {
        setMember(response.data);
      } else {
        setError('Member not found');
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      setError('Failed to load member data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaggedPhotos = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/albums/tagged/${id}`);
      setTaggedPhotos(response.data || []);
    } catch (error) {
      console.error('Error fetching tagged photos:', error);
      setTaggedPhotos([]);
    }
  };

  const setAsProfilePhoto = async (photoId) => {
    if (!window.confirm('Set this photo as your profile picture?')) return;
    
    try {
      await axios.put(`${process.env.REACT_APP_API}/api/members/${id}/profile-photo/${photoId}`);
      fetchMember();
      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error setting profile photo:', error);
      alert('Failed to update profile photo. Please try again.');
    }
  };

  const handleRelationshipAdded = () => {
    setShowAddRelationship(false);
  };

  // Helper function to format dates correctly
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Helper function to calculate age
  const calculateAge = (birthDateString, deathDateString = null) => {
    if (!birthDateString) return null;
    
    try {
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
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white shadow rounded p-6 text-center">
          <div className="animate-pulse">
            <div className="w-40 h-40 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white shadow rounded p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-bold mb-2">Error Loading Member</h2>
            <p>{error}</p>
          </div>
          <div className="space-x-4">
            <button 
              onClick={fetchMember}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link 
              to="/members" 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back to Members
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Safety check: if member is still null after loading
  if (!member) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white shadow rounded p-6 text-center">
          <p className="text-gray-500">Member not found</p>
          <Link to="/members" className="text-blue-600 hover:underline">
            Back to Members
          </Link>
        </div>
      </div>
    );
  }

  // Safe access to member properties with fallbacks
  const firstName = member.first_name || '';
  const middleName = member.middle_name || '';
  const lastName = member.last_name || '';
  const fullName = `${firstName} ${middleName} ${lastName}`.trim() || 'Unknown Name';

  // Calculate age once for reuse
  const age = calculateAge(member.birth_date, member.death_date);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow rounded p-6 text-center">
        {member.photo_url && (
          <img
            src={`${process.env.REACT_APP_API}/${member.photo_url}`}
            alt={fullName}
            className="mx-auto mb-4 w-40 h-40 object-cover rounded-full border"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <h1 className="text-2xl font-bold mb-1">
          {firstName} {middleName && `${middleName} `}{lastName}
        </h1>
        {member.pronouns && <p className="text-gray-500 italic">{member.pronouns}</p>}
        
        {member.birth_date && (
          <div className="text-gray-600 mt-2 text-center">
            <p>
              {formatDate(member.birth_date)} – {member.death_date ? formatDate(member.death_date) : 'Present'}
            </p>
            {age !== null && (
              <p className="text-sm text-gray-500 mt-1">
                {member.death_date ? `(Lived ${age} years)` : `(${age} years old)`}
              </p>
            )}
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
        {taggedPhotos && taggedPhotos.length > 0 && (
          <div className="mt-8 text-left">
            <h2 className="text-xl font-bold mb-4">Photos of {firstName}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {taggedPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                    alt="Tagged photo"
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
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
      {showAddRelationship && member && (
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