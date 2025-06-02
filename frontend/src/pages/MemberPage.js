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
  const [spouseInfo, setSpouseInfo] = useState(null);

  useEffect(() => {
    if (id) {
      fetchMember();
      fetchTaggedPhotos();
    }
  }, [id]);

  // FIXED: Move fetchSpouseInfo to top level (outside of fetchMember)
  const fetchSpouseInfo = async (spouseId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members/${spouseId}`);
      setSpouseInfo(response.data);
    } catch (error) {
      console.error('Error fetching spouse info:', error);
      setSpouseInfo(null);
    }
  };

  // useEffect to fetch spouse information when member changes
  useEffect(() => {
    if (member && member.spouse_id) {
      fetchSpouseInfo(member.spouse_id);
    }
  }, [member]);

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="family-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              {/* Family tree branches */}
              <path d="M30,10 L30,50 M10,30 L50,30 M20,20 L40,40 M40,20 L20,40"
                stroke="currentColor" strokeWidth="1" className="text-blue-200" />
              {/* Small hearts */}
              <path d="M15,15 C15,15 10,12 10,8 C10,6 11,5 12,5 C13,5 15,6 15,8 C15,6 17,5 18,5 C19,5 20,6 20,8 C20,12 15,15 15,15 Z"
                fill="currentColor" className="text-pink-200" />
              <path d="M45,45 C45,45 40,42 40,38 C40,36 41,35 42,35 C43,35 45,36 45,38 C45,36 47,35 48,35 C49,35 50,36 50,38 C50,42 45,45 45,45 Z"
                fill="currentColor" className="text-purple-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#family-pattern)" />
        </svg>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left decoration */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-xl"></div>

        {/* Top right decoration */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-blue-200/30 to-cyan-200/30 rounded-full blur-xl"></div>

        {/* Bottom decoration */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-80 h-40 bg-gradient-to-t from-purple-200/30 to-pink-200/30 rounded-full blur-xl"></div>
      </div>

      {/* Main content with enhanced styling */}
      <div className="relative z-10 max-w-3xl mx-auto p-4">
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/50 relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-purple-50/30 pointer-events-none"></div>

          {/* Content - with relative positioning */}
          <div className="relative z-10">
            {/* Profile Photo Section - Enhanced */}
            <div className="text-center mb-6">
              {member.photo_url && (
                <div className="relative inline-block mb-6">
                  {/* Enhanced decorative ring */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full opacity-75 blur-sm animate-pulse"></div>
                  <div className="relative bg-white rounded-full p-2">
                    <img
                      src={`${process.env.REACT_APP_API}/${member.photo_url}`}
                      alt={fullName}
                      className="w-40 h-40 object-cover rounded-full shadow-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Name with enhanced styling */}
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-800 via-purple-700 to-blue-700 bg-clip-text text-transparent">
                {firstName} {middleName && `${middleName} `}{lastName}
              </h1>

              {member.pronouns && (
                <p className="text-purple-600 italic font-medium">{member.pronouns}</p>
              )}

              {/* Life dates with enhanced styling */}
              {member.birth_date && (
                <div className="text-gray-600 mt-3 bg-white/60 backdrop-blur-sm rounded-lg p-3 inline-block border border-white/50">
                  <p className="font-medium">
                    {formatDate(member.birth_date)} – {member.death_date ? formatDate(member.death_date) : 'Present'}
                  </p>
                  {age !== null && (
                    <p className="text-sm text-gray-500 mt-1">
                      {member.death_date ? `(Lived ${age} years)` : `(${age} years old)`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Member Details Section - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Left column */}
              <div className="space-y-3">
                {member.relationship && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                    <span className="text-sm font-medium text-gray-600">Relationship</span>
                    <p className="font-semibold text-gray-800">{member.relationship}</p>
                  </div>
                )}

                {member.gender && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-100">
                    <span className="text-sm font-medium text-gray-600">Gender</span>
                    <p className="font-semibold text-gray-800">{member.gender}</p>
                  </div>
                )}

                {member.birth_place && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-100">
                    <span className="text-sm font-medium text-gray-600">Birthplace</span>
                    <p className="font-semibold text-gray-800">{member.birth_place}</p>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-3">
                {member.location && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-100">
                    <span className="text-sm font-medium text-gray-600">Location</span>
                    <p className="font-semibold text-gray-800">{member.location}</p>
                  </div>
                )}

                {member.occupation && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-100">
                    <span className="text-sm font-medium text-gray-600">Occupation</span>
                    <p className="font-semibold text-gray-800">{member.occupation}</p>
                  </div>
                )}

                {(member.email || member.phone) && (
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-100">
                    <span className="text-sm font-medium text-gray-600">Contact</span>
                    <div className="space-y-1">
                      {member.email && <p className="font-semibold text-gray-800">{member.email}</p>}
                      {member.phone && <p className="font-semibold text-gray-800">{member.phone}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Enhanced */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Link
                to={`/members/${member.id}/edit`}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-medium hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-lg"
              >
                ✏️ Edit
              </Link>
              <Link
                to={`/family-tree/${member.id}`}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-medium hover:from-green-600 hover:to-teal-600 transform hover:scale-105 transition-all shadow-lg"
              >
                🌳 Family Tree
              </Link>
            </div>

            {/* Marriage Information Section - Enhanced */}
            {member && (
              <div className="mt-6 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-4 border border-rose-100">
                <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">
                  💍 Marriage Information
                </h3>

                {member.is_married ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✅ Married
                      </span>
                    </div>

                    {member.marriage_date && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <strong className="text-gray-700">Marriage Date:</strong>
                        <span className="ml-2 text-gray-800">{formatDate(member.marriage_date)}</span>
                      </div>
                    )}

                    {spouseInfo ? (
                      <div className="flex items-center space-x-3 bg-white/70 rounded-lg p-3 border border-white">
                        {spouseInfo.photo_url && (
                          <img
                            src={`${process.env.REACT_APP_API}/${spouseInfo.photo_url}`}
                            alt={`${spouseInfo.first_name} ${spouseInfo.last_name}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-rose-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-700">
                            <strong>Spouse:</strong>
                            <Link
                              to={`/members/${spouseInfo.id}`}
                              className="text-rose-600 hover:text-rose-800 hover:underline ml-2 font-semibold"
                            >
                              {spouseInfo.first_name} {spouseInfo.last_name}
                            </Link>
                          </p>
                          {spouseInfo.birth_date && (
                            <p className="text-sm text-gray-600">
                              Born: {formatDate(spouseInfo.birth_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : member.spouse_id ? (
                      <p className="text-gray-600 bg-white/70 rounded-lg p-3">
                        <strong>Spouse:</strong> (Member #{member.spouse_id} - details not available)
                      </p>
                    ) : (
                      <p className="text-gray-600 bg-white/70 rounded-lg p-3">No spouse selected</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      ❌ Not Married
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Relationships Section - Enhanced */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                  👨‍👩‍👧‍👦 Family Relationships
                </h2>
                <button
                  onClick={() => setShowAddRelationship(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all shadow-lg font-medium"
                >
                  ➕ Add Relationship
                </button>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <RelationshipsList memberId={parseInt(id)} key={showAddRelationship ? 'refresh' : 'normal'} />
              </div>
            </div>

            {/* Tagged Photos Section - Enhanced */}
            {taggedPhotos && taggedPhotos.length > 0 && (
              <div className="mt-8">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100 mb-4">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                    📸 Photos of {firstName}
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                  {taggedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="relative overflow-hidden rounded-lg border-2 border-white shadow-md">
                        <img
                          src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                          alt="Tagged photo"
                          className="w-full h-32 object-cover transition-transform group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg">
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setAsProfilePhoto(photo.id)}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm hover:from-blue-600 hover:to-purple-600 shadow-lg font-medium"
                            >
                              Set as Profile
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-center bg-white/70 rounded px-2 py-1">
                        From: {photo.album_title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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