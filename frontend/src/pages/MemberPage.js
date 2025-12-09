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
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (id) {
      fetchMember();
      fetchTaggedPhotos();
    }
  }, [id]);

  useEffect(() => {
    if (member && member.spouse_id) {
      fetchSpouseInfo(member.spouse_id);
    }
  }, [member]);

  const fetchSpouseInfo = async (spouseId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members/${spouseId}`);
      setSpouseInfo(response.data);
    } catch (error) {
      console.error('Error fetching spouse info:', error);
      setSpouseInfo(null);
    }
  };

  const fetchMember = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members/${id}`);
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading member...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-red-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Member</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchMember} className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-all">
              Try Again
            </button>
            <Link to="/members" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition-all">
              Back to Members
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Member not found</p>
          <Link to="/members" className="text-purple-600 hover:underline">Back to Members</Link>
        </div>
      </div>
    );
  }

  const firstName = member.first_name || '';
  const middleName = member.middle_name || '';
  const lastName = member.last_name || '';
  const fullName = `${firstName} ${middleName} ${lastName}`.trim() || 'Unknown Name';
  const age = calculateAge(member.birth_date, member.death_date);
  const isMinor = () => age !== null && age < 18;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Subtle top accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Back Button */}
        <Link to="/tree" className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors mb-6 group text-sm">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tree
        </Link>

        {/* Profile Header */}
        <div className="text-center mb-10">
          {/* Profile Photo */}
          <div className="relative inline-block mb-5">
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 p-0.5 shadow-xl shadow-purple-200/50">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
                  {member.photo_url ? (
                    <img
                      src={`${process.env.REACT_APP_API}/${member.photo_url}`}
                      alt={fullName}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span className={`text-4xl font-light text-purple-400 ${member.photo_url ? 'hidden' : 'flex'}`}>
                    {firstName[0]}{lastName[0]}
                  </span>
                </div>
              </div>
            </div>
            {/* Living indicator */}
            {!member.death_date && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white shadow-md" title="Living" />
            )}
          </div>

          {/* Name */}
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight mb-1">
            {fullName}
          </h1>

          {/* Life dates */}
          {member.birth_date && (
            <p className="text-slate-500 text-sm">
              {formatDate(member.birth_date)} — {member.death_date ? formatDate(member.death_date) : 'Present'}
              {age !== null && (
                <>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="text-purple-600 font-medium">
                    {member.death_date ? `Lived ${age} years` : `${age} years old`}
                  </span>
                </>
              )}
            </p>
          )}

          {/* Quick Actions */}
          <div className="flex justify-center gap-3 mt-5">
            <Link
              to={`/members/${member.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </Link>
            <button
              onClick={() => setActiveTab('photos')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-all shadow-sm shadow-purple-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photos
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-100 rounded-full p-1">
            {['details', 'family', 'photos'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoCard icon="👤" label="Gender" value={member.gender} tint="pink" />
              <InfoCard icon="📍" label="Location" value={member.location} tint="amber" />
              <InfoCard icon="🏠" label="Birthplace" value={member.birth_place} tint="emerald" />
              <InfoCard icon="💼" label="Occupation" value={member.occupation} tint="blue" />
              <InfoCard icon="📧" label="Email" value={member.email} tint="purple" isLink />
              <InfoCard icon="📞" label="Phone" value={member.phone} tint="slate" />
            </div>

            {/* Marriage Section - Hidden for minors */}
            {!isMinor() && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">💍</span>
                  <h3 className="font-semibold text-slate-700">Marriage</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.is_married
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {member.is_married ? 'Married' : 'Not Married'}
                  </span>
                </div>

                {member.is_married && spouseInfo && (
                  <Link
                    to={`/members/${spouseInfo.id}`}
                    className="flex items-center gap-4 bg-white/60 rounded-xl p-3 hover:bg-white/80 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center text-lg overflow-hidden">
                      {spouseInfo.photo_url ? (
                        <img
                          src={`${process.env.REACT_APP_API}/${spouseInfo.photo_url}`}
                          alt={`${spouseInfo.first_name} ${spouseInfo.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{spouseInfo.first_name?.[0]}{spouseInfo.last_name?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">{spouseInfo.first_name} {spouseInfo.last_name}</p>
                      {member.marriage_date && (
                        <p className="text-sm text-slate-500">Married {formatDate(member.marriage_date)}</p>
                      )}
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Family Tab */}
        {activeTab === 'family' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-700">Family Connections</h3>
              <button
                onClick={() => setShowAddRelationship(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-sm hover:bg-emerald-600 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <RelationshipsList memberId={parseInt(id)} key={showAddRelationship ? 'refresh' : 'normal'} />
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-700">Tagged Photos</h3>
              <span className="text-sm text-slate-400">{taggedPhotos.length} photos</span>
            </div>

            {taggedPhotos.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {taggedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                        alt="Tagged photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition-all flex items-center justify-center">
                      <button
                        onClick={() => setAsProfilePhoto(photo.id)}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-slate-700 rounded-full text-xs font-medium hover:bg-purple-600 hover:text-white transition-all"
                      >
                        Set as Profile
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-center truncate">{photo.album_title}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-slate-400">No photos tagged yet</p>
              </div>
            )}
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

// Info Card Component
const InfoCard = ({ icon, label, value, isLink = false, tint = 'purple' }) => {
  if (!value) return null;

  const tintStyles = {
    purple: 'bg-purple-50/80 border-purple-100 hover:border-purple-200',
    pink: 'bg-pink-50/80 border-pink-100 hover:border-pink-200',
    blue: 'bg-blue-50/80 border-blue-100 hover:border-blue-200',
    emerald: 'bg-emerald-50/80 border-emerald-100 hover:border-emerald-200',
    amber: 'bg-amber-50/80 border-amber-100 hover:border-amber-200',
    slate: 'bg-slate-50/80 border-slate-100 hover:border-slate-200',
  };

  return (
    <div className={`rounded-xl p-4 border hover:shadow-md transition-all ${tintStyles[tint]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${isLink ? 'text-purple-600' : 'text-slate-700'}`}>
        {value}
      </p>
    </div>
  );
};

export default MemberPage;
