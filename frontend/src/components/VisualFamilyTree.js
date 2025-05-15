import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './VisualFamilyTree.css';

const VisualFamilyTree = () => {
  const svgRef = useRef();
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFamilyData();
  }, []);

  useEffect(() => {
    if (members.length > 0 && relationships.length > 0) {
      renderFamilyTree();
    }
  }, [members, relationships]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      // Use your existing environment variable and correct port
      const API_BASE = process.env.REACT_APP_API || 'http://192.168.1.120:5000';
      
      console.log('Fetching data from:', API_BASE);
      
      const [membersResponse, relationshipsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/members`),
        fetch(`${API_BASE}/api/relationships`)
      ]);

      console.log('Response status:', {
        members: membersResponse.status,
        relationships: relationshipsResponse.status
      });

      if (!membersResponse.ok || !relationshipsResponse.ok) {
        throw new Error(`HTTP error! Members: ${membersResponse.status}, Relationships: ${relationshipsResponse.status}`);
      }

      const membersData = await membersResponse.json();
      const relationshipsData = await relationshipsResponse.json();
      
      console.log('Fetched data:', {
        members: membersData.length,
        relationships: relationshipsData.length
      });
      
      setMembers(membersData);
      setRelationships(relationshipsData);
    } catch (error) {
      console.error('Detailed error fetching family data:', error);
      setError(`Failed to load family data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const buildFamilyGraph = () => {
    // Create nodes for each member
    const nodes = members.map(member => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      photo: member.photo_url,
      gender: member.gender,
      member: member
    }));

    // Create links from relationships
    const links = relationships.map(rel => ({
      source: rel.member1_id,
      target: rel.member2_id,
      type: rel.relationship_type,
      id: `${rel.member1_id}-${rel.member2_id}`
    }));

    return { nodes, links };
  };

  const renderFamilyTree = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = 1200;
    const height = 800;
    const nodeRadius = 35;

    svg.attr('width', width).attr('height', height);

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    const container = svg.append('g');

    const { nodes, links } = buildFamilyGraph();

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          // Adjust distance based on relationship type
          const parentChildTypes = ['father', 'mother', 'son', 'daughter'];
          const spouseTypes = ['husband', 'wife'];
          const siblingTypes = ['brother', 'sister'];
          
          if (parentChildTypes.includes(d.type)) return 120;
          if (spouseTypes.includes(d.type)) return 100;
          if (siblingTypes.includes(d.type)) return 150;
          return 180;
        })
        .strength(0.8)
      )
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(nodeRadius + 10));

    // Define arrow markers and colors for different relationship types
    const defs = svg.append('defs');
    
    const relationshipColors = {
      'father': '#4A90E2',
      'mother': '#E24A7F',
      'son': '#4A90E2',
      'daughter': '#E24A7F',
      'husband': '#8E44AD',
      'wife': '#8E44AD',
      'brother': '#27AE60',
      'sister': '#27AE60',
      'uncle': '#F39C12',
      'aunt': '#F39C12',
      'grandfather': '#34495E',
      'grandmother': '#34495E',
      'grandson': '#34495E',
      'granddaughter': '#34495E',
      'nephew': '#E67E22',
      'niece': '#E67E22',
      'cousin': '#95A5A6'
    };

    // Create arrow markers
    Object.entries(relationshipColors).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', nodeRadius + 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => relationshipColors[d.type] || '#999')
      .attr('stroke-width', 2)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Create link labels
    const linkLabels = container.append('g')
      .selectAll('.link-label')
      .data(links)
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .style('background', 'rgba(255,255,255,0.8)')
      .text(d => d.type);

    // Create node groups
    const node = container.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes
    node.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => d.gender === 'Male' ? '#87CEEB' : '#FFB6C1')
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // Add photos to nodes
    node.each(function(d) {
      if (d.photo) {
        const API_BASE = process.env.REACT_APP_API || 'http://192.168.1.120:5000';
        const pattern = defs.append('pattern')
          .attr('id', `photo-${d.id}`)
          .attr('patternUnits', 'objectBoundingBox')
          .attr('width', 1)
          .attr('height', 1);

        pattern.append('image')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', nodeRadius * 2)
          .attr('height', nodeRadius * 2)
          .attr('href', `${API_BASE}/${d.photo}`);

        d3.select(this).select('circle')
          .attr('fill', `url(#photo-${d.id})`);
      }
    });

    // Add labels to nodes
    node.append('text')
      .attr('dy', nodeRadius + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => d.name);

    // Add click functionality to nodes
    node.on('click', function(event, d) {
      setSelectedMember(d.member);
      
      // Highlight connected nodes
      const connectedNodeIds = new Set();
      links.forEach(link => {
        if (link.source.id === d.id) connectedNodeIds.add(link.target.id);
        if (link.target.id === d.id) connectedNodeIds.add(link.source.id);
      });

      node.selectAll('circle')
        .attr('stroke-width', nodeId => nodeId.id === d.id ? 4 : 
              connectedNodeIds.has(nodeId.id) ? 3 : 2)
        .attr('stroke', nodeId => nodeId.id === d.id ? '#FF4444' : 
              connectedNodeIds.has(nodeId.id) ? '#4444FF' : '#333');
    });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 5);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading family tree...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600 text-center">
          <div>{error}</div>
          <div className="mt-2 text-sm">
            Check console for details. Make sure your backend is running on port 5000.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="visual-family-tree">
      <div className="tree-controls">
        <h2>Visual Family Tree</h2>
        <button 
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750)
              .call(d3.zoom().transform, d3.zoomIdentity);
          }}
          className="reset-button"
        >
          Reset View
        </button>
        {selectedMember && (
          <div className="selected-member-info">
            <h3>Selected: {selectedMember.first_name} {selectedMember.last_name}</h3>
            <p>Born: {selectedMember.birth_year}</p>
            {selectedMember.death_year && <p>Died: {selectedMember.death_year}</p>}
          </div>
        )}
      </div>
      
      <div className="tree-legend">
        <h4>Relationship Colors:</h4>
        <div className="legend-items">
          <span><div className="color-box" style={{backgroundColor: '#4A90E2'}}></div> Father/Son</span>
          <span><div className="color-box" style={{backgroundColor: '#E24A7F'}}></div> Mother/Daughter</span>
          <span><div className="color-box" style={{backgroundColor: '#8E44AD'}}></div> Spouse</span>
          <span><div className="color-box" style={{backgroundColor: '#27AE60'}}></div> Siblings</span>
          <span><div className="color-box" style={{backgroundColor: '#F39C12'}}></div> Uncle/Aunt</span>
          <span><div className="color-box" style={{backgroundColor: '#34495E'}}></div> Grandparents</span>
        </div>
      </div>
      
      <svg ref={svgRef} className="family-tree-svg"></svg>
    </div>
  );
};

export default VisualFamilyTree;