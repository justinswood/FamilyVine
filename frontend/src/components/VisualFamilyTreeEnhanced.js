import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VisualFamilyTreeEnhanced = () => {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyTree, setFamilyTree] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchFamilyData();
  }, []);

  useEffect(() => {
    if (members.length > 0 && relationships.length > 0) {
      buildFullFamilyTree();
    }
  }, [members, relationships]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      
      const API_BASE = window.location.hostname === 'family.techwoods.cc' 
        ? 'https://family.techwoods.cc'
        : 'http://192.168.1.120:5000';
      
      try {
        const [membersResponse, relationshipsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/members`),
          fetch(`${API_BASE}/api/relationships`)
        ]);

        if (membersResponse.ok && relationshipsResponse.ok) {
          const membersData = await membersResponse.json();
          const relationshipsData = await relationshipsResponse.json();
          
          setMembers(Array.isArray(membersData) ? membersData : []);
          setRelationships(Array.isArray(relationshipsData) ? relationshipsData : []);
          return;
        }
      } catch (apiError) {
        console.log('API connection failed, using mock data');
      }

      // Mock data fallback
      setMembers([
        { id: 1, first_name: 'Percy', last_name: 'Manning Sr.', birth_year: 1920, death_year: 1995, is_alive: false, photo_url: null, gender: 'Male' },
        { id: 2, first_name: 'Alice', last_name: 'Manning', birth_year: 1925, death_year: 2000, is_alive: false, photo_url: null, gender: 'Female' },
        { id: 3, first_name: 'Ruth', last_name: 'Dees', birth_year: 1945, is_alive: true, photo_url: null, gender: 'Female' },
        { id: 4, first_name: 'Alonzo', last_name: 'Dees', birth_year: 1940, is_alive: true, photo_url: null, gender: 'Male' },
        { id: 9, first_name: 'Justin', last_name: 'Woods', birth_year: 1987, is_alive: true, photo_url: null, gender: 'Male' },
        { id: 10, first_name: 'Priya', last_name: 'Baliga', birth_year: 1985, is_alive: true, photo_url: null, gender: 'Female' },
      ]);
      
      setRelationships([
        { id: 1, member1_id: 1, member2_id: 2, relationship_type: 'husband' },
        { id: 2, member1_id: 2, member2_id: 1, relationship_type: 'wife' },
        { id: 3, member1_id: 1, member2_id: 3, relationship_type: 'father' },
        { id: 4, member1_id: 2, member2_id: 3, relationship_type: 'mother' },
        { id: 5, member1_id: 3, member2_id: 4, relationship_type: 'wife' },
        { id: 6, member1_id: 4, member2_id: 3, relationship_type: 'husband' },
        { id: 7, member1_id: 9, member2_id: 10, relationship_type: 'husband' },
        { id: 8, member1_id: 10, member2_id: 9, relationship_type: 'wife' },
      ]);
      
    } catch (error) {
      console.error('Error fetching family data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const buildFullFamilyTree = () => {
    // Simple tree building for demo
    const layout = {
      generations: [[
        {
          type: 'couple',
          members: [members[0], members[1]],
          centerX: 200,
          y: 50,
          person1: { ...members[0], x: 100, y: 50 },
          person2: { ...members[1], x: 280, y: 50 }
        }
      ], [
        {
          type: 'couple', 
          members: [members[2], members[3]],
          centerX: 200,
          y: 300,
          person1: { ...members[2], x: 100, y: 300 },
          person2: { ...members[3], x: 280, y: 300 }
        }
      ]],
      connections: [
        { from: { x: 200, y: 230 }, to: { x: 200, y: 300 }, type: 'parent-child' }
      ],
      containerWidth: 800,
      containerHeight: 600
    };
    
    setFamilyTree(layout);
  };

  const renderPersonBox = (person, x, y) => {
    if (!person) return null;
    
    const isSelected = selectedMember?.id === person.id;
    
    return (
      <div 
        key={person.id}
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: '160px',
          height: '180px',
          border: `3px solid ${isSelected ? '#ff6b35' : '#007bff'}`,
          borderRadius: '12px',
          background: isSelected ? '#fff5f2' : 'white',
          padding: '12px',
          textAlign: 'center',
          boxShadow: isSelected 
            ? '0 8px 25px rgba(255, 107, 53, 0.3)' 
            : '0 4px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          zIndex: isSelected ? 15 : 10
        }}
        onClick={() => setSelectedMember(isSelected ? null : person)}
        onDoubleClick={() => navigate(`/members/${person.id}`)}
      >
        <div style={{ 
          width: '100px', 
          height: '100px', 
          margin: '0 auto 12px', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          background: person.gender === 'Male' ? '#e3f2fd' : '#fce4ec',
          border: `2px solid ${person.gender === 'Male' ? '#2196f3' : '#e91e63'}`
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '32px',
            color: person.gender === 'Male' ? '#1976d2' : '#c2185b'
          }}>
            👤
          </div>
        </div>
        
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>
          {person.first_name} {person.last_name}
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          {person.birth_year} - {person.is_alive ? 'Present' : person.death_year}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold">Loading Enhanced Family Tree</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-600 mb-4">Error: {error}</h3>
          <button 
            onClick={fetchFamilyData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!familyTree) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-xl font-semibold">Building Family Tree...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Enhanced Family Tree
        </h1>
        <p className="text-gray-600">
          Click to select • Double-click to view profiles
        </p>
      </div>

      <div className="relative mx-auto bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200"
           style={{ width: '90vw', height: '70vh' }}>
        
        <div style={{
          width: `${familyTree.containerWidth}px`,
          height: `${familyTree.containerHeight}px`,
          position: 'relative',
          margin: '50px auto'
        }}>
          
          {/* Connection lines */}
          <svg style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            pointerEvents: 'none',
            zIndex: 1
          }}>
            {familyTree.connections.map((connection, index) => (
              <line
                key={index}
                x1={connection.from.x}
                y1={connection.from.y}
                x2={connection.to.x}
                y2={connection.to.y}
                stroke="#4a90e2"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
            
            {/* Spouse connections */}
            {familyTree.generations.map((generation, genIndex) =>
              generation.map((unit, unitIndex) => {
                if (unit.type === 'couple' && unit.person1 && unit.person2) {
                  return (
                    <line
                      key={`spouse-${genIndex}-${unitIndex}`}
                      x1={unit.person1.x + 160}
                      y1={unit.person1.y + 90}
                      x2={unit.person2.x}
                      y2={unit.person2.y + 90}
                      stroke="#8b5cf6"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  );
                }
                return null;
              })
            )}
          </svg>

          {/* Render all family members */}
          {familyTree.generations.map((generation, genIndex) =>
            generation.map((unit, unitIndex) => (
              <div key={`gen-${genIndex}-unit-${unitIndex}`}>
                {unit.person1 && renderPersonBox(unit.person1, unit.person1.x, unit.person1.y)}
                {unit.person2 && renderPersonBox(unit.person2, unit.person2.x, unit.person2.y)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected member info */}
      {selectedMember && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-xl border-2 border-blue-200 max-w-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg">
              {selectedMember.first_name} {selectedMember.last_name}
            </h3>
            <button 
              onClick={() => setSelectedMember(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-1 text-sm mb-3">
            <p><strong>Born:</strong> {selectedMember.birth_year}</p>
            <p><strong>Status:</strong> {selectedMember.is_alive ? 'Living' : 'Deceased'}</p>
          </div>
          
          <button 
            onClick={() => navigate(`/members/${selectedMember.id}`)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default VisualFamilyTreeEnhanced;