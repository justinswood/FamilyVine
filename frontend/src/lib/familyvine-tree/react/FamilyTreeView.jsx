/**
 * FamilyTreeView - React rendering authority for the family tree.
 *
 * Replaces the vanilla-JS FamilyTree orchestrator with declarative JSX.
 * Layout is computed via useTreeLayout (data -> TreeModel -> WalkerLayout).
 * Pan/zoom is handled imperatively via usePanZoom (no re-renders during interaction).
 *
 * SVG layer order:
 *   1. SiblingGroupContainers (ghost dashed rects, back)
 *   2. TreeEdges (orthogonal connectors with collapse toggles)
 *   3. UnionUnits (couple cards)
 *   4. TreeNodes (single person cards, front)
 *
 * Features:
 *   - Ancestral Path Glow: hover a person to highlight their bloodline
 *   - Subtree Collapse: click toggle on descent lines to hide/show branches
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTreeLayout } from './useTreeLayout.js';
import { usePanZoom } from './usePanZoom.js';
import { useAncestralPath } from './useAncestralPath.js';
import TreeNode from './TreeNode.jsx';
import TreeEdge from './TreeEdge.jsx';
import AncestralGlowPath from './AncestralGlowPath.jsx';
import UnionUnit from './UnionUnit.jsx';
import SiblingGroupContainer from './SiblingGroupContainer.jsx';
import MiniMap from './MiniMap.jsx';
import UnionDetailCard from './UnionDetailCard.jsx';
import KinshipTooltip from './KinshipTooltip.jsx';
import RelationshipFinder from './RelationshipFinder.jsx';
import { getFullKinshipInfo } from './kinship.js';
import { VINE_COLORS } from '../greenhouse.js';
import '../styles/family-tree.css';

const FamilyTreeView = ({
  data,                    // Generations data from backend API
  apiUrl,                  // Base API URL for images
  maxGenerations = 4,      // Max generation depth
  onNodeClick,             // Callback: (memberId) => void
  showMiniMap = true,      // Show mini-map navigation
  config = {},             // Override layout config
  className = '',
  style = {},
  timelineYear,            // Timeline filter: show only members born <= this year
  onDataLoaded,            // Callback when data is loaded: (stats) => void
  onError,                 // Callback when error occurs: (error) => void
  selectionMode = false,   // Enable selection mode for Relationship Finder
  onSelectionModeChange,   // Callback when selection mode changes: (enabled) => void
}) => {
  // ----- Layout pipeline -----
  const { nodes, edges, siblingGroups, bounds, treeModel, unionUnits, singleNodes } = useTreeLayout(
    data, apiUrl, maxGenerations, config
  );

  // ----- Ancestral Path Glow -----
  const { activePath, setHoveredPerson, hoveredId } = useAncestralPath(nodes);
  const isPathActive = activePath.size > 0;

  // ----- Bloodline Chain (single direct path from hovered → root) -----
  // Prefers the blood-relative parent (one who has parents in the tree)
  // over married-in spouses, fixing the "shortcut through wrong spouse" bug.
  const { bloodlineChain, bloodlineSet } = useMemo(() => {
    if (!hoveredId || activePath.size === 0 || edges.length === 0 || nodes.length === 0) {
      return { bloodlineChain: [], bloodlineSet: new Set() };
    }

    const nMap = new Map();
    for (const node of nodes) nMap.set(node.id, node);

    // childId → edge lookup: identifies who is a "child" in the tree
    const c2e = new Map();
    for (const edge of edges) {
      for (const child of (edge.children || [])) {
        c2e.set(child.id, { edge, child });
      }
    }

    const chain = [];
    let curId = hoveredId;
    while (curId) {
      const node = nMap.get(curId);
      if (!node) break;
      chain.push(curId);

      const fatherOnPath = node.fatherId && activePath.has(node.fatherId);
      const motherOnPath = node.motherId && activePath.has(node.motherId);

      let nextId = null;
      if (fatherOnPath && motherOnPath) {
        // Both parents are ancestors — pick the blood-relative:
        // the one who is themselves a child in a higher-generation edge
        const fatherContinues = c2e.has(node.fatherId);
        const motherContinues = c2e.has(node.motherId);
        if (fatherContinues && !motherContinues) nextId = node.fatherId;
        else if (motherContinues && !fatherContinues) nextId = node.motherId;
        else nextId = node.fatherId; // both or neither — fallback
      } else if (fatherOnPath) {
        nextId = node.fatherId;
      } else if (motherOnPath) {
        nextId = node.motherId;
      }
      curId = nextId;
    }

    return { bloodlineChain: chain, bloodlineSet: new Set(chain) };
  }, [hoveredId, nodes, edges, activePath]);

  // ----- Founder detection (first-generation "Origin" members) -----
  const founderIds = useMemo(() => {
    if (nodes.length === 0) return new Set();
    let minGen = Infinity;
    for (const n of nodes) {
      if (n.generation < minGen) minGen = n.generation;
    }
    return new Set(
      nodes.filter(n => n.generation === minGen).map(n => n.id)
    );
  }, [nodes]);

  // ----- Kinship tooltip data -----
  const kinshipNodeMap = useMemo(
    () => treeModel ? treeModel.nodes : new Map(),
    [treeModel]
  );
  const kinshipRootIds = useMemo(
    () => treeModel ? treeModel.rootIds : [],
    [treeModel]
  );

  // ----- Timeline filter -----
  const timelineHiddenIds = useMemo(() => {
    if (!timelineYear) return new Set();
    const hidden = new Set();
    for (const node of nodes) {
      if (node.birthYear && node.birthYear > timelineYear) {
        hidden.add(node.id);
      }
    }
    return hidden;
  }, [nodes, timelineYear]);

  // ----- Pan / Zoom (imperative, no re-renders) -----
  const {
    svgRef,
    contentGroupRef,
    controllerRef,
    fitToView,
    centerOn,
    getTransform,
    setTransformChangeCallback,
  } = usePanZoom(config);

  // ----- Subtree Collapse state -----
  // Keyed by edge ID (e.g. "family-123-456")
  const [collapsedEdges, setCollapsedEdges] = useState(new Set());

  const toggleEdgeCollapse = useCallback((edgeId) => {
    setCollapsedEdges(prev => {
      const next = new Set(prev);
      if (next.has(edgeId)) {
        next.delete(edgeId);
      } else {
        next.add(edgeId);
      }
      return next;
    });
  }, []);

  // ----- Sibling group collapse (legacy, kept for compatibility) -----
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  const toggleGroup = useCallback((groupId) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // ----- Derive hidden node IDs -----
  // Compute all descendant IDs for collapsed edges
  const hiddenNodeIds = useMemo(() => {
    const hidden = new Set();

    // From sibling groups (legacy)
    for (const group of siblingGroups) {
      if (collapsedGroups.has(group.id)) {
        group.childNodeIds.forEach(nid => hidden.add(nid));
      }
    }

    // From collapsed edges: hide all children and their descendants
    if (collapsedEdges.size > 0 && treeModel) {
      for (const edge of edges) {
        if (collapsedEdges.has(edge.id)) {
          // Recursively hide all descendants of this edge's children
          const queue = (edge.children || []).map(c => c.id);
          while (queue.length > 0) {
            const id = queue.shift();
            if (hidden.has(id)) continue;
            hidden.add(id);
            // Get this node's children from the tree model
            const children = treeModel.getChildren(id);
            for (const child of children) {
              queue.push(child.id);
            }
          }
        }
      }
    }

    return hidden;
  }, [siblingGroups, collapsedGroups, collapsedEdges, edges, treeModel]);

  // ----- Filter visible nodes & edges -----
  const visibleNodes = useMemo(
    () => nodes.filter(n => !hiddenNodeIds.has(n.id)),
    [nodes, hiddenNodeIds]
  );

  // Union units: hide if any partner is hidden
  const visibleUnionUnits = useMemo(
    () => (unionUnits || []).filter(u => !u.partners.some(p => hiddenNodeIds.has(p.id))),
    [unionUnits, hiddenNodeIds]
  );

  // Single nodes: individuals not part of any union unit
  const visibleSingleNodes = useMemo(
    () => (singleNodes || []).filter(n => !hiddenNodeIds.has(n.id)),
    [singleNodes, hiddenNodeIds]
  );

  // Family connectors: filter out hidden children, keep collapsed edges (to show toggle)
  const visibleEdges = useMemo(
    () => edges.map(e => {
      const isCollapsed = collapsedEdges.has(e.id);
      if (isCollapsed) {
        // Keep edge with original children (for midY calc / toggle position)
        // TreeEdge will handle not drawing connector lines when collapsed
        return { ...e, _collapsed: true };
      }
      const visibleChildren = (e.children || []).filter(c => !hiddenNodeIds.has(c.id));
      if (visibleChildren.length === 0) return null;
      return { ...e, _collapsed: false };
    }).filter(Boolean),
    [edges, hiddenNodeIds, collapsedEdges]
  );

  // ----- Viewport state for MiniMap -----
  const [viewport, setViewport] = useState(null);
  const viewportTimerRef = useRef(null);

  useEffect(() => {
    setTransformChangeCallback((transform) => {
      if (viewportTimerRef.current) return;
      viewportTimerRef.current = setTimeout(() => {
        viewportTimerRef.current = null;
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        setViewport({
          x: -transform.panX / transform.zoom,
          y: -transform.panY / transform.zoom,
          width: rect.width / transform.zoom,
          height: rect.height / transform.zoom,
        });
      }, 80);
    });

    return () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    };
  }, [setTransformChangeCallback, svgRef]);

  // ----- Fit to view when bounds change -----
  const prevBoundsRef = useRef(null);

  useEffect(() => {
    if (!bounds) return;

    const prev = prevBoundsRef.current;
    if (
      prev &&
      prev.minX === bounds.minX &&
      prev.minY === bounds.minY &&
      prev.maxX === bounds.maxX &&
      prev.maxY === bounds.maxY
    ) {
      return;
    }
    prevBoundsRef.current = bounds;

    const timer = setTimeout(() => {
      fitToView(bounds, 80);
    }, 50);

    return () => clearTimeout(timer);
  }, [bounds, fitToView]);

  // ----- Notify parent when data is loaded -----
  useEffect(() => {
    if (nodes.length > 0 && onDataLoaded) {
      onDataLoaded({
        nodeCount: nodes.length,
        edgeCount: edges.length,
        siblingGroupCount: siblingGroups.length,
      });
    }
  }, [nodes.length, edges.length, siblingGroups.length, onDataLoaded]);

  // ----- Relationship Finder Selection -----
  const [selectedMemberA, setSelectedMemberA] = useState(null);
  const [selectedMemberB, setSelectedMemberB] = useState(null);
  const [showRelationshipFinder, setShowRelationshipFinder] = useState(false);

  // Compute kinship path when both members are selected
  const kinshipResult = useMemo(() => {
    if (!selectedMemberA || !selectedMemberB || !treeModel) return null;
    return getFullKinshipInfo(treeModel.nodes, selectedMemberA.id, selectedMemberB.id);
  }, [selectedMemberA, selectedMemberB, treeModel]);

  // Reset selection when selection mode is disabled
  useEffect(() => {
    if (!selectionMode) {
      setSelectedMemberA(null);
      setSelectedMemberB(null);
      setShowRelationshipFinder(false);
    }
  }, [selectionMode]);

  // Show relationship finder when both members are selected
  useEffect(() => {
    if (selectedMemberA && selectedMemberB) {
      setShowRelationshipFinder(true);
    }
  }, [selectedMemberA, selectedMemberB]);

  // ----- Node click bridge -----
  const handleNodeClick = useCallback((node) => {
    if (selectionMode) {
      // Selection mode: pick members for relationship finder
      if (!selectedMemberA) {
        setSelectedMemberA(node);
      } else if (!selectedMemberB && node.id !== selectedMemberA.id) {
        setSelectedMemberB(node);
      } else if (node.id === selectedMemberA.id) {
        // Clicking same member deselects it
        setSelectedMemberA(selectedMemberB);
        setSelectedMemberB(null);
      } else if (node.id === selectedMemberB?.id) {
        setSelectedMemberB(null);
      }
    } else {
      onNodeClick?.(node.id);
    }
  }, [onNodeClick, selectionMode, selectedMemberA, selectedMemberB]);

  // ----- MiniMap navigation -----
  const handleMiniMapNavigate = useCallback(({ x, y }) => {
    centerOn(x, y);
  }, [centerOn]);

  // ----- Union Detail Card -----
  const [activeUnionId, setActiveUnionId] = useState(null);

  const handleJunctionClick = useCallback(({ unionId }) => {
    if (unionId) {
      setActiveUnionId(unionId);
    }
  }, []);

  const handleCloseUnionCard = useCallback(() => {
    setActiveUnionId(null);
  }, []);

  const handleUnionMemberClick = useCallback((memberId) => {
    setActiveUnionId(null);
    onNodeClick?.(memberId);
  }, [onNodeClick]);

  // ----- Relationship Finder Handlers -----
  const handleCloseRelationshipFinder = useCallback(() => {
    setShowRelationshipFinder(false);
    setSelectedMemberA(null);
    setSelectedMemberB(null);
    onSelectionModeChange?.(false);
  }, [onSelectionModeChange]);

  const handleViewPath = useCallback((kinshipInfo) => {
    // Keep the path highlighted, close the modal
    setShowRelationshipFinder(false);
  }, []);

  // ----- Empty state -----
  if (!data || nodes.length === 0) {
    return (
      <div
        className={`fv-tree-wrapper flex items-center justify-center ${className}`}
        style={{ ...style, backgroundColor: VINE_COLORS.paper }}
      >
        <p className="text-vine-dark/40 font-inter text-lg">
          No family tree data to display.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`fv-tree-wrapper relative ${className}`}
      style={style}
    >
      {/* Main SVG canvas */}
      <svg
        ref={svgRef}
        className="fv-tree-svg"
        width="100%"
        height="100%"
        style={{ display: 'block', cursor: 'grab' }}
      >
        <g ref={contentGroupRef} className="fv-tree-content">
          {/* Layer 1: Sibling group ghost containers (back) */}
          {siblingGroups.map(group => (
            <SiblingGroupContainer
              key={group.id}
              group={group}
              collapsed={collapsedGroups.has(group.id)}
              onToggle={toggleGroup}
            />
          ))}

          {/* Layer 2: Edges with collapse toggles (middle) */}
          {visibleEdges.map(edge => (
            <TreeEdge
              key={edge.id}
              edge={edge}
              activePath={activePath}
              collapsed={collapsedEdges.has(edge.id)}
              onToggleCollapse={toggleEdgeCollapse}
              timelineHiddenIds={timelineHiddenIds}
            />
          ))}

          {/* Layer 2.5: Ancestral Glow Path (single continuous path, above connectors) */}
          {isPathActive && (
            <g className="ancestral-glow-layer" style={{ pointerEvents: 'none' }}>
              <AncestralGlowPath
                bloodlineChain={bloodlineChain}
                nodes={nodes}
                edges={edges}
              />
            </g>
          )}

          {/* Layer 3: Union Units (couples as single visual units) */}
          {visibleUnionUnits.map(unit => (
            <UnionUnit
              key={unit.id}
              unit={unit}
              onNodeClick={handleNodeClick}
              onJunctionClick={handleJunctionClick}
              activePath={activePath}
              bloodlineSet={bloodlineSet}
              isPathActive={isPathActive}
              onHover={setHoveredPerson}
              timelineHiddenIds={timelineHiddenIds}
              founderIds={founderIds}
              selectionMode={selectionMode}
              selectedMemberA={selectedMemberA}
              selectedMemberB={selectedMemberB}
              kinshipResult={kinshipResult}
            />
          ))}

          {/* Layer 4: Single Nodes (individuals without a partner) */}
          {visibleSingleNodes.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              onClick={handleNodeClick}
              isGlowing={activePath.has(node.id)}
              isBloodline={bloodlineSet.has(node.id)}
              isPathActive={isPathActive}
              onHover={setHoveredPerson}
              timelineHidden={timelineHiddenIds.has(node.id)}
              isFounder={founderIds.has(node.id)}
              selectionMode={selectionMode}
              isSelectedA={selectedMemberA?.id === node.id}
              isSelectedB={selectedMemberB?.id === node.id}
              isOnKinshipPath={kinshipResult?.fullPath?.includes(node.id)}
              isCommonAncestor={kinshipResult?.commonAncestorId === node.id}
            />
          ))}
        </g>
      </svg>

      {/* MiniMap overlay */}
      {showMiniMap && bounds && (
        <MiniMap
          nodes={visibleNodes}
          bounds={bounds}
          viewport={viewport}
          onNavigate={handleMiniMapNavigate}
        />
      )}

      {/* Union Detail Card modal */}
      {activeUnionId && (
        <UnionDetailCard
          unionId={activeUnionId}
          apiUrl={apiUrl}
          onClose={handleCloseUnionCard}
          onMemberClick={handleUnionMemberClick}
        />
      )}

      {/* Kinship tooltip (follows mouse cursor) */}
      {hoveredId && treeModel && !selectionMode && (
        <KinshipTooltip
          hoveredId={hoveredId}
          nodeMap={kinshipNodeMap}
          rootIds={kinshipRootIds}
        />
      )}

      {/* Selection mode indicator */}
      {selectionMode && !showRelationshipFinder && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'rgba(249, 248, 243, 0.95)',
            border: '2px solid var(--accent-gold, #D4AF37)',
            fontFamily: "'Inter', system-ui, sans-serif",
            zIndex: 100,
          }}
        >
          <p className="text-sm text-center" style={{ color: VINE_COLORS.dark }}>
            {!selectedMemberA
              ? 'Click on a family member to select them'
              : !selectedMemberB
              ? `Selected: ${selectedMemberA.firstName} ${selectedMemberA.lastName} — Click another member`
              : 'Computing relationship...'}
          </p>
        </div>
      )}

      {/* Relationship Finder Modal */}
      {showRelationshipFinder && selectedMemberA && selectedMemberB && (
        <RelationshipFinder
          memberA={selectedMemberA}
          memberB={selectedMemberB}
          nodeMap={kinshipNodeMap}
          onClose={handleCloseRelationshipFinder}
          onViewPath={handleViewPath}
          apiUrl={apiUrl}
        />
      )}
    </div>
  );
};

export default FamilyTreeView;
