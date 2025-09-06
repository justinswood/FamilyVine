import React, { useEffect, useState } from 'react';

const VisualFamilyTree = () => {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyTree, setFamilyTree] = useState(null);

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
      
      // Use the SAME domain for API calls - Cloudflare tunnel handles routing
      const API_BASE = window.location.hostname === 'family.techwoods.cc' 
        ? 'https://family.techwoods.cc'  // Same domain, Cloudflare routes /api/* to port 5000
        : 'http://192.168.1.120:5000';   // Direct connection for local access
      
      console.log('=== CLOUDFLARE TUNNEL API Configuration ===');
      console.log('Window hostname:', window.location.hostname);
      console.log('Using API_BASE:', API_BASE);
      console.log('==========================================');
      
      try {
        console.log('Attempting to fetch from:', `${API_BASE}/api/members`);
        
        const [membersResponse, relationshipsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/members`),
          fetch(`${API_BASE}/api/relationships`)
        ]);

        console.log('Response status:', membersResponse.status, relationshipsResponse.status);

        if (membersResponse.ok && relationshipsResponse.ok) {
          const membersData = await membersResponse.json();
          const relationshipsData = await relationshipsResponse.json();
          
          console.log('✅ Successfully loaded from API:', { 
            members: membersData.length, 
            relationships: relationshipsData.length 
          });
          
          // Add birth_year extraction from birth_date for compatibility
          const processedMembers = membersData.map(member => ({
            ...member,
            birth_year: member.birth_date ? new Date(member.birth_date).getFullYear() : null,
            generation: member.generation || 0 // Use database generation
          }));
          
          setMembers(Array.isArray(processedMembers) ? processedMembers : []);
          setRelationships(Array.isArray(relationshipsData) ? relationshipsData : []);
          return;
        } else {
          console.log('❌ API responded with error:', membersResponse.status, relationshipsResponse.status);
        }
      } catch (apiError) {
        console.log('❌ API connection failed:', apiError.message);
        console.log('Full error:', apiError);
      }

      // Fall back to basic data if API fails
      console.log('Using reduced dataset for development');
      setMembers([]);
      setRelationships([]);
      
    } catch (error) {
      console.error('Error fetching family data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const buildFullFamilyTree = () => {
    console.log('Building full dynamic family tree...');
    
    // Build relationship maps
    const spouseMap = new Map();
    const parentToChildren = new Map();
    const childToParents = new Map();
    
    relationships.forEach(rel => {
      if (rel.relationship_type === 'husband' || rel.relationship_type === 'wife') {
        spouseMap.set(rel.member1_id, rel.member2_id);
      } else if (rel.relationship_type === 'father' || rel.relationship_type === 'mother') {
        // Parent -> children
        if (!parentToChildren.has(rel.member1_id)) {
          parentToChildren.set(rel.member1_id, []);
        }
        parentToChildren.get(rel.member1_id).push(rel.member2_id);
        
        // Child -> parents
        if (!childToParents.has(rel.member2_id)) {
          childToParents.set(rel.member2_id, []);
        }
        childToParents.get(rel.member2_id).push(rel.member1_id);
      }
    });

    // Find root generation (people with no parents)
    const rootMemberIds = members
      .filter(member => !childToParents.has(member.id))
      .map(member => member.id);
    
    console.log('Root members:', rootMemberIds.map(id => {
      const m = members.find(mem => mem.id === id);
      return `${m.first_name} ${m.last_name}`;
    }));

    // Build generations
    const generations = [];
    let currentGenIds = rootMemberIds;
    let processedIds = new Set();
    let genIndex = 0;

    while (currentGenIds.length > 0 && genIndex < 6) {
      console.log(`\n=== Generation ${genIndex} ===`);
      
      // Create family units for this generation
      const familyUnits = createFamilyUnits(currentGenIds, spouseMap, processedIds);
      generations.push(familyUnits);
      
      // Mark all as processed
      familyUnits.forEach(unit => {
        unit.members.forEach(member => processedIds.add(member.id));
      });

      // Find next generation
      const nextGenIds = [];
      familyUnits.forEach(unit => {
        unit.members.forEach(parent => {
          const children = parentToChildren.get(parent.id) || [];
          children.forEach(childId => {
            if (!processedIds.has(childId) && !nextGenIds.includes(childId)) {
              nextGenIds.push(childId);
            }
          });
        });
      });

      currentGenIds = nextGenIds;
      genIndex++;
    }

    // Calculate layout
    const layout = calculateLayout(generations, parentToChildren, childToParents);
    setFamilyTree(layout);
    
    console.log('Built family tree with', generations.length, 'generations');
  };

  const createFamilyUnits = (memberIds, spouseMap, processedIds) => {
    const units = [];
    const processed = new Set();
    
    memberIds.forEach(memberId => {
      if (processed.has(memberId)) return;
      
      const member = members.find(m => m.id === memberId);
      if (!member) return;
      
      const spouseId = spouseMap.get(memberId);
      const spouse = spouseId ? members.find(m => m.id === spouseId) : null;
      
      if (spouse && memberIds.includes(spouseId) && !processed.has(spouseId)) {
        // Couple unit
        console.log(`Creating couple: ${member.first_name} & ${spouse.first_name}`);
        units.push({
          type: 'couple',
          members: [member, spouse],
          id: `couple-${member.id}-${spouse.id}`
        });
        processed.add(memberId);
        processed.add(spouseId);
      } else {
        // Single unit
        console.log(`Creating single: ${member.first_name}`);
        units.push({
          type: 'single',
          members: [member],
          id: `single-${member.id}`
        });
        processed.add(memberId);
      }
    });
    
    return units;
  };

  const calculateLayout = (generations, parentToChildren, childToParents) => {
    const PERSON_WIDTH = 140;
    const PERSON_HEIGHT = 180;
    const COUPLE_GAP = 20;
    const UNIT_GAP = 60;
    const GENERATION_GAP = 120;
    const CONTAINER_WIDTH = 1200;
    
    const layoutData = {
      generations: [],
      connections: [],
      containerWidth: CONTAINER_WIDTH,
      containerHeight: generations.length * (PERSON_HEIGHT + GENERATION_GAP) + 200
    };

    // Position each generation
    generations.forEach((units, genIndex) => {
      console.log(`\n--- Positioning Generation ${genIndex} ---`);
      
      // Calculate total width needed
      let totalWidth = 0;
      units.forEach(unit => {
        if (unit.type === 'couple') {
          totalWidth += (PERSON_WIDTH * 2) + COUPLE_GAP + UNIT_GAP;
        } else {
          totalWidth += PERSON_WIDTH + UNIT_GAP;
        }
      });
      totalWidth -= UNIT_GAP; // Remove last gap
      
      // Center the generation
      let startX = (CONTAINER_WIDTH - totalWidth) / 2;
      const y = genIndex * (PERSON_HEIGHT + GENERATION_GAP) + 50;
      
      const positionedUnits = [];
      let currentX = startX;
      
      units.forEach((unit, unitIndex) => {
        if (unit.type === 'couple') {
          const person1X = currentX;
          const person2X = currentX + PERSON_WIDTH + COUPLE_GAP;
          const centerX = currentX + PERSON_WIDTH + (COUPLE_GAP / 2);
          
          console.log(`Couple: ${unit.members[0].first_name} & ${unit.members[1].first_name} at x=${centerX}`);
          
          positionedUnits.push({
            ...unit,
            centerX: centerX,
            y: y,
            person1: { ...unit.members[0], x: person1X, y: y },
            person2: { ...unit.members[1], x: person2X, y: y }
          });
          
          currentX += (PERSON_WIDTH * 2) + COUPLE_GAP + UNIT_GAP;
        } else {
          const centerX = currentX + (PERSON_WIDTH / 2);
          
          console.log(`Single: ${unit.members[0].first_name} at x=${centerX}`);
          
          positionedUnits.push({
            ...unit,
            centerX: centerX,
            y: y,
            person1: { ...unit.members[0], x: currentX, y: y }
          });
          
          currentX += PERSON_WIDTH + UNIT_GAP;
        }
      });
      
      layoutData.generations.push(positionedUnits);
    });

    // Calculate connections
    for (let genIndex = 0; genIndex < layoutData.generations.length - 1; genIndex++) {
      const currentGen = layoutData.generations[genIndex];
      const nextGen = layoutData.generations[genIndex + 1];

      nextGen.forEach(childUnit => {
        childUnit.members.forEach(child => {
          const parentIds = childToParents.get(child.id) || [];
          
          currentGen.forEach(parentUnit => {
            const parentUnitIds = parentUnit.members.map(m => m.id);
            const hasConnection = parentIds.some(parentId => parentUnitIds.includes(parentId));
            
            if (hasConnection) {
              layoutData.connections.push({
                from: { 
                  x: parentUnit.centerX, 
                  y: parentUnit.y + PERSON_HEIGHT 
                },
                to: { 
                  x: childUnit.centerX, 
                  y: childUnit.y 
                },
                type: 'parent-child'
              });
            }
          });
        });
      });
    }

    return layoutData;
  };

  const renderPersonBox = (person, x, y) => {
    if (!person) return null;
    
    const API_BASE = process.env.REACT_APP_API || 'http://192.168.1.120:5000';
    
    return (
      <div 
        key={person.id}
        style={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: '140px',
          height: '180px',
          border: '2px solid #007bff',
          borderRadius: '12px',
          background: 'white',
          padding: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          zIndex: 10
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        <div style={{ 
          width: '100px', 
          height: '100px', 
          margin: '0 auto 12px', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          background: person.gender === 'Male' ? '#e3f2fd' : '#fce4ec',
          border: `3px solid ${person.gender === 'Male' ? '#2196f3' : '#e91e63'}`
        }}>
          {person.photo_url ? (
            <img 
              src={`${API_BASE}/${person.photo_url}`} 
              alt={person.first_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
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
          )}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', lineHeight: '1.2' }}>
          {person.first_name}<br/>{person.last_name}
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
          {person.birth_year || 'Unknown'} - {person.is_alive ? 'Present' : (person.death_year || '?')}
        </div>
        <div style={{ 
          fontSize: '10px', 
          fontWeight: 'bold',
          color: person.is_alive ? '#4caf50' : '#757575',
          textTransform: 'uppercase'
        }}>
          {person.is_alive ? 'ALIVE' : 'DECEASED'}
        </div>
      </div>
    );
  };
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>Loading family tree...</div>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        <h3>Error Loading Family Tree</h3>
        <p>{error}</p>
        <button 
          onClick={fetchFamilyData}
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!familyTree || !familyTree.generations.length) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Building family tree...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>
        Manning Family Tree
      </h1>
      
      <div style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
        <p>Showing {familyTree.generations.length} generations with {members.length} family members</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '4px', background: '#8b5cf6' }}></div>
            <span style={{ fontSize: '14px' }}>Spouse Connection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '3px', background: '#4a90e2' }}></div>
            <span style={{ fontSize: '14px' }}>Parent-Child Connection</span>
          </div>
        </div>
      </div>
      
      <div style={{ 
        position: 'relative', 
        width: `${familyTree.containerWidth}px`, 
        height: `${familyTree.containerHeight}px`, 
        margin: '0 auto', 
        background: 'white', 
        border: '2px solid #ddd',
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        
        {/* SVG for all connection lines */}
        <svg style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {/* Parent-child connections */}
          {familyTree.connections.map((connection, index) => (
            <g key={`connection-${index}`}>
              {/* Vertical line down from parent */}
              <line
                x1={connection.from.x}
                y1={connection.from.y}
                x2={connection.from.x}
                y2={connection.from.y + 60}
                stroke="#4a90e2"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Horizontal line across */}
              <line
                x1={connection.from.x}
                y1={connection.from.y + 60}
                x2={connection.to.x}
                y2={connection.from.y + 60}
                stroke="#4a90e2"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Vertical line down to child */}
              <line
                x1={connection.to.x}
                y1={connection.from.y + 60}
                x2={connection.to.x}
                y2={connection.to.y}
                stroke="#4a90e2"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          ))}
          
          {/* Spouse connection lines */}
          {familyTree.generations.map((generation, genIndex) =>
            generation.map((unit, unitIndex) => {
              if (unit.type === 'couple' && unit.person1 && unit.person2) {
                const leftEdge = unit.person1.x + 140; // Right edge of left person
                const rightEdge = unit.person2.x;      // Left edge of right person
                const yPos = unit.person1.y + 90;      // Middle of persons
                
                return (
                  <line
                    key={`spouse-${genIndex}-${unitIndex}`}
                    x1={leftEdge}
                    y1={yPos}
                    x2={rightEdge}
                    y2={yPos}
                    stroke="#8b5cf6"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                );
              }
              return null;
            })
          )}
        </svg>

        {/* Render all member boxes */}
        {familyTree.generations.map((generation, genIndex) =>
          generation.map((unit, unitIndex) => (
            <div key={`gen-${genIndex}-unit-${unitIndex}`}>
              {unit.person1 && renderPersonBox(unit.person1, unit.person1.x, unit.person1.y)}
              {unit.person2 && renderPersonBox(unit.person2, unit.person2.x, unit.person2.y)}
            </div>
          ))
        )}
        
        {/* Generation labels */}
        {familyTree.generations.map((generation, genIndex) => (
          <div
            key={`gen-label-${genIndex}`}
            style={{
              position: 'absolute',
              left: '20px',
              top: `${genIndex * 300 + 100}px`,
              background: 'rgba(0,123,255,0.1)',
              padding: '8px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#007bff',
              border: '2px solid #007bff'
            }}
          >
            Generation {genIndex + 1}
          </div>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>
        <button 
          onClick={fetchFamilyData}
          style={{ 
            padding: '12px 24px', 
            background: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Refresh Family Tree
        </button>
      </div>
    </div>
  );
};

export default VisualFamilyTree;