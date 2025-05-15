import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import AddMember from './pages/AddMember';
import EditMember from './pages/EditMember';
import MemberPage from './pages/MemberPage';
import MemberList from './pages/MemberList';
import MapPage from './pages/MapPage';
import CSVImport from './pages/CSVImport';
import Gallery from './pages/Gallery';
import AlbumView from './pages/AlbumView';
import FamilyTree from './pages/FamilyTree'; // Add this import
import VisualTreePage from './pages/VisualTreePage';

function App() {
  return (
    <BrowserRouter>
      <nav className="bg-white shadow mb-6">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-green-700">FamilyVine</Link>
          <div className="space-x-6">
            <Link to="/members" className="text-gray-700 hover:text-green-600 font-medium">View Members</Link>
            <Link to="/add" className="text-gray-700 hover:text-green-600 font-medium">Add Member</Link>
            <Link to="/import-csv" className="text-gray-700 hover:text-green-600 font-medium">Import CSV</Link>
            <Link to="/gallery" className="text-gray-700 hover:text-green-600 font-medium">Gallery</Link>
            <Link to="/map" className="text-gray-700 hover:text-green-600 font-medium">Map</Link>
			<Link to="/visual-tree" className="text-gray-700 hover:text-green-600 font-medium">Visual Tree</Link>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddMember />} />
        <Route path="/members" element={<MemberList />} />
        <Route path="/members/:id" element={<MemberPage />} />
        <Route path="/members/:id/edit" element={<EditMember />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/import-csv" element={<CSVImport />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/:id" element={<AlbumView />} />
        <Route path="/family-tree/:id" element={<FamilyTree />} /> {/* Add this route */}
		<Route path="/visual-tree" element={<VisualTreePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;