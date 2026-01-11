# FamilyVine Tree - Quick Start Guide

## Installation

No installation needed! The library is already part of FamilyVine. Just import and use.

## React Quick Start (5 minutes)

### 1. Import the Component

```jsx
import { FamilyTreeView } from '@/lib/familyvine-tree/react';
import '@/lib/familyvine-tree/styles/family-tree.css';
```

### 2. Add to Your Page

```jsx
function MyTreePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5050/api/tree/generations')
      .then(res => res.json())
      .then(result => setData(result.generations));
  }, []);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <FamilyTreeView
        data={data}
        apiUrl="http://localhost:5050"
        onNodeClick={(id) => navigate(`/member/${id}`)}
      />
    </div>
  );
}
```

### 3. Done!

That's it! You now have a fully functional family tree with:
- Pan and zoom
- Click navigation
- Mini-map
- Beautiful gradients

## Vanilla JS Quick Start (3 minutes)

### 1. Create HTML Container

```html
<div id="tree" style="width: 100%; height: 600px;"></div>
<div id="minimap"></div>
```

### 2. Initialize Tree

```javascript
import FamilyTree from '@/lib/familyvine-tree';

const tree = new FamilyTree(
  document.getElementById('tree'),
  {
    apiUrl: 'http://localhost:5050',
    miniMapContainer: document.getElementById('minimap'),
    onNodeClick: (id) => location.href = `/member/${id}`
  }
);
```

### 3. Load Data

```javascript
fetch('http://localhost:5050/api/tree/generations')
  .then(res => res.json())
  .then(result => tree.setData(result.generations, 4));
```

## Common Patterns

### With Generation Controls

```jsx
const [maxGen, setMaxGen] = useState(4);

<select value={maxGen} onChange={(e) => setMaxGen(+e.target.value)}>
  <option value={2}>2 Generations</option>
  <option value={4}>4 Generations</option>
</select>

<FamilyTreeView
  data={data}
  maxGenerations={maxGen}
  ...
/>
```

### With Loading State

```jsx
const { isLoading, setIsLoading } = useFamilyTree();

{isLoading ? (
  <div>Loading...</div>
) : (
  <FamilyTreeView data={data} ... />
)}
```

### With Error Handling

```jsx
<FamilyTreeView
  data={data}
  onError={(err) => console.error(err)}
  onDataLoaded={(stats) => console.log(`Loaded ${stats.nodeCount} members`)}
/>
```

## Styling

### Default Dark Theme

Already applied! Just import the CSS:

```javascript
import '@/lib/familyvine-tree/styles/family-tree.css';
```

### Custom Colors

Override CSS variables:

```css
.fv-tree-wrapper {
  --node-bg: #2a2a2a;
  --text-color: #ffffff;
  --edge-color: rgba(255, 255, 255, 0.3);
}
```

### Light Mode

Add class:

```jsx
<FamilyTreeView className="light-mode" ... />
```

## Troubleshooting

### Tree not showing?

Check:
1. Container has explicit width/height
2. Data is in correct format
3. CSS is imported
4. Console for errors

### Images not loading?

Set `apiUrl` prop:

```jsx
<FamilyTreeView apiUrl="http://localhost:5050" ... />
```

### Tree too small/large?

Use `fitToView()` or adjust container size.

## Need Help?

See:
- **README.md** - Full documentation
- **examples/BasicExample.jsx** - Complete React example
- **examples/VanillaExample.html** - Vanilla JS example

## Next Steps

1. ✅ Get it working (you're here!)
2. 📖 Read the [README](./README.md) for full API
3. 🎨 Customize styles to match your design
4. 🚀 Deploy and enjoy!
