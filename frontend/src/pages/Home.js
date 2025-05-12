import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <h1 className="text-4xl font-bold text-green-700 mb-4">Welcome to FamilyVine</h1>
      <p className="text-lg text-gray-700 mb-8">
        FamilyVine helps you visually map and preserve your family's legacy. Add members, photos, life stories,
        and see how you're all connected—across generations and geography.
      </p>
      <div className="space-x-4">
        <Link to="/members" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          View Members
        </Link>
        <Link to="/add" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Add Member
        </Link>
      </div>
    </div>
  );
};

export default Home;