import React, { useState, useEffect } from 'react';

const GenerationManager = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const API_BASE = window.location.hostname === 'family.techwoods.cc' 
        ? 'https://family.techwoods.cc'
        : 'http://192.168.1.120:5000';
      
      const response = await fetch(`${API_BASE}/api/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.sort((a, b) => (a.generation || 0) - (b.generation || 0)));
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGeneration = async (memberId, newGeneration) => {
    try {
      setSaving(true);
      const API_BASE = window.location.hostname === 'family.techwoods.cc' 
        ? 'https://family.techwoods.cc'
        : 'http://192.168.1.120:5000';
      
      const response = await fetch(`${API_BASE}/api/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation: newGeneration })
      });
      
      if (response.ok) {
        setMembers(prev => 
          prev.map(member => 
            member.id === memberId 
              ? { ...member, generation: newGeneration }
              : member
          ).sort((a, b) => (a.generation || 0) - (b.generation || 0))
        );
        setMessage(`✅ Updated ${members.find(m => m.id === memberId)?.first_name}'s generation`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage(`❌ Failed to update generation: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const generationCounts = members.reduce((acc, member) => {
    const gen = member.generation || 0;
    acc[gen] = (acc[gen] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading generation manager...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🧬 Family Generation Manager
      </h1>
      
      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* Generation Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        {Object.entries(generationCounts).map(([gen, count]) => (
          <div key={gen} style={{
            padding: '15px',
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#495057' }}>
              Generation {gen}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', marginTop: '5px' }}>
              {count}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              {count === 1 ? 'member' : 'members'}
            </div>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 150px 100px',
          gap: '15px',
          padding: '15px',
          background: '#f8f9fa',
          fontWeight: 'bold',
          borderBottom: '2px solid #e9ecef'
        }}>
          <div>Name</div>
          <div>Birth Year</div>
          <div>Current Generation</div>
          <div>Actions</div>
        </div>
        
        {members.map(member => (
          <div key={member.id} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 150px 100px',
            gap: '15px',
            padding: '15px',
            borderBottom: '1px solid #e9ecef',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: '500' }}>
              {member.first_name} {member.last_name}
            </div>
            <div style={{ color: '#6c757d' }}>
              {member.birth_date ? new Date(member.birth_date).getFullYear() : 'Unknown'}
            </div>
            <div>
              <select
                value={member.generation || 0}
                onChange={(e) => updateGeneration(member.id, parseInt(e.target.value))}
                disabled={saving}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  background: 'white',
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                <option value={0}>Unassigned</option>
                <option value={1}>Generation 1</option>
                <option value={2}>Generation 2</option>
                <option value={3}>Generation 3</option>
                <option value={4}>Generation 4</option>
                <option value={5}>Generation 5</option>
                <option value={6}>Generation 6</option>
              </select>
            </div>
            <div>
              {saving ? (
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Saving...</div>
              ) : (
                <span style={{ 
                  fontSize: '20px', 
                  color: member.generation ? '#28a745' : '#ffc107' 
                }}>
                  {member.generation ? '✅' : '⚠️'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#e7f3ff', 
        border: '1px solid #b8daff',
        borderRadius: '10px'
      }}>
        <h3 style={{ marginTop: 0, color: '#004085' }}>💡 Generation Guidelines</h3>
        <ul style={{ color: '#004085', lineHeight: '1.6' }}>
          <li><strong>Generation 1:</strong> Root ancestors (Percy Manning Sr., Alice Manning)</li>
          <li><strong>Generation 2:</strong> Their children (Ruth, Alonzo, Hazel, etc.)</li>
          <li><strong>Generation 3:</strong> Grandchildren (Debra, Frank Jr., Steven, etc.)</li>
          <li><strong>Generation 4:</strong> Great-grandchildren (Justin, Shanna, Priya, etc.)</li>
          <li><strong>Generation 5:</strong> Great-great-grandchildren (Asha, Manning, etc.)</li>
        </ul>
        <p style={{ margin: '15px 0 0 0', fontStyle: 'italic', color: '#004085' }}>
          Changes are saved automatically and will update all family tree views immediately.
        </p>
      </div>
    </div>
  );
};

export default GenerationManager;