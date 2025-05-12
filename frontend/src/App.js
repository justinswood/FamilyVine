import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import AddMember from './pages/AddMember';
import EditMember from './pages/EditMember';
import MemberPage from './pages/MemberPage';
import MemberList from './pages/MemberList';
import MapPage from './pages/MapPage';

function App() {
  return (
    <BrowserRouter>
      <nav className="bg-white shadow mb-6">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-green-700">FamilyVine</Link>
          <div className="space-x-6">
            <Link to="/members" className="text-gray-700 hover:text-green-600 font-medium">View Members</Link>
            <Link to="/add" className="text-gray-700 hover:text-green-600 font-medium">Add Member</Link>
            <Link to="/map" className="text-gray-700 hover:text-green-600 font-medium">Map</Link>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;