const express = require('express');
const cors = require('cors');
const path = require('path');
const membersRoute = require('./routes/members');
const albumsRoute = require('./routes/albums');
const relationshipsRoute = require('./routes/relationships'); // Add this import
const app = express();

// Enable CORS
app.use(cors());

// Parse JSON
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes - Order matters!
app.use('/api/relationships', relationshipsRoute); // Add this route
app.use('/api/albums', albumsRoute);
app.use('/api/members', membersRoute);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});