// Test script to verify tree-positions API
const testPositions = async () => {
  try {
    // Test GET (should return empty object initially)
    console.log('Testing GET...');
    const getResponse = await fetch('http://localhost:5000/api/tree-positions?tree_type=reactflow');
    const positions = await getResponse.json();
    console.log('Current positions:', positions);
    
    // Test POST (save some test positions)
    console.log('Testing POST...');
    const testData = {
      positions: {
        '1': { x: 100, y: 50 },
        '2': { x: 200, y: 50 }
      },
      tree_type: 'reactflow'
    };
    
    const postResponse = await fetch('http://localhost:5000/api/tree-positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const saveResult = await postResponse.json();
    console.log('Save result:', saveResult);
    
    // Test GET again to verify save
    console.log('Testing GET after save...');
    const getResponse2 = await fetch('http://localhost:5000/api/tree-positions?tree_type=reactflow');
    const positions2 = await getResponse2.json();
    console.log('Positions after save:', positions2);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run in browser console
testPositions();