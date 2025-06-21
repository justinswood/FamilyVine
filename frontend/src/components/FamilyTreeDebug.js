import React, { useEffect, useState } from 'react';

const FamilyTreeDebug = () => {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API || 'http://192.168.1.120:5000';
      
      const [membersResponse, relationshipsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/members`),
        fetch(`${API_BASE}/api/relationships`)
      ]);

      const membersData = await membersResponse.json();
      const relationshipsData = await relationshipsResponse.json();
      
      setMembers(membersData);
      setRelationships(relationshipsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Family Tree Debug Information</h1>
      
      <h2>Members ({members.length}):</h2>
      <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
        {members.slice(0, 10).map(member => (
          <div key={member.id} style={{ marginBottom: '10px', padding: '5px', background: '#f5f5f5' }}>
            <strong>{member.first_name} {member.last_name}</strong> (ID: {member.id})
            <br />Gender: {member.gender}, Born: {member.birth_year || 'Unknown'}
            <br />Alive: {member.is_alive ? 'Yes' : 'No'}
          </div>
        ))}
        {members.length > 10 && <div>... and {members.length - 10} more</div>}
      </div>

      <h2>Relationships ({relationships.length}):</h2>
      <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
        {relationships.slice(0, 20).map((rel, index) => {
          const member1 = members.find(m => m.id === rel.member1_id);
          const member2 = members.find(m => m.id === rel.member2_id);
          
          return (
            <div key={index} style={{ marginBottom: '5px', padding: '3px', background: '#f9f9f9' }}>
              <strong>{member1?.first_name} {member1?.last_name}</strong> is <strong>{rel.relationship_type}</strong> of <strong>{member2?.first_name} {member2?.last_name}</strong>
            </div>
          );
        })}
        {relationships.length > 20 && <div>... and {relationships.length - 20} more</div>}
      </div>

      <h2>Manning Family Specific:</h2>
      <div style={{ border: '1px solid #ccc', padding: '10px' }}>
        {(() => {
          const percy = members.find(m => 
            m.first_name?.toLowerCase().includes('percy') && 
            m.last_name?.toLowerCase().includes('manning')
          );
          const alice = members.find(m => 
            m.first_name?.toLowerCase().includes('alice') && 
            m.last_name?.toLowerCase().includes('manning')
          );
          
          return (
            <div>
              <div>Percy Manning: {percy ? `Found (ID: ${percy.id})` : 'Not found'}</div>
              <div>Alice Manning: {alice ? `Found (ID: ${alice.id})` : 'Not found'}</div>
              
              {percy && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Percy's relationships:</strong>
                  {relationships
                    .filter(rel => rel.member1_id === percy.id || rel.member2_id === percy.id)
                    .map(rel => {
                      const other = members.find(m => 
                        m.id === (rel.member1_id === percy.id ? rel.member2_id : rel.member1_id)
                      );
                      return (
                        <div key={rel.id}>
                          - {rel.relationship_type} of {other?.first_name} {other?.last_name}
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <h2>What kind of family tree do you want?</h2>
      <div style={{ border: '1px solid #ccc', padding: '10px', background: '#fff3cd' }}>
        <p>Please describe what you want to see:</p>
        <ul>
          <li>Traditional top-down tree (grandparents at top, kids below)?</li>
          <li>Side-by-side generations?</li>
          <li>Interactive with clickable nodes?</li>
          <li>Simple boxes with lines?</li>
          <li>Show photos in the tree?</li>
        </ul>
        <p><strong>Or upload an image/sketch of what you want the tree to look like!</strong></p>
      </div>
    </div>
  );
};

export default FamilyTreeDebug;