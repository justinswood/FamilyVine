const express = require('express');
const cors = require('cors');
const path = require('path');
const membersRoute = require('./routes/members');
const albumsRoute = require('./routes/albums');
const relationshipsRoute = require('./routes/relationships');
const treePositionsRoute = require('./routes/tree-positions');
const treeRoute = require('./routes/tree');
const app = express();
const heroImagesRoute = require('./routes/hero-images');

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',           // Local development
    'http://localhost:3030',           // Local frontend (current port)
    'http://192.168.1.120:3000',       // Local network access
    'http://192.168.1.171:3030',       // Network access from 192.168.1.171
    /^http:\/\/192\.168\.1\.\d+:3030$/, // Allow any device on 192.168.1.x network on port 3030
    'https://family.techwoods.cc',     // Production domain
    'http://family.techwoods.cc'       // HTTP fallback
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Parse JSON
app.use(express.json());

// Serve static files from uploads directory with CORS headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Set CORS headers for static files (images)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes - Order matters!
app.use('/api/tree', treeRoute);
app.use('/api/tree-positions', treePositionsRoute);
app.use('/api/relationships', relationshipsRoute);
app.use('/api/albums', albumsRoute);
app.use('/api/members', membersRoute);
app.use('/api/hero-images', heroImagesRoute);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
});