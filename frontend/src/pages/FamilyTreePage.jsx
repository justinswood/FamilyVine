import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { Home, Link2, X } from 'lucide-react';

// Import the Greenhouse family tree
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
  const [timelineYear, setTimelineYear] = useState(null); // null = show all
  const [selectionMode, setSelectionMode] = useState(false); // Relationship Finder mode

  // Initialize tree with root union
  useEffect(() => {
    loadRootUnion();
  }, []);

  // Load root union (Philip & Elizabeth)
  const loadRootUnion = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/tree/root-union');
      const rootUnion = response.data;

      setFocusUnion(rootUnion.union_id);
      await loadTreeFromUnion(rootUnion.union_id, maxGenerations);

    } catch (error) {
      console.error('Error loading root union:', error);
      setError('Failed to load family tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load tree data from a union
  const loadTreeFromUnion = async (unionId, generations) => {
    const genCount = generations !== undefined ? generations : maxGenerations;

    try {
      const response = await axios.get('/api/tree/descendants', {
        params: {
          union_id: unionId,
          max_generations: genCount,
          include_positions: false
        }
      });

      const { generations: gens, total_members, total_unions } = response.data;

      setGenerationsData(gens);
      setTreeInfo({
        total_members,
        total_unions,
        generation_count: gens.length
      });

    } catch (error) {
      console.error('Error loading tree:', error);
      setError('Failed to load tree data. Please try again.');
    }
  };

  // Reset to root union
  const handleResetToRoot = () => {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vine-leaf border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-vine-600 text-lg font-inter">Loading family tree...</p>
          <p className="text-vine-400 text-sm mt-2 font-inter">Building your family connections</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md border border-vine-200">
          <h2 className="text-2xl font-bold text-vine-dark mb-2 font-serif">Something went wrong</h2>
          <p className="text-vine-600 mb-4 font-inter">{error}</p>
          <button
            onClick={loadRootUnion}
            className="bg-vine-leaf text-white px-6 py-2 rounded-lg hover:bg-vine-dark transition font-inter"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F9F8F3' }}>
      {/* Header */}
      <div
        className="bg-vine-paper border-b border-vine-200 px-2 py-1 flex items-center justify-between shadow-sm"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <div className="flex items-center gap-1.5">
          <h1 className="text-xs font-bold text-vine-dark font-serif">Family Tree</h1>
          {treeInfo && (
            <div className="flex gap-1 font-inter" style={{ fontSize: '10px' }}>
              <span className="bg-vine-100 text-vine-600 px-1 py-0.5 rounded">
                {treeInfo.generation_count} gen
              </span>
              <span className="bg-vine-100 text-vine-600 px-1 py-0.5 rounded">
                {treeInfo.total_unions} unions
              </span>
              <span className="bg-vine-100 text-vine-600 px-1 py-0.5 rounded">
                {treeInfo.total_members} members
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Timeline slider */}
          <div className="flex items-center gap-1">
            <label className="text-vine-600 font-inter" style={{ fontSize: '10px' }}>Timeline:</label>
            <input
              type="range"
              min={1900}
              max={2026}
              value={timelineYear || 2026}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setTimelineYear(val >= 2026 ? null : val);
              }}
              className="w-16 accent-vine-leaf h-3"
            />
            <span className="font-inter text-vine-dark w-6 text-right tabular-nums" style={{ fontSize: '10px' }}>
              {timelineYear || 'All'}
            </span>
          </div>

          <div className="w-px h-3 bg-vine-200" />

          {/* Generation selector */}
          <label className="text-vine-600 font-inter" style={{ fontSize: '10px' }}>Gen:</label>
          <select
            value={maxGenerations}
            onChange={(e) => handleGenerationChange(parseInt(e.target.value))}
            className="border border-vine-300 rounded px-1.5 py-0.5 font-inter
                       bg-white text-vine-dark
                       focus:outline-none focus:ring-2 focus:ring-vine-leaf/40"
            style={{ fontSize: '10px' }}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>

          <button
            onClick={() => setSelectionMode(!selectionMode)}
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded transition font-inter ${
              selectionMode
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-white hover:opacity-90'
            }`}
            style={{
              fontSize: '10px',
              ...(!selectionMode && {
                background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              })
            }}
            title={selectionMode ? 'Exit Relationship Finder' : 'Find Relationship Between Two Members'}
          >
            {selectionMode ? (
              <>
                <X className="w-2.5 h-2.5" />
                <span>Exit Finder</span>
              </>
            ) : (
              <>
                <Link2 className="w-2.5 h-2.5" />
                <span>Find Relation</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetToRoot}
            className="flex items-center gap-0.5 bg-vine-leaf text-white px-2 py-0.5 rounded
                       hover:bg-vine-dark transition font-inter"
            style={{ fontSize: '10px' }}
            title="Reset to root union"
          >
            <Home className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Family Tree Container */}
      <div className="flex-1 relative overflow-hidden">
        {generationsData && (
          <FamilyTreeView
            data={generationsData}
            apiUrl={process.env.REACT_APP_API ?? ''}
            maxGenerations={maxGenerations}
            onNodeClick={handleNodeClick}
            showMiniMap={true}
            timelineYear={timelineYear}
            selectionMode={selectionMode}
            onSelectionModeChange={setSelectionMode}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default FamilyTreePage;
