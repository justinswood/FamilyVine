/**
 * Family Tree Data Transformer
 * Converts backend API data to ReactFlow format with proper hierarchical structure
 *
 * Key approach:
 * - Creates "union connector" nodes between spouse pairs
 * - Routes parent-child edges through union connectors (not from both parents)
 * - This eliminates crossing lines and creates a proper tree structure
 */

// Node dimensions for layout calculations
const NODE_WIDTH = 200;
const NODE_HEIGHT = 155;

/**
 * Converts generations data from backend to ReactFlow nodes and edges
 * @param {Array} generationsData - Array of generation objects from backend API
 * @param {string} apiUrl - Base API URL for building image paths
 * @returns {Object} { nodes: Array, edges: Array } - ReactFlow format
 */
export const convertToReactFlow = (generationsData, apiUrl) => {
  const nodes = [];
  const edges = [];
  const personNodesMap = new Map(); // Track person nodes by ID
  const unionConnectors = new Map(); // Track union connector nodes
  const processedUnions = new Set(); // Avoid duplicate union processing

  console.log('🔄 Converting', generationsData.length, 'generations to ReactFlow format');

  // PASS 1: Create all person nodes and union connector nodes
  generationsData.forEach((gen) => {
    gen.unions.forEach((union) => {
      const unionKey = `union-${union.partner1.id}-${union.partner2.id}`;
      if (processedUnions.has(unionKey)) return;
      processedUnions.add(unionKey);

      const isPartner1Unknown = union.partner1.first_name === 'Unknown';
      const isPartner2Unknown = union.partner2.first_name === 'Unknown';
      const isSingleParent = union.is_single_parent || union.partner1.id === union.partner2.id;

      // Create partner 1 node (skip if Unknown)
      if (!isPartner1Unknown && !personNodesMap.has(union.partner1.id)) {
        const node = createPersonNode(union.partner1, gen.generation, apiUrl);
        personNodesMap.set(union.partner1.id, node);
        nodes.push(node);
      }

      // Create partner 2 node (skip if Unknown or single parent)
      if (!isPartner2Unknown && !isSingleParent && !personNodesMap.has(union.partner2.id)) {
        const node = createPersonNode(union.partner2, gen.generation, apiUrl);
        personNodesMap.set(union.partner2.id, node);
        nodes.push(node);
      }

      // Create union connector node (invisible node between spouses)
      // This is the key to proper tree routing!
      if (!isSingleParent && !isPartner1Unknown && !isPartner2Unknown) {
        const connectorId = `connector-${union.partner1.id}-${union.partner2.id}`;
        const connectorNode = {
          id: connectorId,
          type: 'unionConnector', // Custom invisible node type
          position: { x: 0, y: 0 }, // Will be calculated by layout
          data: {
            generation: gen.generation,
            partner1Id: union.partner1.id,
            partner2Id: union.partner2.id,
            isConnector: true
          }
        };
        unionConnectors.set(connectorId, connectorNode);
        nodes.push(connectorNode);

        // Create spouse edges (partner1 → connector, partner2 → connector)
        edges.push({
          id: `spouse-${union.partner1.id}-connector`,
          source: String(union.partner1.id),
          target: connectorId,
          sourceHandle: 'spouse-right',
          targetHandle: 'left',
          type: 'spouse',
          style: { stroke: '#ffffff', strokeWidth: 4 }
        });
        edges.push({
          id: `spouse-connector-${union.partner2.id}`,
          source: connectorId,
          target: String(union.partner2.id),
          sourceHandle: 'right',
          targetHandle: 'spouse-left',
          type: 'spouse',
          style: { stroke: '#ffffff', strokeWidth: 4 }
        });
      }

      // Store union info for child processing
      if (union.children && union.children.length > 0) {
        const connectorId = isSingleParent
          ? String(union.partner1.id)  // Single parent: children connect directly to parent
          : `connector-${union.partner1.id}-${union.partner2.id}`;

        union.children.forEach((child) => {
          if (!personNodesMap.has(child.id)) {
            const childNode = createPersonNode(child, gen.generation + 1, apiUrl);
            childNode.data.parentConnectorId = connectorId;
            childNode.data.unionParent1Id = union.partner1.id;
            childNode.data.unionParent2Id = isSingleParent ? null : union.partner2.id;
            personNodesMap.set(child.id, childNode);
            nodes.push(childNode);
          } else {
            // Child already exists (as a partner in another union)
            const existingNode = personNodesMap.get(child.id);
            existingNode.data.parentConnectorId = connectorId;
            existingNode.data.unionParent1Id = union.partner1.id;
            existingNode.data.unionParent2Id = isSingleParent ? null : union.partner2.id;
          }
        });
      }
    });
  });

  // PASS 2: Create parent-child edges (from union connector to children)
  nodes.forEach(node => {
    if (node.data.isConnector) return; // Skip connector nodes

    const connectorId = node.data.parentConnectorId;
    if (connectorId) {
      edges.push({
        id: `child-${connectorId}-${node.id}`,
        source: connectorId,
        target: String(node.id),
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'parentChild',
        style: { stroke: '#ffffff', strokeWidth: 3 }
      });
    }
  });

  console.log('✅ Created', nodes.length, 'nodes and', edges.length, 'edges');
  return { nodes, edges };
};

/**
 * Creates a ReactFlow node from a person object
 */
const createPersonNode = (person, generation, apiUrl) => {
  const profileImg = person.profile_image_url
    ? `${apiUrl}/${person.profile_image_url}`
    : (person.gender?.toLowerCase() === 'female'
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(person.first_name + ' ' + person.last_name)}&background=fce7f3&color=ec4899&size=128`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.first_name + ' ' + person.last_name)}&background=dbeafe&color=3b82f6&size=128`);

  let birthDeath = '';
  if (person.birth_date && person.death_date) {
    birthDeath = `${new Date(person.birth_date).getFullYear()} - ${new Date(person.death_date).getFullYear()}`;
  } else if (person.birth_date) {
    birthDeath = new Date(person.birth_date).getFullYear().toString();
  } else if (person.death_date) {
    birthDeath = `- ${new Date(person.death_date).getFullYear()}`;
  }

  return {
    id: String(person.id),
    type: 'familyMember',
    position: { x: 0, y: 0 },
    data: {
      memberId: person.id,
      name: `${person.first_name} ${person.last_name}`,
      birth: birthDeath,
      gender: person.gender?.toLowerCase() || 'male',
      img: profileImg,
      generation: generation,
      parentConnectorId: null, // Will be set if this person is a child
      unionParent1Id: null,
      unionParent2Id: null
    }
  };
};

/**
 * Filters nodes and edges by maximum generation depth
 */
export const filterByGenerations = (nodes, edges, maxGenerations) => {
  const filteredNodes = nodes.filter(node => node.data.generation <= maxGenerations);
  const nodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredEdges = edges.filter(edge =>
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
};
