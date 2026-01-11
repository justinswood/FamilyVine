/**
 * BasicExample - Simple demonstration of FamilyTreeView
 * Shows minimal setup with controls
 */

import React, { useState, useEffect } from 'react';
import { FamilyTreeView, useFamilyTree } from '../react';
import '../styles/family-tree.css';

const BasicExample = () => {
  const [data, setData] = useState(null);
  const {
    maxGenerations,
    setMaxGenerations,
    isLoading,
    setIsLoading,
    error,
    setError,
    treeStats,
    handleDataLoaded,
    handleError
  } = useFamilyTree(4);

  // Load data from API
  useEffect(() => {
    setIsLoading(true);
    fetch('http://localhost:5050/api/tree/generations')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load tree data');
        return res.json();
      })
      .then(result => {
        setData(result.generations || []);
        setIsLoading(false);
      })
      .catch(err => {
        handleError(err);
      });
  }, []);

  // Handle node click - navigate to member page
  const handleNodeClick = (memberId) => {
    console.log('Clicked member:', memberId);
    // In real app: navigate(`/member/${memberId}`)
    alert(`Clicked member ${memberId}`);
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading family tree...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h3>Error Loading Tree</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>No family tree data available</div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <label htmlFor="maxGen" style={styles.label}>
            Generations to Display:
          </label>
          <select
            id="maxGen"
            value={maxGenerations}
            onChange={(e) => setMaxGenerations(parseInt(e.target.value))}
            style={styles.select}
          >
            <option value={2}>2 Generations</option>
            <option value={3}>3 Generations</option>
            <option value={4}>4 Generations</option>
            <option value={5}>5 Generations</option>
            <option value={6}>6 Generations</option>
          </select>
        </div>

        {treeStats && (
          <div style={styles.stats}>
            <span style={styles.stat}>
              {treeStats.nodeCount} members
            </span>
            <span style={styles.stat}>
              {treeStats.maxGeneration} generations
            </span>
          </div>
        )}
      </div>

      {/* Tree */}
      <div style={styles.treeContainer}>
        <FamilyTreeView
          data={data}
          apiUrl="http://localhost:5050"
          maxGenerations={maxGenerations}
          onNodeClick={handleNodeClick}
          onDataLoaded={handleDataLoaded}
          onError={handleError}
          showMiniMap={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

// Inline styles for example
const styles = {
  wrapper: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a1a',
    color: '#ffffff'
  },
  controls: {
    padding: '20px',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500'
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none'
  },
  stats: {
    display: 'flex',
    gap: '20px'
  },
  stat: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  treeContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    color: '#ffffff'
  },
  loading: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  error: {
    textAlign: 'center',
    color: '#ef4444',
    padding: '40px'
  },
  empty: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.6)'
  }
};

export default BasicExample;
