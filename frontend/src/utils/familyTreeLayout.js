/**
 * Family Tree Layout Algorithm
 * Positions nodes in a proper hierarchical tree structure
 *
 * Layout structure:
 * - Generation 1 at top (y=0)
 * - Spouses side by side with union connector between them
 * - Children below, centered under their parent union connector
 * - Each subsequent generation spaced below
 */

// Layout constants
const GENERATION_HEIGHT = 250;  // Vertical space between generations
const SPOUSE_GAP = 30;          // Gap between spouses (connector goes here)
const NODE_WIDTH = 200;         // Width of person nodes
const NODE_HEIGHT = 155;        // Height of person nodes
const SIBLING_SPACING = 250;    // Horizontal space between siblings
const FAMILY_SPACING = 100;     // Extra space between different families

/**
 * Main layout function - calculates positions for all nodes
 */
export const calculateFamilyTreeLayout = (nodes, edges) => {
  console.log('🎯 Layout: Processing', nodes.length, 'nodes');

  // Separate person nodes from connector nodes
  const personNodes = nodes.filter(n => !n.data.isConnector);
  const connectorNodes = nodes.filter(n => n.data.isConnector);

  // Group person nodes by generation
  const generations = new Map();
  personNodes.forEach(node => {
    const gen = node.data.generation || 1;
    if (!generations.has(gen)) {
      generations.set(gen, []);
    }
    generations.get(gen).push(node);
  });

  // Sort generations
  const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b);
  console.log('📊 Generations:', sortedGens);

  // Track family positions for each generation
  const familyPositions = new Map(); // Map of connectorId -> { centerX, y }

  // STEP 1: Position Generation 1 (root generation)
  const gen1Nodes = generations.get(1) || [];
  if (gen1Nodes.length > 0) {
    positionRootGeneration(gen1Nodes, connectorNodes, familyPositions);
  }

  // STEP 2: Position subsequent generations based on parent positions
  for (let genNum = 2; genNum <= Math.max(...sortedGens); genNum++) {
    const genNodes = generations.get(genNum) || [];
    if (genNodes.length > 0) {
      positionChildGeneration(genNodes, connectorNodes, familyPositions, genNum, nodes);
    }
  }

  console.log('✅ Layout complete');
  return nodes;
};

/**
 * Position the root generation (generation 1)
 */
function positionRootGeneration(gen1Nodes, connectorNodes, familyPositions) {
  console.log('👑 Positioning root generation:', gen1Nodes.length, 'people');

  // Find all unique unions in generation 1
  const unions = findUnionsInGeneration(gen1Nodes, connectorNodes);
  const processedIds = new Set();

  let currentX = 0;
  const y = GENERATION_HEIGHT;

  unions.forEach((union, idx) => {
    const { partner1, partner2, connector } = union;

    // Position partner 1 (left)
    partner1.position = { x: currentX, y: y };
    processedIds.add(partner1.id);

    // Position connector (center)
    const connectorX = currentX + NODE_WIDTH + (SPOUSE_GAP / 2);
    if (connector) {
      connector.position = { x: connectorX, y: y + (NODE_HEIGHT / 2) };
      familyPositions.set(connector.id, { centerX: connectorX, y: y });
    }

    // Position partner 2 (right)
    if (partner2) {
      partner2.position = { x: currentX + NODE_WIDTH + SPOUSE_GAP, y: y };
      processedIds.add(partner2.id);
      currentX += (NODE_WIDTH * 2) + SPOUSE_GAP + FAMILY_SPACING;
    } else {
      // Single person
      currentX += NODE_WIDTH + FAMILY_SPACING;
    }
  });

  // Position any remaining singles
  gen1Nodes.forEach(node => {
    if (!processedIds.has(node.id)) {
      node.position = { x: currentX, y: y };
      currentX += NODE_WIDTH + FAMILY_SPACING;
    }
  });
}

/**
 * Position a child generation based on parent positions
 */
function positionChildGeneration(genNodes, connectorNodes, familyPositions, genNum, allNodes) {
  console.log(`👶 Positioning generation ${genNum}:`, genNodes.length, 'people');

  const y = genNum * GENERATION_HEIGHT;

  // Group children by their parent connector
  const childGroups = new Map();
  genNodes.forEach(node => {
    const parentConnectorId = node.data.parentConnectorId;
    if (parentConnectorId) {
      if (!childGroups.has(parentConnectorId)) {
        childGroups.set(parentConnectorId, []);
      }
      childGroups.get(parentConnectorId).push(node);
    }
  });

  // Position each group of siblings centered under their parent connector
  childGroups.forEach((children, connectorId) => {
    // Find parent connector position
    let parentCenterX;

    // Check if it's a connector node or a single parent (person node)
    const connectorNode = allNodes.find(n => n.id === connectorId);
    if (connectorNode && connectorNode.position) {
      parentCenterX = connectorNode.position.x;
    } else {
      // Fallback: use stored family position
      const familyPos = familyPositions.get(connectorId);
      parentCenterX = familyPos ? familyPos.centerX : 0;
    }

    // Calculate total width needed for children
    const totalChildWidth = (children.length * NODE_WIDTH) + ((children.length - 1) * (SIBLING_SPACING - NODE_WIDTH));
    const startX = parentCenterX - (totalChildWidth / 2);

    // Position each child
    children.forEach((child, idx) => {
      child.position = {
        x: startX + (idx * SIBLING_SPACING),
        y: y
      };
    });

    // Find and position connectors for this generation's unions
    const childUnions = findUnionsInGeneration(children, connectorNodes);
    childUnions.forEach(union => {
      if (union.connector) {
        const p1x = union.partner1.position.x;
        const p2x = union.partner2 ? union.partner2.position.x : p1x;
        const connectorX = (p1x + p2x + NODE_WIDTH) / 2;
        union.connector.position = { x: connectorX, y: y + (NODE_HEIGHT / 2) };
        familyPositions.set(union.connector.id, { centerX: connectorX, y: y });
      }
    });
  });

  // Handle nodes without parent connectors (shouldn't happen, but fallback)
  let fallbackX = 0;
  genNodes.forEach(node => {
    if (!node.position || (node.position.x === 0 && node.position.y === 0)) {
      node.position = { x: fallbackX, y: y };
      fallbackX += NODE_WIDTH + SIBLING_SPACING;
    }
  });
}

/**
 * Find all spouse pairs (unions) in a set of nodes
 */
function findUnionsInGeneration(genNodes, connectorNodes) {
  const unions = [];
  const processed = new Set();

  // Find connectors that belong to nodes in this generation
  connectorNodes.forEach(connector => {
    const partner1Id = String(connector.data.partner1Id);
    const partner2Id = String(connector.data.partner2Id);

    const partner1 = genNodes.find(n => n.id === partner1Id);
    const partner2 = genNodes.find(n => n.id === partner2Id);

    if (partner1 && !processed.has(partner1.id)) {
      unions.push({
        partner1: partner1,
        partner2: partner2 || null,
        connector: connector
      });
      processed.add(partner1.id);
      if (partner2) processed.add(partner2.id);
    }
  });

  // Add any singles (people not in a union)
  genNodes.forEach(node => {
    if (!processed.has(node.id)) {
      unions.push({
        partner1: node,
        partner2: null,
        connector: null
      });
      processed.add(node.id);
    }
  });

  return unions;
}

/**
 * Centers the entire tree in the viewport
 */
export const centerTree = (nodes) => {
  if (nodes.length === 0) return nodes;

  // Find bounding box (only consider positioned nodes)
  let minX = Infinity, maxX = -Infinity;

  nodes.forEach(node => {
    if (node.position && node.position.x !== undefined) {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
    }
  });

  if (minX === Infinity) return nodes;

  // Calculate center offset
  const centerX = (minX + maxX) / 2;
  const offsetX = -centerX + (NODE_WIDTH / 2);

  // Apply offset to center horizontally
  return nodes.map(node => ({
    ...node,
    position: node.position ? {
      x: node.position.x + offsetX,
      y: node.position.y
    } : { x: 0, y: 0 }
  }));
};
