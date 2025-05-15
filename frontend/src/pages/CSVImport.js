import React, { useState } from 'react';
import axios from 'axios';

const CSVImport = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setResult(null);
    setErrors([]);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('csvFile', csvFile);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/api/members/import-csv`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setResult(response.data);
      setErrors(response.data.errors || []);
      
      if (response.data.success) {
        // Optionally redirect to members page after successful import
        setTimeout(() => {
          window.location.href = '/members';
        }, 3000);
      }
    } catch (error) {
      console.error('Import error:', error);
      
      if (error.response && error.response.data) {
        setErrors(error.response.data.errors || []);
        setResult({
          success: false,
          message: error.response.data.message || 'Import failed'
        });
      } else {
        setResult({
          success: false,
          message: 'Failed to import CSV. Please check your file format.'
        });
      }
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `first_name,last_name,middle_name,gender,birth_date,birth_place,location,occupation,email,phone,is_alive
John,Doe,,Male,1990-05-15,New York,Los Angeles,Software Engineer,john@example.com,555-0123,true
Jane,Smith,Marie,Female,1985-12-20,Chicago,Chicago,Teacher,jane@example.com,555-0456,true
Robert,Johnson,,Male,1950-03-10,Boston,Boston,Retired,robert@example.com,555-0789,false`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'sample_family_members.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Import Family Members from CSV</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">CSV Format Requirements</h2>
        <p className="text-sm text-gray-700 mb-3">
          Your CSV file should include the following columns. Only first_name and last_name are required:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Required:</strong> first_name, last_name</div>
          <div><strong>Optional:</strong> middle_name, gender</div>
          <div><strong>Dates:</strong> birth_date, death_date (YYYY-MM-DD format)</div>
          <div><strong>Places:</strong> birth_place, death_place, location</div>
          <div><strong>Contact:</strong> email, phone, occupation</div>
          <div><strong>Other:</strong> is_alive (true/false), relationship, pronouns</div>
        </div>
        <button 
          onClick={downloadSampleCSV}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          Download Sample CSV
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={importing}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              importing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-semibold ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.message}
            </h3>
            
            {result.success && result.imported && (
              <div className="mt-2">
                <p className="text-green-700">
                  Successfully imported {result.imported.length} members
                </p>
                <ul className="mt-2 text-sm text-green-600">
                  {result.imported.map((member, index) => (
                    <li key={index}>✓ {member.name}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-green-600">
                  Redirecting to members page in 3 seconds...
                </p>
              </div>
            )}
          </div>
        )}

        {errors && errors.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Errors Found</h3>
            <div className="max-h-60 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 mb-2 p-2 bg-white rounded">
                  <strong>Row {error.row}:</strong> {error.error}
                  {error.data && (
                    <div className="text-xs text-gray-600 mt-1">
                      Data: {JSON.stringify(error.data)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVImport;