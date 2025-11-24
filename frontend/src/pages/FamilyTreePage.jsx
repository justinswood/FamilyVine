import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Home } from 'lucide-react';
import FamilyTree from '@balkangraph/familytree.js';

// Create custom template with new dimensions
if (FamilyTree.templates.hugo_custom === undefined) {
  FamilyTree.templates.hugo_custom = Object.assign({}, FamilyTree.templates.hugo);
  FamilyTree.templates.hugo_custom.size = [200, 155];
  // Center 100x100 profile image: (200 - 100) / 2 = 50px from left
  FamilyTree.templates.hugo_custom.img_0 =
    '<clipPath id="{randId}"><rect fill="#fff" x="50" y="15" width="100" height="100" rx="50"></rect></clipPath>' +
    '<image preserveAspectRatio="xMidYMid slice" clip-path="url(#{randId})" xlink:href="{val}" x="50" y="15" width="100" height="100"></image>';
  // Move text fields below image with original hugo styling
  FamilyTree.templates.hugo_custom.field_0 = '<text data-width="190" style="font-size: 18px;font-weight:bold;" fill="#ffffff" x="100" y="133" text-anchor="middle">{val}</text>';
  FamilyTree.templates.hugo_custom.field_1 = '<text data-width="190" style="font-size: 14px;" fill="#ffffff" x="100" y="150" text-anchor="middle">{val}</text>';

  // Create male and female variants
  FamilyTree.templates.hugo_custom_male = Object.assign({}, FamilyTree.templates.hugo_male);
  FamilyTree.templates.hugo_custom_male.size = [200, 155];
  FamilyTree.templates.hugo_custom_male.img_0 =
    '<clipPath id="{randId}"><rect fill="#fff" x="50" y="15" width="100" height="100" rx="50"></rect></clipPath>' +
    '<image preserveAspectRatio="xMidYMid slice" clip-path="url(#{randId})" xlink:href="{val}" x="50" y="15" width="100" height="100"></image>';
  FamilyTree.templates.hugo_custom_male.field_0 = '<text data-width="190" style="font-size: 18px;font-weight:bold;" fill="#ffffff" x="100" y="133" text-anchor="middle">{val}</text>';
  FamilyTree.templates.hugo_custom_male.field_1 = '<text data-width="190" style="font-size: 14px;" fill="#ffffff" x="100" y="150" text-anchor="middle">{val}</text>';

  FamilyTree.templates.hugo_custom_female = Object.assign({}, FamilyTree.templates.hugo_female);
  FamilyTree.templates.hugo_custom_female.size = [200, 155];
  FamilyTree.templates.hugo_custom_female.img_0 =
    '<clipPath id="{randId}"><rect fill="#fff" x="50" y="15" width="100" height="100" rx="50"></rect></clipPath>' +
    '<image preserveAspectRatio="xMidYMid slice" clip-path="url(#{randId})" xlink:href="{val}" x="50" y="15" width="100" height="100"></image>';
  FamilyTree.templates.hugo_custom_female.field_0 = '<text data-width="190" style="font-size: 18px;font-weight:bold;" fill="#ffffff" x="100" y="133" text-anchor="middle">{val}</text>';
  FamilyTree.templates.hugo_custom_female.field_1 = '<text data-width="190" style="font-size: 14px;" fill="#ffffff" x="100" y="150" text-anchor="middle">{val}</text>';
}

const FamilyTreePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [maxGenerations, setMaxGenerations] = useState(2);
  const [focusUnion, setFocusUnion] = useState(null);
  const treeRef = useRef(null);
  const familyTreeInstance = useRef(null);

  // Initialize tree with root union
  useEffect(() => {
    loadRootUnion();
  }, []);

  // Load root union (Philip & Elizabeth)
  const loadRootUnion = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🌳 Loading root union...');
      const response = await axios.get(`${process.env.REACT_APP_API}/api/tree/root-union`);
      const rootUnion = response.data;

      console.log('✅ Root union loaded:', rootUnion);
      setFocusUnion(rootUnion.union_id);
      await loadTreeFromUnion(rootUnion.union_id);

    } catch (error) {
      console.error('❌ Error loading root union:', error);
      setError('Failed to load family tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load tree data from a union
  const loadTreeFromUnion = async (unionId, generations = maxGenerations) => {
    try {
      console.log(`🌳 Loading tree from union ${unionId}, ${generations} generations...`);

      const response = await axios.get(`${process.env.REACT_APP_API}/api/tree/descendants`, {
        params: {
          union_id: unionId,
          max_generations: generations,
          include_positions: false
        }
      });

      const { generations: generationsData, total_members, total_unions } = response.data;

      console.log(`✅ Loaded ${generationsData.length} generations, ${total_unions} unions, ${total_members} members`);
      console.log('📋 Generations data:', JSON.stringify(generationsData, null, 2));

      // Store tree info
      setTreeInfo({
        total_members,
        total_unions,
        generation_count: generationsData.length
      });

      // Convert to FamilyTree JS format and render
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        renderFamilyTree(generationsData);
      }, 100);

    } catch (error) {
      console.error('❌ Error loading tree:', error);
      setError('Failed to load tree data. Please try again.');
    }
  };

  // Convert API data to FamilyTree JS format
  const convertToFamilyTreeFormat = (generationsData) => {
    const nodes = [];
    const nodesMap = new Map(); // Use Map to track and update nodes

    // First pass: Create all partner nodes with their spouses
    generationsData.forEach((gen) => {
      gen.unions.forEach((union) => {
        // Skip Unknown partners (first_name === 'Unknown')
        const isPartner1Unknown = union.partner1.first_name === 'Unknown';
        const isPartner2Unknown = union.partner2.first_name === 'Unknown';

        // Add/update partner 1 (skip if Unknown)
        if (!isPartner1Unknown && !nodesMap.has(union.partner1.id)) {
          // Use profile_image_url if available, otherwise use a placeholder
          const profileImg = union.partner1.profile_image_url
                             ? `${process.env.REACT_APP_API}/${union.partner1.profile_image_url}`
                             : (union.partner1.gender?.toLowerCase() === 'female'
                                 ? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(union.partner1.first_name + ' ' + union.partner1.last_name) + '&background=fce7f3&color=ec4899&size=128'
                                 : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(union.partner1.first_name + ' ' + union.partner1.last_name) + '&background=dbeafe&color=3b82f6&size=128');

          // Format birth-death as a single field
          let birthDeath = '';
          if (union.partner1.birth_date && union.partner1.death_date) {
            birthDeath = `${new Date(union.partner1.birth_date).getFullYear()} - ${new Date(union.partner1.death_date).getFullYear()}`;
          } else if (union.partner1.birth_date) {
            birthDeath = new Date(union.partner1.birth_date).getFullYear().toString();
          } else if (union.partner1.death_date) {
            birthDeath = `- ${new Date(union.partner1.death_date).getFullYear()}`;
          }

          nodesMap.set(union.partner1.id, {
            id: union.partner1.id,
            name: `${union.partner1.first_name} ${union.partner1.last_name}`,
            gender: union.partner1.gender?.toLowerCase() || 'male',
            birth: birthDeath,
            pids: isPartner2Unknown ? [] : [union.partner2.id], // Don't link to Unknown partner
            img: profileImg,
          });
        } else if (!isPartner1Unknown) {
          // Person has multiple spouses - add to pids array (skip Unknown)
          const node = nodesMap.get(union.partner1.id);
          if (!isPartner2Unknown && !node.pids.includes(union.partner2.id)) {
            node.pids.push(union.partner2.id);
          }
        }

        // Add/update partner 2 (skip if Unknown)
        if (!isPartner2Unknown && !nodesMap.has(union.partner2.id)) {
          // Use profile_image_url if available, otherwise use a placeholder
          const profileImg = union.partner2.profile_image_url
                             ? `${process.env.REACT_APP_API}/${union.partner2.profile_image_url}`
                             : (union.partner2.gender?.toLowerCase() === 'female'
                               ? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(union.partner2.first_name + ' ' + union.partner2.last_name) + '&background=fce7f3&color=ec4899&size=128'
                               : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(union.partner2.first_name + ' ' + union.partner2.last_name) + '&background=dbeafe&color=3b82f6&size=128');

          // Format birth-death as a single field
          let birthDeath = '';
          if (union.partner2.birth_date && union.partner2.death_date) {
            birthDeath = `${new Date(union.partner2.birth_date).getFullYear()} - ${new Date(union.partner2.death_date).getFullYear()}`;
          } else if (union.partner2.birth_date) {
            birthDeath = new Date(union.partner2.birth_date).getFullYear().toString();
          } else if (union.partner2.death_date) {
            birthDeath = `- ${new Date(union.partner2.death_date).getFullYear()}`;
          }

          nodesMap.set(union.partner2.id, {
            id: union.partner2.id,
            name: `${union.partner2.first_name} ${union.partner2.last_name}`,
            gender: union.partner2.gender?.toLowerCase() || 'female',
            birth: birthDeath,
            pids: isPartner1Unknown ? [] : [union.partner1.id], // Don't link to Unknown partner
            img: profileImg,
          });
        } else if (!isPartner2Unknown) {
          // Person has multiple spouses - add to pids array (skip Unknown)
          const node = nodesMap.get(union.partner2.id);
          if (!isPartner1Unknown && !node.pids.includes(union.partner1.id)) {
            node.pids.push(union.partner1.id);
          }
        }
      });
    });

    // Second pass: Add children and parent references
    generationsData.forEach((gen) => {
      gen.unions.forEach((union) => {
        if (union.children && union.children.length > 0) {
          union.children.forEach((child) => {
            if (!nodesMap.has(child.id)) {
              // Determine mother and father based on gender
              const motherId = union.partner1.gender?.toLowerCase() === 'female' ? union.partner1.id : union.partner2.id;
              const fatherId = union.partner1.gender?.toLowerCase() === 'male' ? union.partner1.id : union.partner2.id;

              // Use profile_image_url if available, otherwise use a placeholder
              const profileImg = child.profile_image_url
                               ? `${process.env.REACT_APP_API}/${child.profile_image_url}`
                               : (child.gender?.toLowerCase() === 'female'
                                 ? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(child.first_name + ' ' + child.last_name) + '&background=fce7f3&color=ec4899&size=128'
                                 : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(child.first_name + ' ' + child.last_name) + '&background=dbeafe&color=3b82f6&size=128');

              // Format birth-death as a single field
              let birthDeath = '';
              if (child.birth_date && child.death_date) {
                birthDeath = `${new Date(child.birth_date).getFullYear()} - ${new Date(child.death_date).getFullYear()}`;
              } else if (child.birth_date) {
                birthDeath = new Date(child.birth_date).getFullYear().toString();
              } else if (child.death_date) {
                birthDeath = `- ${new Date(child.death_date).getFullYear()}`;
              }

              nodesMap.set(child.id, {
                id: child.id,
                name: `${child.first_name} ${child.last_name}`,
                gender: child.gender?.toLowerCase() || 'male',
                birth: birthDeath,
                mid: motherId,
                fid: fatherId,
                img: profileImg,
              });
            } else {
              // Child already exists as a partner - add parent info
              const node = nodesMap.get(child.id);
              const motherId = union.partner1.gender?.toLowerCase() === 'female' ? union.partner1.id : union.partner2.id;
              const fatherId = union.partner1.gender?.toLowerCase() === 'male' ? union.partner1.id : union.partner2.id;
              node.mid = motherId;
              node.fid = fatherId;
            }
          });
        }
      });
    });

    // Convert Map to Array
    return Array.from(nodesMap.values());
  };

  // Render FamilyTree JS
  const renderFamilyTree = (generationsData) => {
    if (!treeRef.current) {
      console.error('❌ Tree ref not available');
      return;
    }

    const nodes = convertToFamilyTreeFormat(generationsData);
    console.log('📊 Converted nodes:', nodes);

    // Debug: Show all nodes with their relationships
    console.log('🔍 DETAILED NODE ANALYSIS:');
    nodes.forEach((n, idx) => {
      console.log(`[${idx}] ${n.name} (id:${n.id}, gender:${n.gender}) - pids:[${n.pids || 'none'}] fid:${n.fid || 'none'} mid:${n.mid || 'none'}`);
    });

    // Destroy existing instance
    if (familyTreeInstance.current) {
      familyTreeInstance.current = null;
      treeRef.current.innerHTML = '';
    }

    // Create new FamilyTree instance
    try {
      familyTreeInstance.current = new FamilyTree(treeRef.current, {
        nodes: nodes,
        mode: 'light',
        template: 'hugo_custom',
        nodeBinding: {
          field_0: 'name',
          field_1: 'birth',
          img_0: 'img',
        },
        // Layout settings
        padding: 30,
        siblingSeparation: 80,
        subtreeSeparation: 120,
        levelSeparation: 100,
        orientation: FamilyTree.orientation.top,
        // Enable zoom and pan
        scaleInitial: 0.7,
        enableSearch: false,
        // Click handler to navigate to profile
        nodeMouseClick: FamilyTree.action.none,
        // Override background color
        backgroundColor: 'transparent',
      });

      // Add click event listener for navigation
      familyTreeInstance.current.on('click', function(sender, args) {
        if (args.node) {
          const memberId = args.node.id;
          console.log(`🖱️ Clicked on member ${memberId}`);
          // Navigate to member profile page
          window.location.href = `/members/${memberId}`;
        }
      });

      console.log(`✅ Rendered ${nodes.length} nodes in FamilyTree JS`);
    } catch (error) {
      console.error('❌ Error creating FamilyTree:', error);
      setError('Failed to render family tree');
    }
  };

  // Reset to root union
  const handleResetToRoot = () => {
    console.log('🏠 Resetting to root union...');
    loadRootUnion();
  };

  // Change generation count
  const handleGenerationChange = (newCount) => {
    setMaxGenerations(newCount);
    if (focusUnion) {
      loadTreeFromUnion(focusUnion, newCount);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading family tree...</p>
          <p className="text-gray-400 text-sm mt-2">Building your family connections</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRootUnion}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-3 flex items-center justify-between" style={{ position: 'relative', zIndex: 10 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">🌳 Family Tree</h1>
          {treeInfo && (
            <div className="flex gap-3 text-sm text-gray-600">
              <span className="bg-blue-100 px-2 py-1 rounded">
                {treeInfo.generation_count} generations
              </span>
              <span className="bg-purple-100 px-2 py-1 rounded">
                {treeInfo.total_unions} unions
              </span>
              <span className="bg-green-100 px-2 py-1 rounded">
                {treeInfo.total_members} members
              </span>
            </div>
          )}
        </div>

        {/* Generation selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Generations:</label>
          <select
            value={maxGenerations}
            onChange={(e) => handleGenerationChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>

          <button
            onClick={handleResetToRoot}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            title="Reset to root union"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Reset</span>
          </button>
        </div>
      </div>

      {/* Family Tree Container */}
      <div
        className="family-tree-canvas flex-1 relative overflow-hidden"
        style={{
          position: 'relative',
          zIndex: 5,
          backgroundColor: '#5F5556',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='a' gradientUnits='userSpaceOnUse' x1='100' y1='33' x2='100' y2='-3'%3E%3Cstop offset='0' stop-color='%23000' stop-opacity='0'/%3E%3Cstop offset='1' stop-color='%23000' stop-opacity='1'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' gradientUnits='userSpaceOnUse' x1='100' y1='135' x2='100' y2='97'%3E%3Cstop offset='0' stop-color='%23000' stop-opacity='0'/%3E%3Cstop offset='1' stop-color='%23000' stop-opacity='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg fill='%23524849' fill-opacity='0.6'%3E%3Crect x='100' width='100' height='100'/%3E%3Crect y='100' width='100' height='100'/%3E%3C/g%3E%3Cg fill-opacity='0.5'%3E%3Cpolygon fill='url(%23a)' points='100 30 0 0 200 0'/%3E%3Cpolygon fill='url(%23b)' points='100 100 0 130 0 100 200 100 200 130'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        <div ref={treeRef} className="w-full h-full" style={{ position: 'relative', zIndex: 10 }} />
      </div>
    </div>
  );
};

export default FamilyTreePage;
