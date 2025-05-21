import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const HierarchicalFamilyTree = () => {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.REACT_APP_API || 'http://192.168.1.120:5000';
      
      const [membersResponse, relationshipsResponse] = await Promise.all([
        axios.get(`${API_BASE}/api/members`),
        axios.get(`${API_BASE}/api/relationships`)
      ]);

      const membersData = membersResponse.data;
      const relationshipsData = relationshipsResponse.data;
      
      setMembers(membersData);
      setRelationships(relationshipsData);
      
      // Build hierarchical tree
      const tree = buildHierarchicalTree(membersData, relationshipsData);
      setTreeData(tree);
    } catch (error) {
      console.error('Error fetching family data:', error);
      setError('Failed to load family data');
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchicalTree = (members, relationships) => {
    // Create maps for all relationship types
    const parentChildMap = {};
    const childParentMap = {};
    const spouseMap = {};
    const siblingMap = {};
    const allRelationships = [];
    
    relationships.forEach(rel => {
      // Store all relationships for drawing lines later
      allRelationships.push(rel);
      
      if (rel.relationship_type === 'father' || rel.relationship_type === 'mother') {
        // Parent to child
        if (!parentChildMap[rel.member1_id]) {
          parentChildMap[rel.member1_id] = [];
        }
        parentChildMap[rel.member1_id].push(rel.member2_id);
        childParentMap[rel.member2_id] = rel.member1_id;
      } else if (rel.relationship_type === 'son' || rel.relationship_type === 'daughter') {
        // Child to parent (reverse)
        if (!parentChildMap[rel.member2_id]) {
          parentChildMap[rel.member2_id] = [];
        }
        parentChildMap[rel.member2_id].push(rel.member1_id);
        childParentMap[rel.member1_id] = rel.member2_id;
      } else if (rel.relationship_type === 'husband' || rel.relationship_type === 'wife' || rel.relationship_type === 'spouse') {
        spouseMap[rel.member1_id] = rel.member2_id;
        spouseMap[rel.member2_id] = rel.member1_id;
      } else if (rel.relationship_type === 'brother' || rel.relationship_type === 'sister') {
        if (!siblingMap[rel.member1_id]) siblingMap[rel.member1_id] = [];
        if (!siblingMap[rel.member2_id]) siblingMap[rel.member2_id] = [];
        siblingMap[rel.member1_id].push(rel.member2_id);
        siblingMap[rel.member2_id].push(rel.member1_id);
      }
    });

    // Find root members (those with no parents)
    const rootMembers = members.filter(member => !childParentMap[member.id]);

    // Build generations with positioning
    const generations = [];
    const visited = new Set();
    const memberPositions = {}; // Store x, y coordinates for each member
    
    // Group siblings together
    const siblingGroups = new Map();
    members.forEach(member => {
      const parent = childParentMap[member.id];
      if (parent) {
        if (!siblingGroups.has(parent)) {
          siblingGroups.set(parent, []);
        }
        siblingGroups.get(parent).push(member);
      }
    });

    // Start with root members
    if (rootMembers.length > 0) {
      const rootGeneration = rootMembers.map((member, index) => ({
        ...member,
        spouse: spouseMap[member.id] ? members.find(m => m.id === spouseMap[member.id]) : null,
        x: index * 2, // Space out root members
        generation: 0
      }));
      
      generations.push(rootGeneration);
      rootGeneration.forEach((member, index) => {
        visited.add(member.id);
        memberPositions[member.id] = { x: index * 2, generation: 0 };
      });
    }

    // Build subsequent generations
    let currentGeneration = rootMembers;
    let genIndex = 1;
    
    while (currentGeneration.length > 0) {
      const nextGeneration = [];
      let xPosition = 0;
      
      currentGeneration.forEach(parent => {
        const children = siblingGroups.get(parent.id) || [];
        
        // Add all children of this parent as siblings
        children.forEach((child, childIndex) => {
          if (!visited.has(child.id)) {
            const memberWithPosition = {
              ...child,
              spouse: spouseMap[child.id] ? members.find(m => m.id === spouseMap[child.id]) : null,
              x: xPosition + childIndex,
              generation: genIndex,
              parentId: parent.id
            };
            nextGeneration.push(memberWithPosition);
            memberPositions[child.id] = { 
              x: xPosition + childIndex, 
              generation: genIndex, 
              parentId: parent.id 
            };
            visited.add(child.id);
          }
        });
        
        xPosition += Math.max(children.length, 1) + 1; // Add spacing between family groups
      });
      
      if (nextGeneration.length > 0) {
        generations.push(nextGeneration);
        currentGeneration = nextGeneration;
        genIndex++;
      } else {
        break;
      }
    }

    return { generations, memberPositions, allRelationships };
  };

  // Get connection line color based on relationship type
  const getConnectionColor = (relationshipType) => {
    const colors = {
      'father': '#3b82f6',    // Blue
      'mother': '#ec4899',    // Pink
      'son': '#3b82f6',       // Blue
      'daughter': '#ec4899',  // Pink
      'husband': '#8b5cf6',   // Purple
      'wife': '#8b5cf6',      // Purple
      'spouse': '#8b5cf6',    // Purple
      'brother': '#10b981',   // Green
      'sister': '#10b981',    // Green
      'uncle': '#f59e0b',     // Amber
      'aunt': '#f59e0b',      // Amber
      'nephew': '#f59e0b',    // Amber
      'niece': '#f59e0b',     // Amber
      'cousin': '#6b7280',    // Gray
      'grandfather': '#374151', // Dark Gray
      'grandmother': '#374151', // Dark Gray
      'grandson': '#374151',    // Dark Gray
      'granddaughter': '#374151' // Dark Gray
    };
    return colors[relationshipType] || '#6b7280';
  };

  // Draw all types of connections
  const drawConnections = () => {
    if (!treeData.memberPositions || treeData.generations.length === 0) return null;

    const connections = [];
    const cardWidth = 192; // w-48 = 192px
    const cardHeight = 200; // Approximate card height
    const gapX = 32; // gap-8 = 32px
    const gapY = 64; // gap between generations

    // Draw all relationships
    treeData.allRelationships.forEach((rel, index) => {
      const member1Pos = treeData.memberPositions[rel.member1_id];
      const member2Pos = treeData.memberPositions[rel.member2_id];
      
      if (member1Pos && member2Pos) {
        const x1 = member1Pos.x * (cardWidth + gapX) + cardWidth / 2;
        const y1 = (member1Pos.generation * (cardHeight + gapY)) + cardHeight / 2;
        
        const x2 = member2Pos.x * (cardWidth + gapX) + cardWidth / 2;
        const y2 = (member2Pos.generation * (cardHeight + gapY)) + cardHeight / 2;
        
        const color = getConnectionColor(rel.relationship_type);
        const strokeWidth = rel.relationship_type.includes('parent') || 
                           rel.relationship_type.includes('child') ? '3' : '2';

        // Different line styles for different relationships
        if (rel.relationship_type === 'husband' || rel.relationship_type === 'wife' || rel.relationship_type === 'spouse') {
          // Straight line for spouses (same generation)
          connections.push(
            <line
              key={`spouse-${index}-${rel.member1_id}-${rel.member2_id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray="5,5"
            />
          );
        } else if (rel.relationship_type === 'brother' || rel.relationship_type === 'sister') {
          // Curved line for siblings
          const midX = (x1 + x2) / 2;
          const midY = Math.min(y1, y2) - 20;
          connections.push(
            <path
              key={`sibling-${index}-${rel.member1_id}-${rel.member2_id}`}
              d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray="3,3"
            />
          );
        } else if (member1Pos.generation !== member2Pos.generation) {
          // Parent-child relationship (different generations)
          const midY = y1 + (y2 - y1) / 2;
          connections.push(
            <g key={`parent-child-${index}-${rel.member1_id}-${rel.member2_id}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x1}
                y2={midY}
                stroke={color}
                strokeWidth={strokeWidth}
              />
              <line
                x1={x1}
                y1={midY}
                x2={x2}
                y2={midY}
                stroke={color}
                strokeWidth={strokeWidth}
              />
              <line
                x1={x2}
                y1={midY}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={strokeWidth}
              />
            </g>
          );
        } else {
          // Other relationships (same generation)
          connections.push(
            <line
              key={`other-${index}-${rel.member1_id}-${rel.member2_id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="1"
              opacity="0.6"
            />
          );
        }
      }
    });

    return connections;
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getFullYear();
  };

  const getPhotoUrl = (member) => {
    if (!member || !member.photo_url) {
      return null;
    }
    
    if (member.photo_url.startsWith('http')) {
      return member.photo_url;
    }
    
    const cleanPath = member.photo_url.startsWith('/') 
      ? member.photo_url.substring(1) 
      : member.photo_url;
    
    return `${process.env.REACT_APP_API}/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading family tree...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600 text-center">
          <div>{error}</div>
          <button 
            onClick={fetchFamilyData}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const maxWidth = Math.max(...treeData.generations.map(gen => gen.length)) * 224;
  const totalHeight = treeData.generations.length * 264;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Control Panel */}
      <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleZoomIn}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm"
          >
            Zoom In (+)
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm"
          >
            Zoom Out (-)
          </button>
          <button
            onClick={handleResetZoom}
            className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm"
          >
            Reset
          </button>
          <div className="text-xs text-gray-600 text-center mt-2">
            Zoom: {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-gray-800">Family Tree</h1>
        <p className="text-gray-600 mt-2">
          {members.length} family members across {treeData.generations.length} generations
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Click and drag to pan • Use zoom controls to explore
        </p>
      </div>

      {/* Tree Container */}
      <div
        ref={containerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing h-screen"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            width: maxWidth + 200,
            height: totalHeight + 200,
            transformOrigin: 'center center'
          }}
        >
          {/* SVG for connection lines */}
          <svg
            ref={svgRef}
            className="absolute top-0 left-0 pointer-events-none"
            width={maxWidth + 200}
            height={totalHeight + 200}
          >
            {drawConnections()}
          </svg>

          {/* Family member cards */}
          <div className="relative">
            {treeData.generations.map((generation, genIndex) => (
              <div
                key={genIndex}
                className="absolute flex"
                style={{
                  top: genIndex * 264 + 100,
                  left: 100
                }}
              >
                {generation.map((member, memberIndex) => (
                  <div
                    key={member.id}
                    className="relative"
                    style={{
                      left: member.x * 224
                    }}
                  >
                    {/* Member Card */}
                    <div className="bg-white rounded-lg shadow-lg p-4 w-48 border-2 border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="text-center">
                        {/* Photo */}
                        <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-gray-300">
                          {getPhotoUrl(member) ? (
                            <img
                              src={getPhotoUrl(member)}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <h3 className="font-bold text-sm text-gray-800 mb-1">
                          {member.first_name} {member.last_name}
                        </h3>

                        {/* Life Dates */}
                        <div className="text-xs text-gray-600">
                          {member.birth_date && (
                            <div>{formatDate(member.birth_date)} - {member.death_date ? formatDate(member.death_date) : 'Present'}</div>
                          )}
                          {member.location && (
                            <div className="mt-1 text-blue-600">{member.location}</div>
                          )}
                        </div>

                        {/* View Profile Link */}
                        <a
                          href={`/members/${member.id}`}
                          className="inline-block mt-2 text-xs text-blue-500 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Profile
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
        <h3 className="text-sm font-semibold mb-3">Relationship Colors</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
            <span>Father/Son</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-pink-500 mr-2"></div>
            <span>Mother/Daughter</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-purple-500 mr-2" style={{strokeDasharray: "5,5"}}></div>
            <span>Spouse (dashed)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-green-500 mr-2" style={{strokeDasharray: "3,3"}}></div>
            <span>Siblings (curved)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-amber-500 mr-2"></div>
            <span>Uncle/Aunt/Nephew/Niece</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-gray-600 mr-2"></div>
            <span>Grandparents/Cousins</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalFamilyTree;