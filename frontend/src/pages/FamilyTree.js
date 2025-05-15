import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const FamilyTree = () => {
  const { id } = useParams();
  const [treeData, setTreeData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchFamilyTree();
    }
  }, [id]);

  const fetchFamilyTree = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/relationships/tree/${id}`);
      setTreeData(response.data);
    } catch (error) {
      console.error('Error fetching family tree:', error);
      setError('Failed to load family tree');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading family tree...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        <p>{error}</p>
        <Link to="/members" className="text-blue-600 hover:underline">
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Family Tree</h1>
        <p className="text-gray-600">
          Showing family relationships up to 3 generations
        </p>
      </div>

      {treeData.nodes.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No family tree data available.</p>
          <p className="text-sm mt-2">Add some relationships to see the family tree.</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Found {treeData.nodes.length} family members with {treeData.edges.length} relationships
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Visual family tree representation will be implemented in the next phase.
              For now, you can see relationships on individual member pages.
            </p>
          </div>
          
          {/* Simple list view of the tree data */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">Family Members</h2>
              <div className="space-y-2">
                {treeData.nodes.map(node => (
                  <Link
                    key={node.id}
                    to={`/members/${node.id}`}
                    className="block p-2 hover:bg-gray-50 rounded border text-left"
                  >
                    <div className="flex items-center space-x-3">
                      {node.photo_url && (
                        <img
                          src={`${process.env.REACT_APP_API}/${node.photo_url}`}
                          alt={node.label}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span>{node.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">Relationships</h2>
              <div className="space-y-2 text-sm">
                {treeData.edges.map((edge, index) => {
                  const fromNode = treeData.nodes.find(n => n.id === edge.from);
                  const toNode = treeData.nodes.find(n => n.id === edge.to);
                  return (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <span className="font-medium">{fromNode?.first_name} {fromNode?.last_name}</span>
                      <span className="text-gray-600 mx-2">is {edge.label} of</span>
                      <span className="font-medium">{toNode?.first_name} {toNode?.last_name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTree;