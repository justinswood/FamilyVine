import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <img src="/logo.png" alt="FamilyVine Logo" className="w-32 mb-4" />
      <h1 className="text-4xl font-bold mb-2">Welcome to FamilyVine</h1>
      <p className="text-lg text-gray-600 mb-6">Preserve your family's legacy, beautifully.</p>

      <div className="space-x-4">
        <Link to="/members/1" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          View a Member
        </Link>
        <Link to="/add" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Add Member
        </Link>
        <Link to="/map" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
          Explore Map
        </Link>
      </div>
    </div>
  );
}

export default Home;
