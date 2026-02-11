import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCropper from '../components/PhotoCropper';
import PhotoGalleryPicker from '../components/PhotoGalleryPicker';

/* Fleur-de-lis accent for Founder toggle */
const FleurAccent = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 9.5 5.5 9.5 8C9.5 9.8 10.5 11 12 11.5C13.5 11 14.5 9.8 14.5 8C14.5 5.5 12 2 12 2Z" opacity="0.9"/>
    <path d="M5 10C5 10 3 12.5 4 14.5C4.8 16 6.5 16.5 8 16C8 16 7 14.5 7.5 13C8 11.5 9.5 11 9.5 11C7.5 11 5 10 5 10Z" opacity="0.7"/>
    <path d="M19 10C19 10 21 12.5 20 14.5C19.2 16 17.5 16.5 16 16C16 16 17 14.5 16.5 13C16 11.5 14.5 11 14.5 11C16.5 11 19 10 19 10Z" opacity="0.7"/>
    <path d="M12 12V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M9 18H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const AddMember = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    nickname: '',
    last_name: '',
    suffix: '',
    birth_date: '',
    birth_place: '',
    location: '',
    occupation: '',
    phone: '',
    email: '',
    gender: '',
    is_alive: 'true',
    death_date: '',
    death_place: '',
    is_married: 'false',
    marriage_date: '',
    spouse_id: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryPhotoPath, setGalleryPhotoPath] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [familyBranches, setFamilyBranches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      setFamilyMembers(response.data);

      // Extract unique surnames for branch dropdown
      const surnames = new Set();
      response.data.forEach(m => {
        if (m.last_name && m.last_name.trim() &&
            !m.first_name?.toLowerCase().includes('unknown')) {
          // Normalize: remove Jr., Sr., etc. for branch grouping
          const base = m.last_name.trim().replace(/\s+(Jr\.|Sr\.|III|II|IV)$/i, '');
          surnames.add(base);
        }
      });
      setFamilyBranches(Array.from(surnames).sort());
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setGalleryPhotoPath(null);
      setSelectedImageFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setPhotoFile(croppedFile);
    setShowCropper(false);
    setSelectedImageFile(null);
    const url = URL.createObjectURL(croppedFile);
    setPreviewUrl(url);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImageFile(null);
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleGalleryPhotoSelect = (photoPath) => {
    setGalleryPhotoPath(photoPath);
    setShowGalleryPicker(false);
    setPhotoFile(null);
    setPreviewUrl(`${process.env.REACT_APP_API}/${photoPath}`);
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleGalleryCancel = () => {
    setShowGalleryPicker(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const form = new FormData();

      const formattedData = {
        ...formData,
        birth_date: formData.birth_date ? formData.birth_date.split('T')[0] : '',
        death_date: formData.death_date ? formData.death_date.split('T')[0] : '',
        marriage_date: formData.marriage_date ? formData.marriage_date.split('T')[0] : ''
      };

      Object.entries(formattedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          form.append(key, value);
        }
      });

      if (photoFile) {
        form.append('photo', photoFile);
      } else if (galleryPhotoPath) {
        form.set('photo_url', galleryPhotoPath);
      }

      const response = await axios.post(`${process.env.REACT_APP_API}/api/members`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Show success animation then navigate
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/members/${response.data.id}`);
      }, 900);
    } catch (err) {
      console.error('Error creating member:', err);
      alert('Error creating member. Please try again.');
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const calculateAge = useCallback((birthDateString, deathDateString = null) => {
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
      return null;
    }
  }, []);

  const isMinor = () => {
    const age = calculateAge(formData.birth_date, formData.death_date);
    if (age === null) return false;
    return age < 18;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Parchment texture background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="registry-lines" x="0" y="0" width="100%" height="32" patternUnits="userSpaceOnUse">
              <line x1="0" y1="31" x2="100%" y2="31" stroke="var(--accent-gold, #D4AF37)" strokeWidth="0.5" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#registry-lines)" />
        </svg>
      </div>

      {/* Decorative corner accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-vine-200/15 to-transparent rounded-full blur-xl"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-vine-100/15 to-transparent rounded-full blur-xl"></div>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(249, 248, 243, 0.9)' }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: 'var(--vine-green, #2E5A2E)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontFamily: 'var(--font-header, "Playfair Display", serif)', color: 'var(--vine-dark, #2D4F1E)', fontSize: '1.2rem' }}>
                Member Added to Registry
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto p-6">

        {/* ── Ancestral Registry Header ── */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Decorative line */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-12" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.5))' }}></div>
              <FleurAccent className="w-4 h-4" style={{ color: 'var(--accent-gold, #D4AF37)' }} />
              <div className="h-px w-12" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.5))' }}></div>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-header, "Playfair Display", serif)',
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--vine-dark, #2D4F1E)',
              letterSpacing: '0.5px',
            }}>
              Ancestral Registry
            </h1>
            <p style={{
              fontFamily: 'var(--font-body, "Inter", sans-serif)',
              fontSize: '0.75rem',
              color: 'var(--vine-sage, #86A789)',
              marginTop: '4px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              Add a new family member to the vine
            </p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.3))' }}></div>
              <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.3))' }}></div>
            </div>
          </div>
        </div>

        {/* ── Registry Form ── */}
        <div className="rounded-xl p-6 md:p-8" style={{
          background: 'rgba(249, 248, 243, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          boxShadow: '0 4px 24px rgba(46, 90, 46, 0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
        }}>
          <form onSubmit={handleSubmit}>

            {/* ── Family Branch & Founder ── */}
            <div style={{ marginBottom: '32px' }}>
              <h3 className="registry-section-title">Family Branch</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="registry-label">Branch / Surname Line</label>
                  <select
                    name="last_name"
                    value={familyBranches.includes(formData.last_name) ? formData.last_name : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, last_name: e.target.value }));
                      }
                    }}
                    className="registry-select"
                  >
                    <option value="">Select or type below</option>
                    {familyBranches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="registry-label">Or Enter New Surname</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="New surname..."
                      required
                      className="registry-input"
                    />
                  </div>
                </div>
              </div>

              {/* Founder Toggle */}
              <div className="flex items-center gap-3 mt-5" style={{
                padding: '10px 14px',
                background: isFounder ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                borderRadius: '8px',
                border: isFounder ? '1px solid rgba(212, 175, 55, 0.25)' : '1px solid transparent',
                transition: 'all 0.3s ease',
              }}>
                <button
                  type="button"
                  onClick={() => setIsFounder(!isFounder)}
                  className={`founder-toggle ${isFounder ? 'active' : ''}`}
                >
                  <div className="toggle-knob"></div>
                </button>
                <div className="flex items-center gap-2">
                  <FleurAccent className="w-3.5 h-3.5" style={{ color: isFounder ? 'var(--accent-gold, #D4AF37)' : 'var(--vine-sage, #86A789)' }} />
                  <span style={{
                    fontFamily: 'var(--font-header, "Playfair Display", serif)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: isFounder ? 'var(--vine-dark, #2D4F1E)' : 'var(--vine-sage, #86A789)',
                    transition: 'color 0.3s ease',
                  }}>
                    Family Founder
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--vine-sage, #86A789)' }}>
                    — Marks this member as a branch patriarch/matriarch
                  </span>
                </div>
              </div>
            </div>

            {/* Gold divider */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.3) 50%, rgba(212,175,55,0) 100%)',
              margin: '8px 0 32px',
            }} />

            {/* ── Personal Details ── */}
            <div style={{ marginBottom: '32px' }}>
              <h3 className="registry-section-title">Personal Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="registry-label">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="registry-input"
                  />
                </div>
                <div>
                  <label className="registry-label">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    className="registry-input"
                  />
                </div>
                <div>
                  <label className="registry-label">Nickname</label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder='"Big Daddy"'
                    maxLength={100}
                    className="registry-input"
                  />
                </div>
                <div>
                  <label className="registry-label">Suffix</label>
                  <select
                    name="suffix"
                    value={formData.suffix}
                    onChange={handleChange}
                    className="registry-select"
                  >
                    <option value="">None</option>
                    <option value="Jr.">Jr.</option>
                    <option value="Sr.">Sr.</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="registry-label">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="registry-select"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="registry-label">Birth Date</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="registry-input"
                    style={{ fontFamily: 'var(--font-body, "Inter", sans-serif)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="registry-label">Birth Place</label>
                  <input
                    type="text"
                    name="birth_place"
                    value={formData.birth_place}
                    onChange={handleChange}
                    className="registry-input"
                  />
                </div>
                <div>
                  <label className="registry-label">Current Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State"
                    className="registry-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                <div>
                  <label className="registry-label">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    className="registry-input"
                  />
                </div>
                <div>
                  <label className="registry-label">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="504-236-7578"
                    className="registry-input"
                  />
                </div>
                <div>
                  <label className="registry-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="registry-input"
                  />
                </div>
              </div>
            </div>

            {/* ── Living Status ── */}
            <div style={{ marginBottom: '32px' }}>
              <h3 className="registry-section-title">Status</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="registry-label">Living?</label>
                  <select
                    name="is_alive"
                    value={formData.is_alive}
                    onChange={handleChange}
                    className="registry-select"
                  >
                    <option value="true">Yes — Living</option>
                    <option value="false">No — Deceased</option>
                  </select>
                </div>
              </div>

              {formData.is_alive === 'false' && (
                <div className="mt-4 p-4 rounded-lg" style={{
                  background: 'rgba(139, 46, 46, 0.04)',
                  border: '1px solid rgba(139, 46, 46, 0.15)',
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="registry-label">Date of Passing</label>
                      <input
                        type="date"
                        name="death_date"
                        value={formData.death_date || ''}
                        onChange={handleChange}
                        className="registry-input"
                        style={{ fontFamily: 'var(--font-body, "Inter", sans-serif)', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label className="registry-label">Place of Passing</label>
                      <input
                        type="text"
                        name="death_place"
                        value={formData.death_place || ''}
                        onChange={handleChange}
                        className="registry-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Marriage Information (hidden for minors) ── */}
            {!isMinor() && (
              <div style={{ marginBottom: '32px' }}>
                <h3 className="registry-section-title">Union</h3>

                <div>
                  <label className="registry-label">Married?</label>
                  <select
                    name="is_married"
                    value={formData.is_married}
                    onChange={handleChange}
                    className="registry-select"
                    style={{ maxWidth: '280px' }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {formData.is_married === 'true' && (
                  <div className="mt-4 p-4 rounded-lg" style={{
                    background: 'rgba(46, 90, 46, 0.04)',
                    border: '1px solid rgba(46, 90, 46, 0.15)',
                  }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="registry-label">Marriage Date</label>
                        <input
                          type="date"
                          name="marriage_date"
                          value={formData.marriage_date || ''}
                          onChange={handleChange}
                          className="registry-input"
                          style={{ fontFamily: 'var(--font-body, "Inter", sans-serif)', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label className="registry-label">Spouse</label>
                        {loadingMembers ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--vine-sage)' }}>Loading...</div>
                        ) : (
                          <select
                            name="spouse_id"
                            value={formData.spouse_id || ''}
                            onChange={handleChange}
                            className="registry-select"
                          >
                            <option value="">Select Spouse</option>
                            {familyMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.first_name} {member.last_name}{member.suffix ? ` ${member.suffix}` : ''}
                                {member.birth_date && ` (b. ${new Date(member.birth_date).getFullYear()})`}
                              </option>
                            ))}
                          </select>
                        )}
                        <p style={{ fontSize: '0.65rem', color: 'var(--vine-sage, #86A789)', marginTop: '4px' }}>
                          Select from existing members, or add spouse first
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Portrait ── */}
            <div style={{ marginBottom: '32px' }}>
              <h3 className="registry-section-title">Portrait</h3>

              <div className="flex items-center gap-4">
                {/* Photo preview circle */}
                <div className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden" style={{
                  border: '2px solid rgba(212, 175, 55, 0.3)',
                  background: previewUrl ? 'transparent' : 'rgba(134, 167, 137, 0.08)',
                }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8" style={{ color: 'rgba(134, 167, 137, 0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Compact action buttons */}
                <div className="flex flex-col gap-2">
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*,.heic,.heif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('photo-upload').click()}
                    className="compact-archival-btn"
                  >
                    Upload & Crop
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGalleryPicker(true)}
                    className="compact-archival-btn secondary"
                  >
                    From Gallery
                  </button>
                </div>

                {galleryPhotoPath && (
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--vine-green, #2E5A2E)', fontSize: '0.7rem' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Gallery photo selected
                  </div>
                )}
              </div>
            </div>

            {/* Gold divider before actions */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.3) 50%, rgba(212,175,55,0) 100%)',
              margin: '8px 0 24px',
            }} />

            {/* ── Action Buttons ── */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="compact-archival-btn"
                style={{ padding: '10px 28px', fontSize: '0.85rem' }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                    </svg>
                    Registering...
                  </span>
                ) : (
                  'Add to Registry'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/members')}
                className="compact-archival-btn secondary"
                style={{ padding: '10px 28px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Photo Cropper Modal */}
      {showCropper && selectedImageFile && (
        <PhotoCropper
          imageFile={selectedImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Gallery Picker Modal */}
      {showGalleryPicker && (
        <PhotoGalleryPicker
          onPhotoSelect={handleGalleryPhotoSelect}
          onCancel={handleGalleryCancel}
        />
      )}
    </div>
  );
};

export default AddMember;
