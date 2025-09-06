import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const RelationshipsList = ({ memberId }) => {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRelationships();
  }, [memberId]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/relationships/member/${memberId}`);
      
      console.log('Raw relationships for member', memberId, ':', response.data);
      
      // Prioritize outgoing relationships over incoming ones
      const processedRelationships = processRelationships(response.data);
      console.log('Processed relationships:', processedRelationships);
      
      setRelationships(processedRelationships);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      setError('Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const processRelationships = (relationships) => {
    // Group relationships by the other person
    const relationshipsByPerson = {};
    
    relationships.forEach(rel => {
      const otherPersonId = rel.direction === 'outgoing' ? rel.member2_id : rel.member1_id;
      
      if (!relationshipsByPerson[otherPersonId]) {
        relationshipsByPerson[otherPersonId] = [];
      }
      relationshipsByPerson[otherPersonId].push(rel);
    });
    
    // For each person, prefer outgoing relationships
    const result = [];
    for (const personId in relationshipsByPerson) {
      const rels = relationshipsByPerson[personId];
      
      // Try to find an outgoing relationship first
      const outgoing = rels.find(r => r.direction === 'outgoing');
      if (outgoing) {
        console.log(`Using outgoing relationship: ${outgoing.relationship_type} to ${outgoing.related_first_name}`);
        result.push(outgoing);
      } else {
        // If no outgoing, use incoming but fix the display
        const incoming = rels[0];
        console.log(`Using incoming relationship: ${incoming.relationship_type} from ${incoming.related_first_name}`);
        result.push(incoming);
      }
    }
    
    // NEW: Combine parent relationships
    return combineParentRelationships(result);
  };

  const combineParentRelationships = (relationships) => {
    console.log('🔍 Attempting to combine parent relationships from:', relationships);
    
    // Find parent relationships - look for outgoing daughter/son relationships
    const parentRelationships = relationships.filter(rel => {
      // For outgoing relationships, check if this person is daughter/son to someone
      if (rel.direction === 'outgoing' && (rel.relationship_type === 'daughter' || rel.relationship_type === 'son')) {
        console.log(`Found parent relationship: This person is ${rel.relationship_type} of ${rel.related_first_name}`);
        return true;
      }
      return false;
    });
    
    console.log('Found parent relationships:', parentRelationships);
    
    // If we have exactly 2 parent relationships, combine them
    if (parentRelationships.length === 2) {
      const parent1 = parentRelationships[0];
      const parent2 = parentRelationships[1];
      
      // Try to determine the gender to display in correct order (traditional father first)
      const getParentInfo = (parentRel) => ({
        name: `${parentRel.related_first_name} ${parentRel.related_last_name}`,
        id: parentRel.member2_id, // For outgoing relationships, the parent is member2
        photo: parentRel.related_photo_url,
        relationshipType: parentRel.relationship_type,
        firstName: parentRel.related_first_name
      });
      
      const p1 = getParentInfo(parent1);
      const p2 = getParentInfo(parent2);
      
      // Try to put father first if we can determine gender from the parent's name or relationship context
      let firstParent = p1;
      let secondParent = p2;
      
      // Since we can't determine gender from daughter/son relationship type,
      // let's try basic name-based detection (not perfect but better than random)
      const maleNames = ['percy', 'frank', 'alonzo', 'justin', 'steven', 'brian', 'dimitri', 'richard'];
      const femaleNames = ['alice', 'ruth', 'hazel', 'debra', 'shanna', 'priya'];
      
      const p1FirstLower = p1.firstName.toLowerCase();
      const p2FirstLower = p2.firstName.toLowerCase();
      
      if (femaleNames.includes(p1FirstLower) && maleNames.includes(p2FirstLower)) {
        firstParent = p2; // father first
        secondParent = p1; // mother second
      }
      
      // Create a combined parent relationship with specific gender
      const relationshipText = parent1.relationshipType === 'daughter' ? 'daughter of' : 
                               parent1.relationshipType === 'son' ? 'son of' : 'child of';
      
      const combinedRelationship = {
        id: `combined-parents-${parent1.id}-${parent2.id}`,
        isCombined: true,
        parent1: firstParent,
        parent2: secondParent,
        relationshipText: relationshipText // This will display as "daughter of Parent1 and Parent2"
      };
      
      console.log('✅ Created combined parent relationship:', combinedRelationship);
      
      // Remove individual parent relationships and add combined one
      const nonParentRelationships = relationships.filter(rel => 
        !parentRelationships.includes(rel)
      );
      
      return [...nonParentRelationships, combinedRelationship];
    }
    
    return relationships;
  };

  const formatRelationshipDisplayBasic = (relationship) => {
    if (relationship.direction === 'outgoing') {
      return {
        relatedPerson: `${relationship.related_first_name} ${relationship.related_last_name}`,
        relationshipText: `${relationship.relationship_type} of`,
        personId: relationship.member2_id
      };
    } else {
      const reverseMap = {
        'daughter': 'mother of',
        'son': 'mother of',
        'father': 'child of',
        'mother': 'child of', 
        'sister': 'sibling of',
        'brother': 'sibling of',
        'wife': 'spouse of',
        'husband': 'spouse of',
        'grandson': 'grandparent of',
        'granddaughter': 'grandparent of',
        'grandfather': 'grandchild of',
        'grandmother': 'grandchild of',
        'niece': 'uncle/aunt of',
        'nephew': 'uncle/aunt of',
        'uncle': 'niece/nephew of',
        'aunt': 'niece/nephew of',
        'cousin': 'cousin of'
      };
      
      const displayText = reverseMap[relationship.relationship_type] || `${relationship.relationship_type} of`;
      
      return {
        relatedPerson: `${relationship.related_first_name} ${relationship.related_last_name}`,
        relationshipText: displayText,
        personId: relationship.member1_id
      };
    }
  };

  const handleDeleteRelationship = async (relationshipId) => {
    if (!window.confirm('Are you sure you want to delete this relationship?')) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_API}/api/relationships/${relationshipId}`);
      fetchRelationships(); // Refresh the list
    } catch (error) {
      console.error('Error deleting relationship:', error);
      alert('Failed to delete relationship');
    }
  };

  const formatRelationshipDisplay = (relationship) => {
    if (relationship.direction === 'outgoing') {
      // This member is [relationship_type] to the related member
      // Example: "I am the mother of John"
      return {
        relatedPerson: `${relationship.related_first_name} ${relationship.related_last_name}`,
        relationshipText: `${relationship.relationship_type} of`,
        personId: relationship.member2_id
      };
    } else {
      // The related member is [relationship_type] to this member
      // We need to reverse the perspective
      
      // If they are my daughter, I am their parent (but we want to show mother/father)
      // If they are my son, I am their parent (but we want to show mother/father)
      
      const reverseMap = {
        'daughter': 'mother of', // If they are my daughter, show "mother of [name]"
        'son': 'mother of',      // If they are my son, show "mother of [name]" (we'll fix gender later)
        'father': 'child of',    // If they are my father, show "child of [name]"
        'mother': 'child of',    // If they are my mother, show "child of [name]" 
        'sister': 'sibling of',  // If they are my sister, show "sibling of [name]"
        'brother': 'sibling of', // If they are my brother, show "sibling of [name]"
        'wife': 'spouse of',     // If they are my wife, show "spouse of [name]"
        'husband': 'spouse of',  // If they are my husband, show "spouse of [name]"
        'grandson': 'grandparent of',  // If they are my grandson, show "grandparent of [name]"
        'granddaughter': 'grandparent of', // If they are my granddaughter, show "grandparent of [name]"
        'grandfather': 'grandchild of',    // If they are my grandfather, show "grandchild of [name]"
        'grandmother': 'grandchild of',    // If they are my grandmother, show "grandchild of [name]"
        'niece': 'uncle/aunt of',          // If they are my niece, show "uncle/aunt of [name]"
        'nephew': 'uncle/aunt of',         // If they are my nephew, show "uncle/aunt of [name]"
        'uncle': 'niece/nephew of',        // If they are my uncle, show "niece/nephew of [name]"
        'aunt': 'niece/nephew of',         // If they are my aunt, show "niece/nephew of [name]"
        'cousin': 'cousin of'              // If they are my cousin, show "cousin of [name]"
      };
      
      const displayText = reverseMap[relationship.relationship_type] || `${relationship.relationship_type} of`;
      
      return {
        relatedPerson: `${relationship.related_first_name} ${relationship.related_last_name}`,
        relationshipText: displayText,
        personId: relationship.member1_id
      };
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading relationships...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  if (relationships.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No relationships added yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {relationships.map((relationship) => {
        // Handle combined parent relationship
        if (relationship.isCombined) {
          return (
            <div key={relationship.id} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-3">
                {/* Show both parent photos */}
                <div className="flex -space-x-2">
                  {relationship.parent1.photo && (
                    <img
                      src={`${process.env.REACT_APP_API}/${relationship.parent1.photo}`}
                      alt={relationship.parent1.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  )}
                  {relationship.parent2.photo && (
                    <img
                      src={`${process.env.REACT_APP_API}/${relationship.parent2.photo}`}
                      alt={relationship.parent2.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  )}
                  {/* If no photos, show a family icon */}
                  {!relationship.parent1.photo && !relationship.parent2.photo && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-200 to-purple-200 flex items-center justify-center text-blue-700 text-sm font-bold border-2 border-white shadow-sm">
                      👨‍👩
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-gray-600 font-medium">{relationship.relationshipText} </span>
                  <Link 
                    to={`/members/${relationship.parent1.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                  >
                    {relationship.parent1.name}
                  </Link>
                  <span className="text-gray-600 font-medium"> and </span>
                  <Link 
                    to={`/members/${relationship.parent2.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                  >
                    {relationship.parent2.name}
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-600 italic font-medium bg-white px-2 py-1 rounded-full">
                  👨‍👩‍👧‍👦 Parents
                </span>
              </div>
            </div>
          );
        }
        
        // Handle regular relationships
        const display = formatRelationshipDisplay(relationship);
        
        return (
          <div key={relationship.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
            <div className="flex items-center space-x-3">
              {relationship.related_photo_url && (
                <img
                  src={`${process.env.REACT_APP_API}/${relationship.related_photo_url}`}
                  alt={display.relatedPerson}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div>
                <span className="text-gray-600">{display.relationshipText} </span>
                <Link 
                  to={`/members/${display.personId}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {display.relatedPerson}
                </Link>
              </div>
            </div>
            
            <button
              onClick={() => handleDeleteRelationship(relationship.id)}
              className="text-red-600 hover:text-red-800 text-sm"
              title="Delete relationship"
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default RelationshipsList;