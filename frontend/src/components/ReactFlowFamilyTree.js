import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Component for Family Members
const FamilyMemberNode = ({ data }) => {
  const API_BASE = process.env.REACT_APP_API || 'http://192.168.1.120:5000';
  
  return (
    <div style={{
      background: 'white',
      border: `3px solid ${data.gender === 'Male' ? '#2196f3' : '#e91e63'}`,
      borderRadius: '16px',
      padding: '12px',
      minWidth: '160px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.2s ease'
    }}>
      {/* Photo */}
      <div style={{ 
        width: '80px', 
        height: '80px', 
        margin: '0 auto 12px', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        background: data.gender === 'Male' ? '#e3f2fd' : '#fce4ec',
        border: `2px solid ${data.gender === 'Male' ? '#2196f3' : '#e91e63'}`
      }}>
        {data.photo_url ? (
          <img 
            src={`${API_BASE}/${data.photo_url}`} 
            alt={data.first_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '24px',
            color: data.gender === 'Male' ? '#1976d2' : '#c2185b'
          }}>
            👤
          </div>
        )}
      </div>
      
      {/* Name */}
      <div style={{ 
        fontSize: '14px', 
        fontWeight: 'bold', 
        marginBottom: '8px', 
        lineHeight: '1.2',
        color: '#333'
      }}>
        {data.first_name} {data.last_name}
      </div>
      
      {/* Birth/Death Years */}
      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginBottom: '6px' 
      }}>
        {data.birth_year || 'Unknown'} - {data.is_alive ? 'Present' : (data.death_year || '?')}
      </div>
      
      {/* Status */}
      <div style={{ 
        fontSize: '10px', 
        fontWeight: 'bold',
        color: data.is_alive ? '#4caf50' : '#757575',
        textTransform: 'uppercase',
        background: data.is_alive ? '#e8f5e8' : '#f5f5f5',
        padding: '4px 8px',
        borderRadius: '12px'
      }}>
        {data.is_alive ? 'ALIVE' : 'DECEASED'}
      </div>
      
      {/* Connection Points */}
      <div className="react-flow__handle react-flow__handle-top" style={{
        background: '#007bff',
        width: '8px',
        height: '8px',
        border: '2px solid white'
      }} />
      <div className="react-flow__handle react-flow__handle-bottom" style={{
        background: '#007bff',
        width: '8px',
        height: '8px',
        border: '2px solid white'
      }} />
    </div>
  );
};

const ReactFlowFamilyTree = () => {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedPositions, setSavedPositions] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Define custom node types
  const nodeTypes = {
    familyMember: FamilyMemberNode,
  };

  useEffect(() => {
    fetchFamilyData();
    loadSavedPositions();
  }, []);

  useEffect(() => {
    if (members.length > 0 && relationships.length > 0) {
      buildReactFlowTree();
    }
  }, [members, relationships]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      
      const API_BASE = window.location.hostname === 'family.techwoods.cc' 
        ? 'https://family.techwoods.cc'
        : 'http://192.168.1.120:5000';
      
      console.log('React Flow Tree: Fetching from:', API_BASE);
      
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
            generation: member.generation || 0 // Use database generation or default to 0
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

      // Same mock data as your existing component with enhanced location data
      setMembers([
        { id: 1, first_name: 'Percy', last_name: 'Manning Sr.', birth_year: 1920, death_year: 1995, is_alive: false, photo_url: null, gender: 'Male', birth_place: 'Alabama, USA' },
        { id: 2, first_name: 'Alice', last_name: 'Manning', birth_year: 1925, death_year: 2000, is_alive: false, photo_url: null, gender: 'Female', birth_place: 'Alabama, USA' },
        { id: 3, first_name: 'Ruth', last_name: 'Dees', birth_year: 1945, is_alive: true, photo_url: null, gender: 'Female', birth_place: 'Alabama, USA', location: 'Georgia, USA' },
        { id: 4, first_name: 'Alonzo', last_name: 'Dees', birth_year: 1940, is_alive: true, photo_url: null, gender: 'Male', birth_place: 'Alabama, USA', location: 'Georgia, USA' },
        { id: 5, first_name: 'Hazel', last_name: 'Raymond', birth_year: 1950, is_alive: true, photo_url: null, gender: 'Female', birth_place: 'Alabama, USA', location: 'Florida, USA' },
        { id: 6, first_name: 'Debra', last_name: 'Woods', birth_year: 1965, is_alive: true, photo_url: null, gender: 'Female', birth_place: 'Georgia, USA', location: 'Texas, USA' },
        { id: 7, first_name: 'Frank', last_name: 'Woods Jr.', birth_year: 1960, is_alive: true, photo_url: null, gender: 'Male', birth_place: 'Georgia, USA', location: 'Texas, USA' },
        { id: 8, first_name: 'Steven', last_name: 'Dees', birth_year: 1970, is_alive: true, photo_url: null, gender: 'Male', birth_place: 'Georgia, USA', location: 'Georgia, USA' },
        { id: 9, first_name: 'Justin', last_name: 'Woods', birth_year: 1987, is_alive: true, photo_url: null, gender: 'Male', birth_place: 'Texas, USA', location: 'Texas, USA' },
        { id: 10, first_name: 'Priya', last_name: 'Baliga', birth_year: 1985, is_alive: true, photo_url: null, gender: 'Female', birth_place: 'India', location: 'Texas, USA' },
        { id: 11, first_name: 'Shanna', last_name: 'Woods', birth_year: 1990, is_alive: true, photo_url: null, gender: 'Female', birth_place: 'Texas, USA', location: 'California, USA' },
        { id: 12, first_name: 'Asha', last_name: 'Woods', birth_year: 2023, is_alive: true, photo_url: null, gender: 'Female', birth_place: 'Texas, USA', location: 'Texas, USA' }
      ]);
      
      setRelationships([
        { id: 1, member1_id: 1, member2_id: 2, relationship_type: 'husband' },
        { id: 2, member1_id: 2, member2_id: 1, relationship_type: 'wife' },
        { id: 3, member1_id: 1, member2_id: 3, relationship_type: 'father' },
        { id: 4, member1_id: 2, member2_id: 3, relationship_type: 'mother' },
        { id: 5, member1_id: 2, member2_id: 5, relationship_type: 'mother' },
        { id: 6, member1_id: 3, member2_id: 4, relationship_type: 'wife' },
        { id: 7, member1_id: 4, member2_id: 3, relationship_type: 'husband' },
        { id: 8, member1_id: 3, member2_id: 6, relationship_type: 'mother' },
        { id: 9, member1_id: 4, member2_id: 6, relationship_type: 'father' },
        { id: 10, member1_id: 3, member2_id: 8, relationship_type: 'mother' },
        { id: 11, member1_id: 4, member2_id: 8, relationship_type: 'father' },
        { id: 12, member1_id: 6, member2_id: 7, relationship_type: 'wife' },
        { id: 13, member1_id: 7, member2_id: 6, relationship_type: 'husband' },
        { id: 14, member1_id: 6, member2_id: 9, relationship_type: 'mother' },
        { id: 15, member1_id: 7, member2_id: 9, relationship_type: 'father' },
        { id: 16, member1_id: 6, member2_id: 11, relationship_type: 'mother' },
        { id: 17, member1_id: 7, member2_id: 11, relationship_type: 'father' },
        { id: 18, member1_id: 9, member2_id: 10, relationship_type: 'husband' },
        { id: 19, member1_id: 10, member2_id: 9, relationship_type: 'wife' },
        { id: 20, member1_id: 9, member2_id: 12, relationship_type: 'father' },
        { id: 21, member1_id: 10, member2_id: 12, relationship_type: 'mother' }
      ]);
      
    } catch (error) {
      console.error('React Flow: Error fetching family data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPositions = async () => {
    try {
      const API_BASE = window.location.hostname === 'family.techwoods.cc' 
        ? 'https://family.techwoods.cc'
        : 'http://192.168.1.120:5000';
      
      console.log('🔄 Loading saved node positions...');
      const response = await fetch(`${API_BASE}/api/tree-positions?tree_type=reactflow`);
      
      if (response.ok) {
        const positions = await response.json();
        setSavedPositions(positions);
        console.log('✅ Loaded', Object.keys(positions).length, 'saved positions');
      } else {
        console.log('ℹ️ No saved positions found, will use auto-layout');
        setSavedPositions({});
      }
    } catch (error) {
      console.log('⚠️ Failed to load saved positions:', error);
      setSavedPositions({});
    }
  };

  const saveAllPositions = async (currentNodes) => {
    try {
      const API_BASE = window.location.hostname === 'family.techwoods.cc' 
        ? 'https://family.techwoods.cc'
        : 'http://192.168.1.120:5000';
      
      // Convert nodes to positions object
      const positions = {};
      currentNodes.forEach(node => {
        positions[node.id] = {
          x: node.position.x,
          y: node.position.y
        };
      });
      
      console.log('💾 Saving', Object.keys(positions).length, 'node positions...');
      
      const response = await fetch(`${API_BASE}/api/tree-positions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positions: positions,
          tree_type: 'reactflow'
        })
      });
      
      if (response.ok) {
        console.log('✅ Positions saved successfully');
        setHasUnsavedChanges(false);
        setSavedPositions(positions);
      } else {
        console.error('❌ Failed to save positions');
      }
    } catch (error) {
      console.error('❌ Error saving positions:', error);
    }
  };

  const resetAllPositions = async () => {
    try {
      const API_BASE = window.location.hostname === 'family.techwoods.cc' 
        ? 'https://family.techwoods.cc'
        : 'http://192.168.1.120:5000';
      
      console.log('🗑️ Resetting all saved positions...');
      
      const response = await fetch(`${API_BASE}/api/tree-positions?tree_type=reactflow`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Positions reset successfully');
        setSavedPositions({});
        setHasUnsavedChanges(false);
        // Rebuild tree with auto-layout
        buildReactFlowTree();
      } else {
        console.error('❌ Failed to reset positions');
      }
    } catch (error) {
      console.error('❌ Error resetting positions:', error);
    }
  };

  // Layout Template Functions
  const applyLayoutTemplate = (templateName) => {
    console.log(`🎨 Applying ${templateName} layout template...`);
    
    let newNodes = [...nodes];
    
    switch (templateName) {
      case 'generation':
        newNodes = applyGenerationLayout(newNodes);
        break;
      case 'location':
        newNodes = applyLocationLayout(newNodes);
        break;
      case 'circular':
        newNodes = applyCircularLayout(newNodes);
        break;
      case 'timeline':
        newNodes = applyTimelineLayout(newNodes);
        break;
      case 'family-unit':
        newNodes = applyFamilyUnitLayout(newNodes);
        break;
      case 'traditional':
        newNodes = applyTraditionalTreeLayout(newNodes);
        break;
      default:
        console.warn('Unknown layout template:', templateName);
        return;
    }
    
    setNodes(newNodes);
    setHasUnsavedChanges(true);
    console.log(`✅ Applied ${templateName} layout to ${newNodes.length} nodes`);
  };

  const applyGenerationLayout = (currentNodes) => {
    const generationGroups = {};
    
    // Group nodes by database generation field
    currentNodes.forEach(node => {
      const gen = node.data.generation || 0;
      if (!generationGroups[gen]) generationGroups[gen] = [];
      generationGroups[gen].push(node);
    });
    
    const updatedNodes = [];
    const generations = Object.keys(generationGroups).sort((a, b) => a - b);
    
    generations.forEach((gen, genIndex) => {
      const nodesInGen = generationGroups[gen];
      const spacing = 1000 / (nodesInGen.length + 1);
      
      nodesInGen.forEach((node, nodeIndex) => {
        updatedNodes.push({
          ...node,
          position: {
            x: (nodeIndex + 1) * spacing - 80,
            y: parseInt(gen) * 250 + 50 // Use actual generation number, not index
          }
        });
      });
    });
    
    return updatedNodes;
  };

  const applyLocationLayout = (currentNodes) => {
    const locationGroups = {};
    
    // Group by birth_place or location
    currentNodes.forEach(node => {
      const location = node.data.birth_place || node.data.location || 'Unknown';
      if (!locationGroups[location]) locationGroups[location] = [];
      locationGroups[location].push(node);
    });
    
    const updatedNodes = [];
    const locations = Object.keys(locationGroups);
    const cols = Math.ceil(Math.sqrt(locations.length));
    
    locations.forEach((location, locIndex) => {
      const col = locIndex % cols;
      const row = Math.floor(locIndex / cols);
      const nodesInLocation = locationGroups[location];
      
      nodesInLocation.forEach((node, nodeIndex) => {
        updatedNodes.push({
          ...node,
          position: {
            x: col * 400 + (nodeIndex % 3) * 160,
            y: row * 300 + Math.floor(nodeIndex / 3) * 200
          }
        });
      });
    });
    
    return updatedNodes;
  };

  const applyCircularLayout = (currentNodes) => {
    const centerX = 500;
    const centerY = 400;
    const generationGroups = {};
    
    // Group by database generation field
    currentNodes.forEach(node => {
      const gen = node.data.generation || 0;
      if (!generationGroups[gen]) generationGroups[gen] = [];
      generationGroups[gen].push(node);
    });
    
    const updatedNodes = [];
    const generations = Object.keys(generationGroups).sort((a, b) => a - b);
    
    generations.forEach((gen, genIndex) => {
      const nodesInGen = generationGroups[gen];
      const radius = genIndex === 0 ? 0 : 150 + (genIndex * 120);
      
      if (genIndex === 0) {
        // Center node(s)
        nodesInGen.forEach((node, nodeIndex) => {
          updatedNodes.push({
            ...node,
            position: {
              x: centerX - 80 + (nodeIndex * 20),
              y: centerY - 90 + (nodeIndex * 20)
            }
          });
        });
      } else {
        // Circular arrangement
        nodesInGen.forEach((node, nodeIndex) => {
          const angle = (2 * Math.PI * nodeIndex) / nodesInGen.length;
          updatedNodes.push({
            ...node,
            position: {
              x: centerX + radius * Math.cos(angle) - 80,
              y: centerY + radius * Math.sin(angle) - 90
            }
          });
        });
      }
    });
    
    return updatedNodes;
  };

  const applyTimelineLayout = (currentNodes) => {
    // Sort by birth year
    const sortedNodes = [...currentNodes].sort((a, b) => {
      const yearA = a.data.birth_year || 1900;
      const yearB = b.data.birth_year || 1900;
      return yearA - yearB;
    });
    
    const updatedNodes = [];
    const minYear = Math.min(...sortedNodes.map(n => n.data.birth_year || 1900));
    const maxYear = Math.max(...sortedNodes.map(n => n.data.birth_year || 2023));
    const yearRange = maxYear - minYear || 1;
    
    sortedNodes.forEach((node, index) => {
      const birthYear = node.data.birth_year || minYear;
      const xPos = ((birthYear - minYear) / yearRange) * 1200 + 50;
      
      // Spread vertically to avoid overlap
      const yPos = 100 + (index % 6) * 180;
      
      updatedNodes.push({
        ...node,
        position: { x: xPos, y: yPos }
      });
    });
    
    return updatedNodes;
  };

  const applyFamilyUnitLayout = (currentNodes) => {
    // Group spouses together and position children nearby
    const spouseMap = new Map();
    const parentToChildren = new Map();
    
    // Build relationship maps
    relationships.forEach(rel => {
      if (rel.relationship_type === 'husband' || rel.relationship_type === 'wife') {
        spouseMap.set(rel.member1_id, rel.member2_id);
      } else if (rel.relationship_type === 'father' || rel.relationship_type === 'mother') {
        if (!parentToChildren.has(rel.member1_id)) {
          parentToChildren.set(rel.member1_id, []);
        }
        parentToChildren.get(rel.member1_id).push(rel.member2_id);
      }
    });
    
    const updatedNodes = [];
    const processed = new Set();
    let currentX = 50;
    let currentY = 50;
    
    currentNodes.forEach(node => {
      const memberId = parseInt(node.id);
      if (processed.has(memberId)) return;
      
      const spouseId = spouseMap.get(memberId);
      const spouse = spouseId ? currentNodes.find(n => parseInt(n.id) === spouseId) : null;
      
      // Position primary person
      updatedNodes.push({
        ...node,
        position: { x: currentX, y: currentY }
      });
      processed.add(memberId);
      
      // Position spouse next to them
      if (spouse && !processed.has(spouseId)) {
        updatedNodes.push({
          ...spouse,
          position: { x: currentX + 180, y: currentY }
        });
        processed.add(spouseId);
      }
      
      // Position children below
      const children = parentToChildren.get(memberId) || [];
      children.forEach((childId, childIndex) => {
        const childNode = currentNodes.find(n => parseInt(n.id) === childId);
        if (childNode && !processed.has(childId)) {
          updatedNodes.push({
            ...childNode,
            position: { 
              x: currentX + (childIndex * 160), 
              y: currentY + 200 
            }
          });
          processed.add(childId);
        }
      });
      
      // Move to next family unit position
      currentX += 400;
      if (currentX > 1200) {
        currentX = 50;
        currentY += 350;
      }
    });
    
    // Add any remaining nodes
    currentNodes.forEach(node => {
      const memberId = parseInt(node.id);
      if (!processed.has(memberId)) {
        updatedNodes.push({
          ...node,
          position: { x: currentX, y: currentY }
        });
        currentX += 180;
      }
    });
    
    return updatedNodes;
  };

  const applyTraditionalTreeLayout = (currentNodes) => {
    // Vertical tree layout with root at top
    const generationGroups = {};
    
    currentNodes.forEach(node => {
      const gen = node.data.generation || 0;
      if (!generationGroups[gen]) generationGroups[gen] = [];
      generationGroups[gen].push(node);
    });
    
    const updatedNodes = [];
    const generations = Object.keys(generationGroups).sort((a, b) => a - b);
    
    generations.forEach((gen, genIndex) => {
      const nodesInGen = generationGroups[gen];
      const totalWidth = nodesInGen.length * 200;
      const startX = (1200 - totalWidth) / 2;
      
      nodesInGen.forEach((node, nodeIndex) => {
        updatedNodes.push({
          ...node,
          position: {
            x: startX + (nodeIndex * 200),
            y: parseInt(gen) * 180 + 50 // Use actual generation number
          }
        });
      });
    });
    
    return updatedNodes;
  };

  const buildReactFlowTree = () => {
    console.log('Building React Flow family tree...');
    
    // Build relationship maps
    const spouseMap = new Map();
    const parentToChildren = new Map();
    const childToParents = new Map();
    
    relationships.forEach(rel => {
      if (rel.relationship_type === 'husband' || rel.relationship_type === 'wife') {
        spouseMap.set(rel.member1_id, rel.member2_id);
      } else if (rel.relationship_type === 'father' || rel.relationship_type === 'mother') {
        if (!parentToChildren.has(rel.member1_id)) {
          parentToChildren.set(rel.member1_id, []);
        }
        parentToChildren.get(rel.member1_id).push(rel.member2_id);
        
        if (!childToParents.has(rel.member2_id)) {
          childToParents.set(rel.member2_id, []);
        }
        childToParents.get(rel.member2_id).push(rel.member1_id);
      }
    });

    // Create nodes (family members)
    const flowNodes = members.map((member, index) => {
      // Use database generation field directly, no calculation needed
      const generation = member.generation || 0;
      
      // Position calculation - spread across generations
      const generationWidth = 800;
      const membersInGeneration = members.filter(m => (m.generation || 0) === generation);
      
      const indexInGeneration = membersInGeneration.findIndex(m => m.id === member.id);
      const spacing = generationWidth / (membersInGeneration.length + 1);
      
      return {
        id: member.id.toString(),
        type: 'familyMember',
        position: savedPositions[member.id] ? {
          x: savedPositions[member.id].x,
          y: savedPositions[member.id].y
        } : {
          x: (indexInGeneration + 1) * spacing - 80, // Center the node
          y: generation * 250 + 50
        },
        data: {
          ...member,
          generation: generation
        },
        draggable: true
      };
    });

    // Create edges (relationships)
    const flowEdges = [];
    
    // Parent-child relationships
    relationships.forEach(rel => {
      if (rel.relationship_type === 'father' || rel.relationship_type === 'mother') {
        flowEdges.push({
          id: `parent-child-${rel.id}`,
          source: rel.member1_id.toString(),
          target: rel.member2_id.toString(),
          type: 'smoothstep',
          style: { 
            stroke: '#4a90e2', 
            strokeWidth: 3 
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#4a90e2',
          },
          label: rel.relationship_type,
          labelStyle: { 
            fontSize: '12px', 
            background: 'white',
            padding: '2px 6px',
            borderRadius: '4px'
          }
        });
      }
    });
    
    // Spouse relationships (only add once per couple)
    const processedSpouses = new Set();
    relationships.forEach(rel => {
      if (rel.relationship_type === 'husband' || rel.relationship_type === 'wife') {
        const coupleKey = [rel.member1_id, rel.member2_id].sort().join('-');
        if (!processedSpouses.has(coupleKey)) {
          processedSpouses.add(coupleKey);
          flowEdges.push({
            id: `spouse-${rel.id}`,
            source: rel.member1_id.toString(),
            target: rel.member2_id.toString(),
            type: 'straight',
            style: { 
              stroke: '#8b5cf6', 
              strokeWidth: 4,
              strokeDasharray: '5,5'
            },
            label: '💕 Spouse',
            labelStyle: { 
              fontSize: '12px', 
              background: '#f8f4ff',
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid #8b5cf6'
            }
          });
        }
      }
    });

    console.log('React Flow: Created', flowNodes.length, 'nodes and', flowEdges.length, 'edges');
    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onNodeClick = useCallback((event, node) => {
    console.log('Clicked on:', node.data.first_name, node.data.last_name);
    // You can add click handling here - maybe show a profile modal
  }, []);

  const onNodeDragStop = useCallback((event, node) => {
    console.log('📌 Node dragged:', node.data.first_name, 'to position:', node.position);
    setHasUnsavedChanges(true);
  }, []);

  const onNodesChangeWithTracking = useCallback((changes) => {
    onNodesChange(changes);
    
    // Check if any nodes were dragged
    const hasDrag = changes.some(change => change.type === 'position' && change.dragging === false);
    if (hasDrag) {
      setHasUnsavedChanges(true);
    }
  }, [onNodesChange]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>Loading React Flow Family Tree...</div>
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
        <h3>Error Loading React Flow Family Tree</h3>
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

  // Template button styling
  const templateButtonStyle = {
    padding: '6px 12px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  };

  return (
    <div style={{ height: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        background: 'white', 
        borderBottom: '2px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '15px'
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ margin: '0 0 10px 0', color: '#1a202c' }}>
              Interactive Manning Family Tree
            </h1>
            <p style={{ margin: 0, color: '#4a5568' }}>
              🔍 Zoom • 🖱️ Pan • 📱 Drag nodes • 👆 Click to explore
            </p>
          </div>
          
          {/* Position Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {hasUnsavedChanges && (
              <span style={{ 
                color: '#f59e0b', 
                fontSize: '14px', 
                fontWeight: 'bold',
                marginRight: '10px' 
              }}>
                ⚠️ Unsaved Changes
              </span>
            )}
            
            <button
              onClick={() => saveAllPositions(nodes)}
              disabled={!hasUnsavedChanges}
              style={{
                padding: '8px 16px',
                background: hasUnsavedChanges ? '#10b981' : '#d1d5db',
                color: hasUnsavedChanges ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              💾 Save Layout
            </button>
            
            <button
              onClick={resetAllPositions}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🔄 Reset Layout
            </button>
          </div>
        </div>
        
        {/* Layout Templates */}
        <div style={{ 
          borderTop: '1px solid #e2e8f0',
          paddingTop: '15px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#374151',
              marginRight: '10px'
            }}>
              🎨 Layout Templates:
            </span>
            
            <button
              onClick={() => applyLayoutTemplate('generation')}
              style={templateButtonStyle}
              title="Arrange by generation in horizontal rows"
            >
              📊 By Generation
            </button>
            
            <button
              onClick={() => applyLayoutTemplate('location')}
              style={templateButtonStyle}
              title="Group by birth location or residence"
            >
              🌍 By Location
            </button>
            
            <button
              onClick={() => applyLayoutTemplate('circular')}
              style={templateButtonStyle}
              title="Circular arrangement with ancestors in center"
            >
              ⭕ Circular
            </button>
            
            <button
              onClick={() => applyLayoutTemplate('timeline')}
              style={templateButtonStyle}
              title="Timeline arrangement by birth year"
            >
              📅 Timeline
            </button>
            
            <button
              onClick={() => applyLayoutTemplate('family-unit')}
              style={templateButtonStyle}
              title="Group nuclear families together"
            >
              👨‍👩‍👧‍👦 Family Units
            </button>
            
            <button
              onClick={() => applyLayoutTemplate('traditional')}
              style={templateButtonStyle}
              title="Classic vertical tree structure"
            >
              🌳 Traditional
            </button>
          </div>
        </div>
      </div>

      {/* React Flow Container */}
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWithTracking}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          {/* Mini Map - shows overview */}
          <MiniMap 
            style={{
              height: 120,
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '8px'
            }}
            zoomable
            pannable
          />
          
          {/* Controls - zoom in/out, fit view */}
          <Controls 
            style={{
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '8px'
            }}
          />
          
          {/* Background pattern */}
          <Background 
            variant="dots" 
            gap={20} 
            size={1}
            color="#cbd5e0"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default ReactFlowFamilyTree;