import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useNavigate, Link } from 'react-router-dom';
import { Home, X } from 'lucide-react';
import { usePreferences } from '../hooks/useQueries';

// Import the Greenhouse family tree
import { FamilyTreeView } from '../lib/familyvine-tree/react';
import { getResponsiveConfig } from '../lib/familyvine-tree/core/layout/LayoutConfig';
import '../lib/familyvine-tree/styles/family-tree.css';

/* ── Custom Vine Link SVG Icon ── */
const VineLinkIcon = ({ className = '' }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 14.5C10 16.9853 7.98528 19 5.5 19C3.01472 19 1 16.9853 1 14.5C1 12.0147 3.01472 10 5.5 10C6.5 10 7.4 10.3 8.1 10.9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M14 9.5C14 7.01472 16.0147 5 18.5 5C20.9853 5 23 7.01472 23 9.5C23 11.9853 20.9853 14 18.5 14C17.5 14 16.6 13.7 15.9 13.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 12L16 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="2 2"
    />
    <path
      d="M12 10C12 10 13 8 15 8"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

const FamilyTreePage = () => {
  const navigate = useNavigate();
  const { data: userPrefs } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [maxGenerations, setMaxGenerations] = useState(4);
  const [focusUnion, setFocusUnion] = useState(null);
  const [generationsData, setGenerationsData] = useState(null);
  const [timelineYear, setTimelineYear] = useState(null); // null = show all
  const [selectionMode, setSelectionMode] = useState(false); // Relationship Finder mode
  const [prefsApplied, setPrefsApplied] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Apply user preferences for generation depth
  useEffect(() => {
    if (userPrefs?.preferred_generation_depth && !prefsApplied) {
      setMaxGenerations(userPrefs.preferred_generation_depth);
    }
  }, [userPrefs, prefsApplied]);

  // Initialize tree with root union (or user's preferred root member)
  useEffect(() => {
    loadRootUnion();
  }, []);

  const loadRootUnion = async () => {
    try {
      setLoading(true);
      setError(null);

      const genDepth = userPrefs?.preferred_generation_depth || maxGenerations;

      // If user has a preferred root member, try to find their union
      if (userPrefs?.default_root_member_id) {
        try {
          const unionResp = await axios.get(`/api/tree/member/${userPrefs.default_root_member_id}/unions`);
          const unions = unionResp.data;
          if (unions && unions.length > 0) {
            setFocusUnion(unions[0].id);
            setPrefsApplied(true);
            await loadTreeFromUnion(unions[0].id, genDepth);
            return;
          }
        } catch (prefErr) {
          console.warn('Could not load preferred root member, falling back to default:', prefErr.message);
        }
      }

      // Default: load the root union
      const response = await axios.get('/api/tree/root-union');
      const rootUnion = response.data;

      setFocusUnion(rootUnion.union_id);
      setPrefsApplied(true);
      await loadTreeFromUnion(rootUnion.union_id, genDepth);

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
    <div className="h-screen relative" role="application" aria-label="Family tree visualization" style={{ backgroundColor: '#F9F8F3' }}>
      {/* ═══════════════════════════════════════════════════════════════════════
          THE CHRONOLOGY BAR — Archival Floating Ribbon Header
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="chronology-bar" role="toolbar" aria-label="Tree controls">
        {/* Left: Logo (links to homepage) */}
        <Link to="/" className="chronology-logo-link" title="Back to Home">
          <img src="/logo.png" alt="FamilyVine" className="chronology-logo" />
        </Link>

        {/* Center: Stats Badge only */}
        <div className="chronology-center">
          {treeInfo && (
            <div className="chronology-stats-badge">
              <span>{treeInfo.generation_count} generations</span>
              <span className="chronology-dot">•</span>
              <span>{treeInfo.total_unions} unions</span>
              <span className="chronology-dot">•</span>
              <span>{treeInfo.total_members} members</span>
            </div>
          )}
        </div>

        {/* Center-Right: Control Cluster */}
        <div className="chronology-controls">
          {/* Timeline Slider */}
          <div className="chronology-control-group">
            <label className="chronology-label">Timeline</label>
            <div className="chronology-slider-container">
              <input
                type="range"
                min={1900}
                max={2026}
                value={timelineYear || 2026}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTimelineYear(val >= 2026 ? null : val);
                }}
                aria-label={`Timeline filter: ${timelineYear || 'All years'}`}
                className="chronology-slider"
              />
              <span className="chronology-slider-value">
                {timelineYear || 'All'}
              </span>
            </div>
          </div>

          {/* Vine Link Find Relationship Button */}
          <button
            onClick={() => setSelectionMode(!selectionMode)}
            className={selectionMode ? 'btn-chronology-exit' : 'btn-find-relationship'}
            title={selectionMode ? 'Exit Relationship Finder' : 'Find Relationship Between Two Members'}
          >
            {selectionMode ? (
              <>
                <X className="w-2.5 h-2.5" />
                <span>Exit</span>
              </>
            ) : (
              <>
                <VineLinkIcon />
                <span>Find Relationship</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetToRoot}
            className="chronology-reset-btn"
            title="Reset to root union"
          >
            <Home className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Family Tree Container — positioned below the fixed Chronology Bar */}
      <div
        className="overflow-hidden"
        style={{
          position: 'absolute',
          top: isMobile ? '52px' : '68px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#F9F8F3'
        }}
      >
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
            config={getResponsiveConfig()}
            fitPadding={isMobile ? 20 : 80}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default FamilyTreePage;
