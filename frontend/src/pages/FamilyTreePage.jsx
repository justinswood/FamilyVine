import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

// Import the new custom family tree library
import { FamilyTreeView } from '../lib/familyvine-tree/react';
import '../lib/familyvine-tree/styles/family-tree.css';

const FamilyTreePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [maxGenerations, setMaxGenerations] = useState(4);
  const [focusUnion, setFocusUnion] = useState(null);
  const [generationsData, setGenerationsData] = useState(null);

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
      await loadTreeFromUnion(rootUnion.union_id, maxGenerations);

    } catch (error) {
      console.error('❌ Error loading root union:', error);
      setError('Failed to load family tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load tree data from a union
  const loadTreeFromUnion = async (unionId, generations) => {
    // Use provided generations or fall back to current state value
    const genCount = generations !== undefined ? generations : maxGenerations;

    try {
      console.log(`🌳 Loading tree from union ${unionId}, ${genCount} generations...`);

      const response = await axios.get(`${process.env.REACT_APP_API}/api/tree/descendants`, {
        params: {
          union_id: unionId,
          max_generations: genCount,
          include_positions: false
        }
      });

      const { generations: gens, total_members, total_unions } = response.data;

      console.log(`✅ Loaded ${gens.length} generations, ${total_unions} unions, ${total_members} members`);

      // Store generations data and tree info
      setGenerationsData(gens);
      setTreeInfo({
        total_members,
        total_unions,
        generation_count: gens.length
      });

    } catch (error) {
      console.error('❌ Error loading tree:', error);
      setError('Failed to load tree data. Please try again.');
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

  // Handle node click - navigate to member page
  const handleNodeClick = (memberId) => {
    if (memberId) {
      navigate(`/members/${memberId}`);
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
    <div className="h-screen flex flex-col">
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
      <div className="flex-1" style={{ position: 'relative' }}>
        {generationsData && (
          <FamilyTreeView
            data={generationsData}
            apiUrl={process.env.REACT_APP_API || 'http://localhost:5050'}
            maxGenerations={maxGenerations}
            onNodeClick={handleNodeClick}
            showMiniMap={true}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default FamilyTreePage;
