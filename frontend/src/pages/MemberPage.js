import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import RelationshipsList from '../components/RelationshipsList';
import AddRelationship from '../components/AddRelationship';
import { 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Briefcase, 
  Home,
  Heart,
  Users
} from 'lucide-react';

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
      <div className="max-w-4xl mx-auto p-3">
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="animate-pulse">
            <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-3"></div>
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
      <div className="max-w-4xl mx-auto p-3">
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-red-600 mb-3">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-lg font-bold mb-2">Error Loading Member</h2>
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
      <div className="max-w-4xl mx-auto p-3">
        <div className="bg-white shadow rounded p-4 text-center">
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

  // Helper function to determine if member is under 18
  const isMinor = () => {
    if (age === null) return false; // If no age available, show marriage section
    return age < 18;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Paper texture overlay */}
      <div className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='0.03'%3E%3Cpolygon fill='%23000' points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}>
      </div>

      {/* Fabric/linen texture pattern */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}>
      </div>

      {/* Animated background pattern - REDUCED opacity and size */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="family-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              {/* Family tree branches */}
              <path d="M20,5 L20,35 M5,20 L35,20 M12,12 L28,28 M28,12 L12,28"
                stroke="currentColor" strokeWidth="0.5" className="text-blue-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#family-pattern)" />
        </svg>
      </div>

      {/* Floating decorative elements - SMALLER and more subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-5 -left-5 w-20 h-20 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-lg"></div>
        <div className="absolute -top-10 -right-10 w-30 h-30 bg-gradient-to-bl from-blue-200/20 to-cyan-200/20 rounded-full blur-lg"></div>
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 w-40 h-20 bg-gradient-to-t from-purple-200/20 to-pink-200/20 rounded-full blur-lg"></div>
      </div>

      {/* Main content - COMPACTED with smaller padding and margins */}
      <div className="relative z-10 max-w-5xl mx-auto p-2">
        <div className="backdrop-blur-sm shadow-2xl rounded-xl p-4 border border-gray-200 relative overflow-hidden"
          style={{
            backgroundColor: '#d3d3d3',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 40' width='80' height='40'%3E%3Cpath fill='%23000000' fill-opacity='0.03' d='M0 40a19.96 19.96 0 0 1 5.9-14.11 20.17 20.17 0 0 1 19.44-5.2A20 20 0 0 1 20.2 40H0zM65.32.75A20.02 20.02 0 0 1 40.8 25.26 20.02 20.02 0 0 1 65.32.76zM.07 0h20.1l-.08.07A20.02 20.02 0 0 1 .75 5.25 20.08 20.08 0 0 1 .07 0zm1.94 40h2.53l4.26-4.24v-9.78A17.96 17.96 0 0 0 2 40zm5.38 0h9.8a17.98 17.98 0 0 0 6.67-16.42L7.4 40zm3.43-15.42v9.17l11.62-11.59c-3.97-.5-8.08.3-11.62 2.42zm32.86-.78A18 18 0 0 0 63.85 3.63L43.68 23.8zm7.2-19.17v9.15L62.43 2.22c-3.96-.5-8.05.3-11.57 2.4zm-3.49 2.72c-4.1 4.1-5.81 9.69-5.13 15.03l6.61-6.6V6.02c-.51.41-1 .85-1.48 1.33zM17.18 0H7.42L3.64 3.78A18 18 0 0 0 17.18 0zM2.08 0c-.01.8.04 1.58.14 2.37L4.59 0H2.07z'%3E%3C/path%3E%3C/svg%3E")`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
          {/* Paper texture inside card - removed since we have new pattern */}
          {/* Subtle inner glow - REDUCED */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-purple-50/20 pointer-events-none"></div>

          {/* Content - with relative positioning */}
          <div className="relative z-10">
            {/* COMPACTED: Profile Photo Section - smaller photo and spacing */}
            <div className="text-center mb-4">
              {member.photo_url && (
                <div className="relative inline-block mb-3">
                  {/* SMALLER decorative ring with shadow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full opacity-70 blur-md"></div>
                  <div className="relative bg-white rounded-full p-1.5 shadow-xl">
                    <img
                      src={`${process.env.REACT_APP_API}/${member.photo_url}`}
                      alt={fullName}
                      className="w-24 h-24 object-cover rounded-full shadow-inner"
                      style={{
                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* COMPACTED: Name with smaller text */}
              <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-gray-800 via-purple-700 to-blue-700 bg-clip-text text-transparent">
                {firstName} {middleName && `${middleName} `}{lastName}
              </h1>

              {member.pronouns && (
                <p className="text-purple-600 italic text-sm font-medium">{member.pronouns}</p>
              )}

              {/* COMPACTED: Life dates with smaller padding */}
              {member.birth_date && (
                <div className="text-gray-600 mt-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 inline-block border border-gray-200 shadow-md">
                  <p className="text-sm font-medium">
                    {formatDate(member.birth_date)} – {member.death_date ? formatDate(member.death_date) : 'Present'}
                  </p>
                  {age !== null && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {member.death_date ? `(Lived ${age} years)` : `(${age} years old)`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* COMPACTED: Member Details Section - smaller spacing and padding */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {/* Left column */}
              <div className="space-y-2">
                {member.relationship && (
                  <div className="bg-gradient-to-r from-blue-50/95 to-purple-50/95 rounded-lg p-2 border border-blue-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-gray-600">Relationship</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 ml-6">{member.relationship}</p>
                  </div>
                )}

                {member.gender && (
                  <div className="bg-gradient-to-r from-pink-50/95 to-purple-50/95 rounded-lg p-2 border border-pink-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-pink-600" />
                      <span className="text-xs font-medium text-gray-600">Gender</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 ml-6">{member.gender}</p>
                  </div>
                )}

                {member.birth_place && (
                  <div className="bg-gradient-to-r from-green-50/95 to-blue-50/95 rounded-lg p-2 border border-green-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-gray-600">Birthplace</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 ml-6">{member.birth_place}</p>
                  </div>
                )}
              </div>

              {/* Middle column */}
              <div className="space-y-2">
                {member.location && (
                  <div className="bg-gradient-to-r from-yellow-50/95 to-orange-50/95 rounded-lg p-2 border border-yellow-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-yellow-600" />
                      <span className="text-xs font-medium text-gray-600">Location</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 ml-6">{member.location}</p>
                  </div>
                )}

                {member.occupation && (
                  <div className="bg-gradient-to-r from-indigo-50/95 to-blue-50/95 rounded-lg p-2 border border-indigo-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-gray-600">Occupation</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 ml-6">{member.occupation}</p>
                  </div>
                )}

                {member.death_place && (
                  <div className="bg-gradient-to-r from-gray-50/95 to-slate-50/95 rounded-lg p-2 border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600">Death Place</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 ml-6">{member.death_place}</p>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                {(member.email || member.phone) && (
                  <div className="bg-gradient-to-r from-teal-50/95 to-cyan-50/95 rounded-lg p-2 border border-teal-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm backdrop-blur-sm">
                    <span className="text-xs font-medium text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />
                      Contact
                    </span>
                    <div className="space-y-1 ml-6">
                      {member.email && (
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Mail className="w-3 h-3 text-teal-500" />
                          {member.email}
                        </p>
                      )}
                      {member.phone && (
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Phone className="w-3 h-3 text-teal-500" />
                          {member.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COMPACTED: Action Buttons - smaller buttons and spacing */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Link
                to={`/members/${member.id}/edit`}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-md"
              >
                ✏️ Edit
              </Link>
              <Link
                to={`/family-tree/${member.id}`}
                className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full text-sm font-medium hover:from-green-600 hover:to-teal-600 transform hover:scale-105 transition-all shadow-md"
              >
                🌳 Family Tree
              </Link>
            </div>

            {/* Decorative Divider */}
            <div className="flex items-center justify-center my-6">
              <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent flex-1"></div>
              <div className="px-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent flex-1"></div>
            </div>

            {/* COMPACTED: Layout for Marriage and Relationships - conditional based on age */}
            <div className={`grid gap-4 mb-4 ${isMinor() ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {/* Marriage Information Section - COMPACTED - Hidden for minors */}
              {!isMinor() && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-3 border border-rose-100 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">
                    💍 Marriage
                  </h3>

                  {member.is_married ? (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Married
                        </span>
                      </div>

                      {member.marriage_date && (
                        <div className="bg-white/80 rounded-lg p-2 shadow-sm border border-white">
                          <strong className="text-xs text-gray-700">Marriage Date:</strong>
                          <span className="ml-2 text-sm text-gray-800">{formatDate(member.marriage_date)}</span>
                        </div>
                      )}

                      {spouseInfo ? (
                        <div className="flex items-center space-x-2 bg-white/80 rounded-lg p-2 border border-white shadow-sm">
                          {spouseInfo.photo_url && (
                            <img
                              src={`${process.env.REACT_APP_API}/${spouseInfo.photo_url}`}
                              alt={`${spouseInfo.first_name} ${spouseInfo.last_name}`}
                              className="w-8 h-8 rounded-full object-cover border border-rose-200 shadow-sm"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              <strong>Spouse:</strong>
                              <Link
                                to={`/members/${spouseInfo.id}`}
                                className="text-rose-600 hover:text-rose-800 hover:underline ml-1 font-semibold"
                              >
                                {spouseInfo.first_name} {spouseInfo.last_name}
                              </Link>
                            </p>
                            {spouseInfo.birth_date && (
                              <p className="text-xs text-gray-600">
                                Born: {formatDate(spouseInfo.birth_date)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : member.spouse_id ? (
                        <p className="text-xs text-gray-600 bg-white/70 rounded-lg p-2">
                          <strong>Spouse:</strong> (Member #{member.spouse_id} - details not available)
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 bg-white/70 rounded-lg p-2">No spouse selected</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ❌ Not Married
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Relationships Section - COMPACTED */}
              <div>
                <div className="flex justify-between items-center mb-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100 shadow-md">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                    👨‍👩‍👧‍👦 Relationships
                  </h2>
                  <button
                    onClick={() => setShowAddRelationship(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all shadow-md text-sm font-medium"
                  >
                    ➕ Add
                  </button>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-md">
                  <RelationshipsList memberId={parseInt(id)} key={showAddRelationship ? 'refresh' : 'normal'} />
                </div>
              </div>
            </div>

            {/* COMPACTED: Tagged Photos Section */}
            {taggedPhotos && taggedPhotos.length > 0 && (
              <div>
                {/* Decorative Divider */}
                <div className="flex items-center justify-center my-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent flex-1"></div>
                  <div className="px-4">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent flex-1"></div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100 mb-2 shadow-md">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                    📸 Photos of {firstName}
                  </h2>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-md">
                  {taggedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="relative overflow-hidden rounded-lg border border-white shadow-sm hover:shadow-lg transition-all duration-300">
                        <img
                          src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                          alt="Tagged photo"
                          className="w-full h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg">
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button
                              onClick={() => setAsProfilePhoto(photo.id)}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs hover:from-blue-600 hover:to-purple-600 shadow-md font-medium transform hover:scale-110 transition-transform duration-200"
                            >
                              Set
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center bg-white/70 rounded px-1 py-0.5 group-hover:bg-white/90 transition-colors duration-200">
                        {photo.album_title}
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