import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const EnhancedFamilyTree = () => {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef();
  const containerRef = useRef();

  // Constants for layout
  const CARD_WIDTH = 180;
  const CARD_HEIGHT = 220;
  const HORIZONTAL_SPACING = 80;
  const VERTICAL_SPACING = 120;

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const [membersResponse, relationshipsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/members`),
        axios.get(`${process.env.REACT_APP_API}/api/relationships`)
      ]);
      
      setMembers(membersResponse.data);
      setRelationships(relationshipsResponse.data);
      buildEnhancedTree(membersResponse.data, relationshipsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildEnhancedTree = (members, relationships) => {
    // Find root ancestors (Percy Manning Sr. and Alice Manning)
    const percyManning = members.find(m => 
      m.first_name?.toLowerCase().includes('percy') && 
      m.last_name?.toLowerCase().includes('manning')
    );
    
    const aliceManning = members.find(m => 
      m.first_name?.toLowerCase().includes('alice') && 
      m.last_name?.toLowerCase().includes('manning')
    );

    // Build relationship maps
    const parentChildMap = {};
    const childParentMap = {};
    const spouseMap = {};
    const siblingMap = {};

    relationships.forEach(rel => {
      if (rel.relationship_type === 'father' || rel.relationship_type === 'mother') {
        if (!parentChildMap[rel.member1_id]) parentChildMap[rel.member1_id] = [];
        parentChildMap[rel.member1_id].push(rel.member2_id);
        childParentMap[rel.member2_id] = rel.member1_id;
      } else if (rel.relationship_type === 'son' || rel.relationship_type === 'daughter') {
        if (!parentChildMap[rel.member2_id]) parentChildMap[rel.member2_id] = [];
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

    // Build generations with enhanced positioning
    const generations = [];
    const visited = new Set();
    const memberPositions = {};

    // Start with root couple
    const rootGeneration = [];
    let xPosition = 0;

    if (percyManning) {
      rootGeneration.push({
        ...percyManning,
        x: xPosition,
        generation: 0,
        isSpouseGroup: false
      });
      memberPositions[percyManning.id] = { x: xPosition, generation: 0 };
      visited.add(percyManning.id);
      xPosition++;
    }

    if (aliceManning && aliceManning.id !== percyManning?.id) {
      rootGeneration.push({
        ...aliceManning,
        x: xPosition,
        generation: 0,
        isSpouseGroup: true,
        spouseOf: percyManning?.id
      });
      memberPositions[aliceManning.id] = { x: xPosition, generation: 0 };
      visited.add(aliceManning.id);
    }

    if (rootGeneration.length > 0) {
      generations.push(rootGeneration);
    }

    // Build subsequent generations
    let currentGeneration = rootGeneration;
    let genIndex = 1;
    
    while (currentGeneration.length > 0 && genIndex < 6) {
      const nextGeneration = [];
      xPosition = 0;
      
      // Group children by their parents to keep families together
      const familyGroups = new Map();
      
      currentGeneration.forEach(parent => {
        const children = parentChildMap[parent.id] || [];
        if (children.length > 0) {
          const parentKey = parent.spouseOf ? 
            Math.min(parent.id, parent.spouseOf) : parent.id;
          
          if (!familyGroups.has(parentKey)) {
            familyGroups.set(parentKey, new Set());
          }
          children.forEach(childId => familyGroups.get(parentKey).add(childId));
        }
      });

      // Add children from each family group
      familyGroups.forEach((childrenSet, parentKey) => {
        const childrenArray = Array.from(childrenSet);
        
        childrenArray.forEach((childId, childIndex) => {
          if (!visited.has(childId)) {
            const child = members.find(m => m.id === childId);
            if (child) {
              const memberWithPosition = {
                ...child,
                x: xPosition + childIndex,
                generation: genIndex,
                parentIds: [parentKey]
              };
              
              nextGeneration.push(memberWithPosition);
              memberPositions[childId] = { 
                x: xPosition + childIndex, 
                generation: genIndex,
                parentIds: [parentKey]
              };
              visited.add(childId);

              // Add spouse if exists
              const spouseId = spouseMap[childId];
              if (spouseId && !visited.has(spouseId)) {
                const spouse = members.find(m => m.id === spouseId);
                if (spouse) {
                  const spouseWithPosition = {
                    ...spouse,
                    x: xPosition + childIndex + 0.6, // Slightly offset
                    generation: genIndex,
                    isSpouseGroup: true,
                    spouseOf: childId
                  };
                  nextGeneration.push(spouseWithPosition);
                  memberPositions[spouseId] = {
                    x: xPosition + childIndex + 0.6,
                    generation: genIndex,
                    spouseOf: childId
                  };
                  visited.add(spouseId);
                }
              }
            }
          }
        });
        
        xPosition += Math.max(childrenArray.length, 1) + 1; // Space between families
      });
      
      if (nextGeneration.length > 0) {
        generations.push(nextGeneration);
        currentGeneration = nextGeneration.filter(m => !m.isSpouseGroup);
        genIndex++;
      } else {
        break;
      }
    }

    setTreeData({ generations, memberPositions, relationships, spouseMap, parentChildMap });
  };

  // Calculate connection paths with enhanced visual design
  const generateConnectionPaths = () => {
    if (!treeData.generations || treeData.generations.length === 0) return [];
    
    const connections = [];
    const { memberPositions, relationships, spouseMap, parentChildMap } = treeData;

    // Generate parent-child connections with proper family tree styling
    Object.entries(parentChildMap).forEach(([parentId, children]) => {
      const parentPos = memberPositions[parentId];
      if (!parentPos || children.length === 0) return;

      // Calculate parent position
      const parentX = parentPos.x * (CARD_WIDTH + HORIZONTAL_SPACING) + CARD_WIDTH / 2;
      const parentY = parentPos.generation * (CARD_HEIGHT + VERTICAL_SPACING) + CARD_HEIGHT;

      // If there are multiple children, create a branching structure
      if (children.length > 1) {
        // Find all child positions
        const childPositions = children.map(childId => {
          const childPos = memberPositions[childId];
          if (!childPos) return null;
          return {
            id: childId,
            x: childPos.x * (CARD_WIDTH + HORIZONTAL_SPACING) + CARD_WIDTH / 2,
            y: childPos.generation * (CARD_HEIGHT + VERTICAL_SPACING)
          };
        }).filter(pos => pos !== null);

        if (childPositions.length > 1) {
          // Create horizontal line connecting all children
          const leftmostX = Math.min(...childPositions.map(pos => pos.x));
          const rightmostX = Math.max(...childPositions.map(pos => pos.x));
          const childrenY = childPositions[0].y;
          const midY = parentY + (childrenY - parentY) / 2;

          // Parent vertical line down
          connections.push({
            type: 'parent-connector',
            path: `M ${parentX} ${parentY} L ${parentX} ${midY}`,
            color: '#374151',
            strokeWidth: 2
          });

          // Horizontal line connecting all children
          connections.push({
            type: 'sibling-connector',
            path: `M ${leftmostX} ${midY} L ${rightmostX} ${midY}`,
            color: '#374151',
            strokeWidth: 2
          });

          // Vertical lines down to each child
          childPositions.forEach(childPos => {
            connections.push({
              type: 'child-connector',
              path: `M ${childPos.x} ${midY} L ${childPos.x} ${childPos.y}`,
              color: '#374151',
              strokeWidth: 2
            });
          });

          // Connect parent horizontal line to children horizontal line
          const parentToChildrenX = (leftmostX + rightmostX) / 2;
          connections.push({
            type: 'parent-to-children',
            path: `M ${parentX} ${midY} L ${parentToChildrenX} ${midY}`,
            color: '#374151',
            strokeWidth: 2
          });
        }
      } else {
        // Single child - simple L-shaped connection
        const childPos = memberPositions[children[0]];
        if (childPos) {
          const childX = childPos.x * (CARD_WIDTH + HORIZONTAL_SPACING) + CARD_WIDTH / 2;
          const childY = childPos.generation * (CARD_HEIGHT + VERTICAL_SPACING);
          const midY = parentY + (childY - parentY) / 2;

          connections.push({
            type: 'parent-child-single',
            path: `M ${parentX} ${parentY} L ${parentX} ${midY} L ${childX} ${midY} L ${childX} ${childY}`,
            color: '#374151',
            strokeWidth: 2
          });
        }
      }
    });

    // Generate spouse connections with elegant styling
    Object.entries(spouseMap).forEach(([memberId1, memberId2]) => {
      // Only draw each spouse connection once
      if (parseInt(memberId1) >= parseInt(memberId2)) return;

      const pos1 = memberPositions[memberId1];
      const pos2 = memberPositions[memberId2];
      
      if (pos1 && pos2 && pos1.generation === pos2.generation) {
        const x1 = pos1.x * (CARD_WIDTH + HORIZONTAL_SPACING) + CARD_WIDTH / 2;
        const y1 = pos1.generation * (CARD_HEIGHT + VERTICAL_SPACING) + CARD_HEIGHT / 2;
        
        const x2 = pos2.x * (CARD_WIDTH + HORIZONTAL_SPACING) + CARD_WIDTH / 2;
        const y2 = pos2.generation * (CARD_HEIGHT + VERTICAL_SPACING) + CARD_HEIGHT / 2;

        // Create a curved connection for spouses to make it visually distinct
        const midX = (x1 + x2) / 2;
        const curveOffset = -15; // Curve upward
        
        connections.push({
          type: 'spouse',
          path: `M ${x1} ${y1} Q ${midX} ${y1 + curveOffset} ${x2} ${y2}`,
          color: '#DC2626',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        });

        // Add heart symbol at the midpoint of spouse connection
        connections.push({
          type: 'spouse-heart',
          path: 'M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z',
          x: midX - 6,
          y: y1 + curveOffset - 6,
          color: '#DC2626',
          scale: 0.5
        });
      }
    });

    return connections;
  };

  // Utility functions
  const getPhotoUrl = (member) => {
    if (!member.photo_url) return null;
    if (member.photo_url.startsWith('http')) return member.photo_url;
    return `${process.env.REACT_APP_API}/${member.photo_url}`;
  };

  const getDisplayName = (member) => {
    const firstName = member.first_name || '';
    const lastName = member.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  const getBirthYear = (member) => {
    if (member.birth_date) return new Date(member.birth_date).getFullYear();
    return null;
  };

  const getDeathYear = (member) => {
    if (member.death_date) return new Date(member.death_date).getFullYear();
    return null;
  };

  // Zoom and pan controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

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

  const handleMouseUp = () => setIsDragging(false);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-xl">Loading family tree...</div>
      </div>
    );
  }

  const connections = generateConnectionPaths();
  const maxX = Math.max(...treeData.generations.flatMap(gen => gen.map(m => m.x)));
  const maxY = treeData.generations.length - 1;
  const totalWidth = (maxX + 1) * (CARD_WIDTH + HORIZONTAL_SPACING) + 200;
  const totalHeight = (maxY + 1) * (CARD_HEIGHT + VERTICAL_SPACING) + 200;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Control Panel */}
      <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-20 border">
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleZoomIn}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm transition-colors"
          >
            Zoom In (+)
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm transition-colors"
          >
            Zoom Out (-)
          </button>
          <button
            onClick={handleResetZoom}
            className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm transition-colors"
          >
            Reset View
          </button>
          <div className="text-xs text-gray-600 text-center mt-2 border-t pt-2">
            Zoom: {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Manning Family Tree</h1>
        <p className="text-gray-600 text-lg">
          {members.length} family members across {treeData.generations?.length || 0} generations
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Click and drag to explore • Use zoom controls • Click members for details
        </p>
      </div>

      {/* Family Tree Container */}
      <div
        ref={containerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: 'calc(100vh - 200px)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            width: totalWidth,
            height: totalHeight,
            transformOrigin: 'center center'
          }}
        >
          {/* SVG for all connection lines */}
          <svg
            ref={svgRef}
            className="absolute top-0 left-0 pointer-events-none z-0"
            width={totalWidth}
            height={totalHeight}
            style={{ overflow: 'visible' }}
          >
            {/* Render connection paths with enhanced styling */}
            {connections.map((connection, index) => {
              if (connection.type === 'spouse-heart') {
                return (
                  <g
                    key={`connection-${index}`}
                    transform={`translate(${connection.x}, ${connection.y}) scale(${connection.scale})`}
                  >
                    <path
                      d={connection.path}
                      fill={connection.color}
                      opacity="0.8"
                    />
                  </g>
                );
              }
              
              return (
                <path
                  key={`connection-${index}`}
                  d={connection.path}
                  stroke={connection.color}
                  strokeWidth={connection.strokeWidth}
                  fill="none"
                  strokeDasharray={connection.strokeDasharray}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              );
            })}
          </svg>

          {/* Family member cards positioned absolutely */}
          <div className="relative z-10">
            {treeData.generations && treeData.generations.map((generation, genIndex) => (
              generation.map((member) => (
                <div
                  key={member.id}
                  className="absolute"
                  style={{
                    left: member.x * (CARD_WIDTH + HORIZONTAL_SPACING) + 100,
                    top: member.generation * (CARD_HEIGHT + VERTICAL_SPACING) + 100,
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT
                  }}
                >
                  <Link 
                    to={`/members/${member.id}`}
                    className="block h-full transition-transform hover:scale-105 hover:z-20 relative"
                  >
                    <div className={`
                      bg-white rounded-xl shadow-lg p-4 h-full border-2 
                      hover:shadow-xl transition-all duration-200
                      ${member.isSpouseGroup ? 'border-purple-300 bg-purple-50' : 'border-blue-300 bg-blue-50'}
                    `}>
                      {/* Spouse indicator */}
                      {member.isSpouseGroup && (
                        <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          ♥
                        </div>
                      )}

                      {/* Photo */}
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-3 border-white shadow-md bg-gray-200">
                        {getPhotoUrl(member) ? (
                          <img
                            src={getPhotoUrl(member)}
                            alt={getDisplayName(member)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-center font-bold text-gray-800 mb-2 text-sm leading-tight">
                        {getDisplayName(member)}
                      </h3>

                      {/* Life Dates */}
                      <div className="text-center text-xs text-gray-600 mb-2">
                        {getBirthYear(member) && (
                          <div className="font-medium">
                            {getBirthYear(member)}
                            {getDeathYear(member) && ` - ${getDeathYear(member)}`}
                            {!getDeathYear(member) && member.is_alive !== false && ' - Present'}
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      {member.location && (
                        <div className="text-center text-xs text-blue-600 bg-blue-100 rounded-full px-2 py-1 mx-auto max-w-fit">
                          📍 {member.location}
                        </div>
                      )}

                      {/* Generation indicator */}
                      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                        {member.generation + 1}
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-20 border">
        <h3 className="text-sm font-bold mb-3 text-gray-800">Family Tree Guide</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center">
            <div className="w-6 h-0.5 bg-gray-700 mr-3 rounded"></div>
            <span>Parent-Child relationship</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-0.5 bg-red-600 mr-3 rounded border-dashed" style={{borderTop: '2px dashed #DC2626', height: '1px', background: 'none'}}></div>
            <span>Marriage/Spouse ♥</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-300 rounded mr-3 flex items-center justify-center text-purple-600">♥</div>
            <span>Married couple</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded-full mr-3 flex items-center justify-center text-gray-600 text-xs">1</div>
            <span>Generation number</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-0.5 bg-gray-700 mr-3 rounded"></div>
            <span>Sibling connections</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          <div>📍 Location info when available</div>
          <div>💙 Heart symbols show marriages</div>
          <div>🔗 Lines show family connections</div>
          <div>Click any member for full profile</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFamilyTree;