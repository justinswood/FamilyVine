# FamilyVine Tree Library

A high-performance, custom-built family tree visualization library designed specifically for FamilyVine. Built with vanilla JavaScript and SVG, with React wrapper components for easy integration.

## Features

- **Union-based Architecture**: Designed for FamilyVine's unique union-based schema where family relationships are modeled through partnerships
- **Walker's Algorithm**: Uses the proven Walker tree layout algorithm for optimal, collision-free positioning
- **High Performance**: Renders large family trees (hundreds of nodes) smoothly using native SVG
- **Spouse Cohorts**: Intelligently groups married couples as single layout units
- **Interactive Pan & Zoom**: Smooth mouse/touch pan, wheel zoom, and pinch-to-zoom support
- **Mini-map Navigation**: Overview map with viewport indicator for easy navigation
- **Responsive**: Adapts to container size changes automatically
- **React & Vanilla JS**: Use as a React component or vanilla JavaScript
- **Customizable**: Extensive configuration options for layout, colors, and behavior

## Architecture

```
familyvine-tree/
├── core/                      # Core library (vanilla JS)
│   ├── FamilyTree.js         # Main orchestrator
│   ├── data/                 # Data models and transformers
│   │   ├── TreeModel.js      # Tree data structure
│   │   └── DataTransformer.js # Backend API → TreeModel
│   ├── layout/               # Layout algorithms
│   │   ├── LayoutConfig.js   # Configuration constants
│   │   ├── WalkerLayout.js   # Walker's algorithm
│   │   └── SpouseCohort.js   # Spouse cohort grouping
│   ├── renderer/             # SVG rendering
│   │   ├── SVGRenderer.js    # Main renderer
│   │   ├── NodeRenderer.js   # Node rendering
│   │   ├── EdgeRenderer.js   # Edge rendering
│   │   └── MiniMapRenderer.js # Mini-map rendering
│   └── interaction/          # User interaction
│       ├── PanZoomController.js # Pan/zoom handling
│       └── EventEmitter.js   # Event system
├── react/                    # React components
│   ├── FamilyTreeView.jsx    # Main React component
│   ├── useFamilyTree.js      # React hook for state
│   └── index.js
├── styles/                   # CSS styles
│   └── family-tree.css       # Base styles
└── index.js                  # Main entry point
```

## Installation

The library is already part of the FamilyVine project. Just import it:

```javascript
// React component
import { FamilyTreeView } from '@/lib/familyvine-tree/react';

// Vanilla JS
import FamilyTree from '@/lib/familyvine-tree';
```

## Usage

### React Component (Recommended)

```jsx
import React from 'react';
import { FamilyTreeView, useFamilyTree } from '@/lib/familyvine-tree/react';

function MyFamilyTree() {
  const {
    maxGenerations,
    setMaxGenerations,
    isLoading,
    error,
    treeStats
  } = useFamilyTree(4);

  const handleNodeClick = (memberId) => {
    console.log('Clicked member:', memberId);
    // Navigate to member page
    window.location.href = `/member/${memberId}`;
  };

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <FamilyTreeView
        data={generationsData}
        apiUrl="http://localhost:5050"
        maxGenerations={maxGenerations}
        onNodeClick={handleNodeClick}
        showMiniMap={true}
      />
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
import FamilyTree from '@/lib/familyvine-tree';

// Get container element
const container = document.getElementById('tree-container');

// Create tree instance
const tree = new FamilyTree(container, {
  apiUrl: 'http://localhost:5050',
  onNodeClick: (memberId) => {
    console.log('Clicked member:', memberId);
  }
});

// Load data
fetch('/api/tree/generations')
  .then(res => res.json())
  .then(data => {
    tree.setData(data.generations, 4);
  });

// Cleanup when done
// tree.destroy();
```

## API Reference

### FamilyTreeView (React Component)

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Array` | required | Generations data from backend API |
| `apiUrl` | `string` | `''` | Base URL for image paths |
| `maxGenerations` | `number` | `4` | Maximum generations to display |
| `onNodeClick` | `function` | `null` | Callback when node is clicked: `(memberId) => void` |
| `showMiniMap` | `boolean` | `true` | Show mini-map for navigation |
| `config` | `object` | `{}` | Layout configuration overrides |
| `className` | `string` | `''` | Additional CSS class |
| `style` | `object` | `{}` | Inline styles for wrapper |
| `onDataLoaded` | `function` | `null` | Callback when data loads: `(stats) => void` |
| `onError` | `function` | `null` | Callback on error: `(error) => void` |

### FamilyTree (Core Class)

#### Constructor

```javascript
new FamilyTree(container, config)
```

**Parameters:**
- `container` (HTMLElement): DOM element to render into
- `config` (object): Configuration options

**Config Options:**
```javascript
{
  apiUrl: '',              // Base URL for images
  miniMapContainer: null,  // Container for mini-map
  onNodeClick: null,       // Node click handler

  // Layout config (see LayoutConfig.js for all options)
  NODE_WIDTH: 200,
  NODE_HEIGHT: 155,
  SIBLING_SPACING: 40,
  GENERATION_HEIGHT: 250,
  // ... more layout options
}
```

#### Methods

**setData(generationsData, maxGenerations)**
- Load and render tree data
- `generationsData`: Array of generation objects from API
- `maxGenerations`: Number of generations to show (optional)

**handleResize()**
- Recalculate layout on container resize
- Called automatically by React component

**fitToView(padding = 50)**
- Fit entire tree into viewport
- `padding`: Padding around tree in pixels

**centerOnNode(nodeId)**
- Center view on a specific node
- `nodeId`: ID of node to center on

**setNodeClickHandler(callback)**
- Set or update node click handler
- `callback`: Function `(nodeId) => void`

**getBounds()**
- Get current tree bounds
- Returns: `{ minX, minY, maxX, maxY }`

**getTreeModel()**
- Get the current TreeModel instance
- Returns: `TreeModel` or `null`

**getZoom()**
- Get current zoom level
- Returns: `number`

**setZoom(zoom, animated = true)**
- Set zoom level programmatically
- `zoom`: Zoom level (0.5 to 2.0 default range)
- `animated`: Whether to animate transition

**reset()**
- Reset zoom and pan to initial state

**on(event, callback)**
- Subscribe to event
- Returns: Unsubscribe function

**off(event, callback)**
- Unsubscribe from event

**destroy()**
- Clean up and destroy tree instance
- Removes all event listeners and DOM elements

#### Events

- `dataLoaded`: Fired when data is loaded and rendered
  - Payload: `{ nodeCount, maxGeneration }`

### useFamilyTree Hook

React hook for managing tree state.

```javascript
const {
  maxGenerations,      // Current max generations
  setMaxGenerations,   // Update max generations
  isLoading,           // Loading state
  setIsLoading,        // Update loading state
  error,               // Error message
  setError,            // Update error
  treeStats,           // Tree statistics
  handleNodeClick,     // Node click handler
  handleDataLoaded,    // Data loaded handler
  handleError,         // Error handler
  reset                // Reset all state
} = useFamilyTree(initialMaxGen);
```

## Data Format

The library expects generations data from the FamilyVine backend API:

```javascript
[
  {
    generation: 1,
    unions: [
      {
        id: 1,
        partner1: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          gender: 'male',
          birth_date: '1950-01-01',
          death_date: null,
          profile_image_url: 'uploads/photo.jpg'
        },
        partner2: { /* same structure */ },
        is_single_parent: false,
        children: [
          { /* same structure as partner */ }
        ]
      }
    ]
  },
  { generation: 2, unions: [...] },
  // ...more generations
]
```

**Note**: The library automatically filters out "Unknown" placeholder members.

## Configuration

### Layout Configuration

Default layout settings (defined in `LayoutConfig.js`):

```javascript
{
  // Node dimensions
  NODE_WIDTH: 200,
  NODE_HEIGHT: 155,
  PHOTO_SIZE: 80,

  // Spacing
  SIBLING_SPACING: 40,
  SPOUSE_SPACING: 20,
  GENERATION_HEIGHT: 250,

  // Walker's algorithm
  WALKER: {
    SIBLING_SEPARATION: 40,
    SUBTREE_SEPARATION: 80,
    LEVEL_SEPARATION: 250
  },

  // Pan & Zoom
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 2.0,
  ZOOM_INITIAL: 1.0,

  // Visual
  TRANSITION_DURATION: 300,
  EDGE_STYLE: 'smooth'
}
```

Override in your code:

```javascript
<FamilyTreeView
  data={data}
  config={{
    SIBLING_SPACING: 60,
    GENERATION_HEIGHT: 300,
    ZOOM_MAX: 3.0
  }}
/>
```

## Styling

Import the base CSS:

```javascript
import '@/lib/familyvine-tree/styles/family-tree.css';
```

### CSS Classes

- `.fv-tree-wrapper` - Main container
- `.fv-tree-container` - Tree viewport
- `.fv-tree-minimap` - Mini-map overlay
- `.fv-node` / `.tree-node` - Node elements
- `.node-card` - Node card wrapper
- `.node-photo` - Photo elements
- `.node-text` - Text elements
- `.tree-edge` - Edge lines
- `.parent-edge` - Parent-child edges
- `.spouse-edge` - Spouse edges

### Customization

Override styles in your CSS:

```css
.fv-tree-wrapper {
  background-color: #2a2a2a; /* Custom background */
}

.fv-node:hover {
  filter: brightness(1.3); /* Brighter hover */
}

.fv-tree-minimap {
  width: 250px; /* Larger mini-map */
  height: 187px;
}
```

## Performance

The library is optimized for large family trees:

- **Efficient Layout**: O(n) Walker's algorithm
- **SVG Rendering**: Hardware-accelerated, scales to 500+ nodes
- **Debounced Resize**: Prevents excessive re-renders
- **Minimal Re-renders**: Only updates when data/config changes

**Tested with:**
- 500+ nodes: Smooth rendering and interaction
- 1000+ nodes: Still performant, may need viewport culling for very large trees

## Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Features:**
- SVG rendering (all modern browsers)
- ResizeObserver (built-in fallback)
- Touch events (mobile support)

## Examples

### Basic Example

```jsx
import { FamilyTreeView } from '@/lib/familyvine-tree/react';

<FamilyTreeView
  data={generationsData}
  apiUrl="http://localhost:5050"
  onNodeClick={(id) => navigate(`/member/${id}`)}
/>
```

### With Controls

```jsx
import { useState } from 'react';
import { FamilyTreeView } from '@/lib/familyvine-tree/react';

function ControlledTree() {
  const [maxGen, setMaxGen] = useState(4);

  return (
    <div>
      <select value={maxGen} onChange={(e) => setMaxGen(+e.target.value)}>
        <option value={2}>2 Generations</option>
        <option value={3}>3 Generations</option>
        <option value={4}>4 Generations</option>
        <option value={5}>5 Generations</option>
      </select>

      <FamilyTreeView
        data={data}
        maxGenerations={maxGen}
        showMiniMap={true}
      />
    </div>
  );
}
```

### Vanilla JS with Events

```javascript
import FamilyTree from '@/lib/familyvine-tree';

const tree = new FamilyTree(container, {
  apiUrl: 'http://localhost:5050'
});

// Subscribe to events
tree.on('dataLoaded', (stats) => {
  console.log(`Loaded ${stats.nodeCount} members`);
});

// Load data
tree.setData(generationsData, 4);

// Center on specific member
setTimeout(() => {
  tree.centerOnNode(42);
}, 1000);
```

## Troubleshooting

### Tree not rendering
- Check that container has explicit width/height
- Verify data format matches expected structure
- Check console for errors

### Images not loading
- Ensure `apiUrl` prop is set correctly
- Check that image paths are relative to apiUrl
- Verify backend CORS settings

### Performance issues
- Reduce `maxGenerations` to limit nodes
- Consider viewport culling for 1000+ nodes
- Check for excessive re-renders in React

### Layout issues
- Verify union relationships in data
- Check for orphaned nodes (no parents or unions)
- Review `Unknown` placeholder handling

## Development

### File Structure

Each module is self-contained:
- `core/` - Pure JavaScript, no framework dependencies
- `react/` - React wrappers around core
- `styles/` - CSS only, no preprocessors

### Testing

```bash
# Run in browser
npm start

# Test with sample data
# Visit: http://localhost:3030/tree
```

### Debugging

Enable debug logging:

```javascript
// The library logs to console automatically
// Look for these prefixes:
// 🎯 WalkerLayout
// 🔄 DataTransformer
// 🎨 SVGRenderer
// 🚀 FamilyTree
```

## License

Part of the FamilyVine project. Internal use only.

## Credits

Built for FamilyVine by Claude Code, implementing:
- Walker's algorithm (John Q. Walker II, 1990)
- Union-based family tree architecture
- Modern SVG rendering techniques
