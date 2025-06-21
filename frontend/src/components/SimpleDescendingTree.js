import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const SimpleDescendingTree = () => {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const [showAddRelationModal, setShowAddRelationModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [availableOptions, setAvailableOptions] = useState([]);

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
      buildSimpleTree(membersResponse.data, relationshipsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildSimpleTree = (members, relationships) => {
    // Find Percy Manning Sr. and Alice Manning as the root ancestors
    const percyManning = members.find(m => 
      m.first_name?.toLowerCase().includes('percy') && 
      m.last_name?.toLowerCase().includes('manning')
    );
    
    const aliceManning = members.find(m => 
      m.first_name?.toLowerCase().includes('alice') && 
      m.last_name?.toLowerCase().includes('manning')
    );

    if (!percyManning && !aliceManning) {
      // If we can't find the root ancestors, just show all members
      setTreeData([{ generation: 0, members: members }]);
      return;
    }

    // Start with the root couple
    const rootGeneration = [];
    if (percyManning) rootGeneration.push(percyManning);
    if (aliceManning && aliceManning.id !== percyManning?.id) rootGeneration.push(aliceManning);

    const generations = [{ generation: 0, members: rootGeneration }];
    const processedMembers = new Set(rootGeneration.map(m => m.id));

    // Find their children and descendants
    let currentGeneration = 0;
    let hasMoreGenerations = true;

    while (hasMoreGenerations && currentGeneration < 5) { // Limit to 5 generations
      const currentGenMembers = generations[currentGeneration].members;
      const nextGenMembers = [];

      currentGenMembers.forEach(parent => {
        // Find all children of this parent
        const children = relationships
          .filter(rel => 
            rel.member1_id === parent.id && 
            (rel.relationship_type === 'father' || rel.relationship_type === 'mother')
          )
          .map(rel => members.find(m => m.id === rel.member2_id))
          .filter(child => child && !processedMembers.has(child.id));

        children.forEach(child => {
          if (!processedMembers.has(child.id)) {
            nextGenMembers.push(child);
            processedMembers.add(child.id);

            // IMPORTANT: Also add the child's spouse if they have one
            const spouseRel = relationships.find(rel => 
              ((rel.member1_id === child.id || rel.member2_id === child.id) &&
               (rel.relationship_type === 'husband' || rel.relationship_type === 'wife' || rel.relationship_type === 'spouse'))
            );

            if (spouseRel) {
              const spouseId = spouseRel.member1_id === child.id ? spouseRel.member2_id : spouseRel.member1_id;
              const spouse = members.find(m => m.id === spouseId);
              
              if (spouse && !processedMembers.has(spouse.id)) {
                nextGenMembers.push(spouse);
                processedMembers.add(spouse.id);
              }
            }
          }
        });
      });

      if (nextGenMembers.length > 0) {
        generations.push({ 
          generation: currentGeneration + 1, 
          members: nextGenMembers 
        });
        currentGeneration++;
      } else {
        hasMoreGenerations = false;
      }
    }

    setTreeData(generations);
  };

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
    if (member.birth_date) {
      return new Date(member.birth_date).getFullYear();
    }
    return null;
  };

  const getDeathYear = (member) => {
    if (member.death_date) {
      return new Date(member.death_date).getFullYear();
    }
    return null;
  };

  // Check what relationships already exist for a member
  const getExistingRelationships = (memberId) => {
    return relationships.filter(rel => 
      rel.member1_id === memberId || rel.member2_id === memberId
    );
  };

  // Check what relationship options are available for a member
  const getAvailableRelationshipOptions = (member) => {
    const existing = getExistingRelationships(member.id);
    const options = [];

    // Check for parents
    const hasParents = existing.some(rel => 
      (rel.member2_id === member.id && (rel.relationship_type === 'father' || rel.relationship_type === 'mother'))
    );
    
    if (!hasParents) {
      options.push({ type: 'parent', label: 'Add Parent' });
    }

    // Check for spouse
    const hasSpouse = existing.some(rel => 
      rel.relationship_type === 'husband' || rel.relationship_type === 'wife' || rel.relationship_type === 'spouse'
    );
    
    if (!hasSpouse) {
      options.push({ type: 'spouse', label: 'Add Spouse/Partner' });
    }

    // Always allow adding children
    options.push({ type: 'child', label: 'Add Child' });

    // Check for siblings (always allow more siblings)
    options.push({ type: 'sibling', label: 'Add Sibling' });

    return options;
  };

  // Handle opening the add relationship modal
  const handleAddRelationship = (member) => {
    const options = getAvailableRelationshipOptions(member);
    setSelectedMember(member);
    setAvailableOptions(options);
    setShowAddRelationModal(true);
  };

  // Handle relationship type selection
  const handleRelationshipTypeSelect = (option) => {
    setShowAddRelationModal(false);
    // Redirect to add member page with relationship context
    const relationshipParam = encodeURIComponent(JSON.stringify({
      type: option.type,
      targetMemberId: selectedMember.id,
      targetMemberName: getDisplayName(selectedMember)
    }));
    window.location.href = `/add?relationship=${relationshipParam}`;
  };

  // Check if two members are spouses
  const areSpouses = (member1Id, member2Id) => {
    return relationships.some(rel => 
      ((rel.member1_id === member1Id && rel.member2_id === member2Id) ||
       (rel.member1_id === member2Id && rel.member2_id === member1Id)) &&
      (rel.relationship_type === 'husband' || rel.relationship_type === 'wife' || rel.relationship_type === 'spouse')
    );
  };

  // Check if any two members in a generation are spouses
  const hasSpouseInGeneration = (generation) => {
    const members = generation.members;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (areSpouses(members[i].id, members[j].id)) {
          return true;
        }
      }
    }
    return false;
  };

  // Get the positions of spouse pairs in a generation
  const getSpousePairs = (generation) => {
    const members = generation.members;
    const pairs = [];
    
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (areSpouses(members[i].id, members[j].id)) {
          pairs.push({ member1: i, member2: j });
        }
      }
    }
    return pairs;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading family tree...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Manning Family Tree</h1>
        <p className="text-gray-600">A simple descending family tree</p>
      </div>

      {treeData.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No family tree data available.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full relative">
            {treeData.map((generation, genIndex) => (
              <div key={genIndex} className="mb-16 relative">
                {/* Generation Label */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-gray-700">
                    {genIndex === 0 ? 'Ancestors' : `Generation ${genIndex + 1}`}
                  </h2>
                </div>

                {/* Members Row */}
                <div className="flex justify-center items-start gap-8 flex-wrap relative">
                  {/* Spouse connection lines for all spouse pairs */}
                  {getSpousePairs(generation).map((pair, pairIndex) => {
                    const distance = Math.abs(pair.member2 - pair.member1) * 14; // 14rem = card width + gap
                    const offset = ((pair.member1 + pair.member2) / 2 - (generation.members.length - 1) / 2) * 14;
                    
                    return (
                      <div 
                        key={`spouse-line-${pairIndex}`}
                        className="absolute top-20 z-0"
                        style={{
                          left: `calc(50% + ${offset}rem)`,
                          transform: 'translateX(-50%)',
                          width: `${distance}rem`
                        }}
                      >
                        <div className="h-1 bg-purple-500 rounded-full shadow-sm w-full"></div>
                      </div>
                    );
                  })}

                  {generation.members.map((member, memberIndex) => (
                    <div key={member.id} className="flex flex-col items-center relative z-10">
                      {/* Vertical line going down from parent */}
                      {genIndex < treeData.length - 1 && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-blue-500 z-0"></div>
                      )}

                      {/* Connection Lines */}
                      {genIndex > 0 && (
                        <div className="w-0.5 h-8 bg-blue-500 mb-4"></div>
                      )}

                      {/* Member Card */}
                      <div className="relative group">
                        {/* Add Relationship Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddRelationship(member);
                          }}
                          className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-700 z-10"
                          title="Add family relationship"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>

                        <Link 
                          to={`/members/${member.id}`}
                          className="block transition-transform hover:scale-105"
                        >
                        <div className="bg-white rounded-lg shadow-md p-4 w-48 border border-gray-200 hover:shadow-lg transition-shadow">
                          {/* Photo */}
                          <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100">
                            {getPhotoUrl(member) ? (
                              <img
                                src={getPhotoUrl(member)}
                                alt={getDisplayName(member)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <h3 className="text-center font-semibold text-gray-800 mb-1 text-sm">
                            {getDisplayName(member)}
                          </h3>

                          {/* Birth/Death Years */}
                          <div className="text-center text-xs text-gray-600">
                            {getBirthYear(member) && (
                              <div>
                                {getBirthYear(member)}
                                {getDeathYear(member) && ` - ${getDeathYear(member)}`}
                                {!getDeathYear(member) && member.is_alive === false && ' - ?'}
                              </div>
                            )}
                          </div>

                          {/* Location */}
                          {member.location && (
                            <div className="text-center text-xs text-gray-500 mt-1">
                              {member.location}
                            </div>
                          )}
                        </div>
                        </Link>
                      </div>

                      {/* Connection line to next generation */}
                      {genIndex < treeData.length - 1 && 
                       treeData[genIndex + 1].members.length > 0 && (
                        <div className="w-0.5 h-8 bg-gray-400 mt-4"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Remove old connection line code */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Relationship Modal */}
      {showAddRelationModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddRelationModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add Family Relationship</h2>
              <button
                onClick={() => setShowAddRelationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">
                Add a family relationship for{' '}
                <span className="font-semibold">{getDisplayName(selectedMember)}</span>
              </p>
            </div>

            <div className="space-y-2">
              {availableOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleRelationshipTypeSelect(option)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-800">{option.label}</div>
                  <div className="text-sm text-gray-500">
                    {option.type === 'parent' && 'Add a parent (mother or father)'}
                    {option.type === 'spouse' && 'Add a spouse or partner'}
                    {option.type === 'child' && 'Add a son or daughter'}
                    {option.type === 'sibling' && 'Add a brother or sister'}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAddRelationModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-12 text-center">
        <div className="inline-block bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Family Tree Guide</h3>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-400"></div>
              <span>Family connections</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded-full"></div>
              <span>Click to view details</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>Hover to add relationships</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDescendingTree;