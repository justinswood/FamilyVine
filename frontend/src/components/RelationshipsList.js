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
    
    return result;
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
                <span className="text-xs text-gray-400 ml-2">
                  ({relationship.direction}, {relationship.relationship_type})
                </span>
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