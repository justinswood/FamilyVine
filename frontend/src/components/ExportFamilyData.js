import React, { useState } from 'react';

const ExportFamilyData = ({ members, relationships }) => {
  const [exportType, setExportType] = useState('');
  const [includePhotos, setIncludePhotos] = useState(false);
  const [includePrivateInfo, setIncludePrivateInfo] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [loading, setLoading] = useState(false);

  const exportOptions = [
    {
      id: 'basic',
      name: 'Basic Family List',
      description: 'Simple list of all family members with basic information',
      icon: '📊',
      formats: ['csv', 'json', 'pdf']
    },
    {
      id: 'detailed',
      name: 'Detailed Family Report',
      description: 'Comprehensive report including relationships and photos',
      icon: '📋',
      formats: ['pdf', 'html']
    },
    {
      id: 'relationships',
      name: 'Relationship Data',
      description: 'Export all family relationships for analysis',
      icon: '🔗',
      formats: ['csv', 'json']
    },
    {
      id: 'gedcom',
      name: 'GEDCOM File',
      description: 'Standard genealogy format for import into other software',
      icon: '🗂️',
      formats: ['ged']
    }
  ];

  const generateBasicCSV = () => {
    const headers = [
      'ID', 'First Name', 'Middle Name', 'Last Name', 'Gender', 'Birth Date', 'Death Date',
      'Location', 'Birth Place', 'Death Place', 'Occupation', 'Is Alive'
    ];

    if (includePrivateInfo) {
      headers.push('Email', 'Phone');
    }

    const csvData = [headers];
    
    const membersToExport = selectedMembers.length > 0 
      ? members.filter(m => selectedMembers.includes(m.id))
      : members;

    membersToExport.forEach(member => {
      const row = [
        member.id,
        member.first_name || '',
        member.middle_name || '',
        member.last_name || '',
        member.gender || '',
        member.birth_date || '',
        member.death_date || '',
        member.location || '',
        member.birth_place || '',
        member.death_place || '',
        member.occupation || '',
        member.is_alive ? 'Yes' : 'No'
      ];

      if (includePrivateInfo) {
        row.push(member.email || '', member.phone || '');
      }

      csvData.push(row);
    });

    return csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const generateRelationshipsCSV = () => {
    const headers = ['Member 1 ID', 'Member 1 Name', 'Relationship Type', 'Member 2 ID', 'Member 2 Name'];
    const csvData = [headers];

    relationships.forEach(rel => {
      const member1 = members.find(m => m.id === rel.member1_id);
      const member2 = members.find(m => m.id === rel.member2_id);
      
      if (member1 && member2) {
        csvData.push([
          rel.member1_id,
          `${member1.first_name} ${member1.last_name}`,
          rel.relationship_type,
          rel.member2_id,
          `${member2.first_name} ${member2.last_name}`
        ]);
      }
    });

    return csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const generateJSON = () => {
    const membersToExport = selectedMembers.length > 0 
      ? members.filter(m => selectedMembers.includes(m.id))
      : members;

    const data = {
      export_date: new Date().toISOString(),
      family_members: membersToExport.map(member => {
        const memberData = { ...member };
        
        if (!includePrivateInfo) {
          delete memberData.email;
          delete memberData.phone;
        }
        
        return memberData;
      }),
      relationships: exportType === 'relationships' ? relationships : []
    };

    return JSON.stringify(data, null, 2);
  };

  const generateGEDCOM = () => {
    let gedcom = `0 HEAD
1 SOUR FamilyVine
1 GEDC
2 VERS 5.5
1 DATE ${new Date().toISOString().split('T')[0]}
1 CHAR UTF-8
`;

    // Add individuals
    members.forEach(member => {
      gedcom += `0 @I${member.id}@ INDI
1 NAME ${member.first_name || ''} /${member.last_name || ''}/
`;
      if (member.gender) {
        gedcom += `1 SEX ${member.gender.charAt(0).toUpperCase()}
`;
      }
      
      if (member.birth_date || member.birth_place) {
        gedcom += `1 BIRT
`;
        if (member.birth_date) {
          const date = new Date(member.birth_date);
          gedcom += `2 DATE ${date.getDate()} ${date.toLocaleString('default', { month: 'SHORT' })} ${date.getFullYear()}
`;
        }
        if (member.birth_place) {
          gedcom += `2 PLAC ${member.birth_place}
`;
        }
      }

      if (member.death_date || member.death_place) {
        gedcom += `1 DEAT
`;
        if (member.death_date) {
          const date = new Date(member.death_date);
          gedcom += `2 DATE ${date.getDate()} ${date.toLocaleString('default', { month: 'SHORT' })} ${date.getFullYear()}
`;
        }
        if (member.death_place) {
          gedcom += `2 PLAC ${member.death_place}
`;
        }
      }

      if (member.occupation) {
        gedcom += `1 OCCU ${member.occupation}
`;
      }
    });

    // Add families (relationships)
    const families = {};
    let familyId = 1;

    relationships.forEach(rel => {
      if (rel.relationship_type === 'spouse' || rel.relationship_type === 'husband' || rel.relationship_type === 'wife') {
        const key = [rel.member1_id, rel.member2_id].sort().join('-');
        if (!families[key]) {
          families[key] = {
            id: familyId++,
            husband: rel.relationship_type === 'husband' ? rel.member1_id : rel.member2_id,
            wife: rel.relationship_type === 'wife' ? rel.member1_id : rel.member2_id,
            children: []
          };
        }
      }
    });

    // Add family records
    Object.values(families).forEach(family => {
      gedcom += `0 @F${family.id}@ FAM
`;
      if (family.husband) {
        gedcom += `1 HUSB @I${family.husband}@
`;
      }
      if (family.wife) {
        gedcom += `1 WIFE @I${family.wife}@
`;
      }
    });

    gedcom += `0 TRLR
`;

    return gedcom;
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!exportType) {
      alert('Please select an export type');
      return;
    }

    setLoading(true);

    try {
      let content = '';
      let filename = '';
      let contentType = '';

      const timestamp = new Date().toISOString().split('T')[0];

      switch (exportType) {
        case 'basic':
          if (exportFormat === 'csv') {
            content = generateBasicCSV();
            filename = `family-members-${timestamp}.csv`;
            contentType = 'text/csv';
          } else if (exportFormat === 'json') {
            content = generateJSON();
            filename = `family-members-${timestamp}.json`;
            contentType = 'application/json';
          }
          break;

        case 'relationships':
          if (exportFormat === 'csv') {
            content = generateRelationshipsCSV();
            filename = `family-relationships-${timestamp}.csv`;
            contentType = 'text/csv';
          } else if (exportFormat === 'json') {
            content = generateJSON();
            filename = `family-relationships-${timestamp}.json`;
            contentType = 'application/json';
          }
          break;

        case 'gedcom':
          content = generateGEDCOM();
          filename = `family-tree-${timestamp}.ged`;
          contentType = 'text/plain';
          break;

        default:
          throw new Error('Unsupported export type');
      }

      downloadFile(content, filename, contentType);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelection = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    setSelectedMembers(members.map(m => m.id));
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  return (
    <div className="p-6">
      {/* Export Type Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Choose Export Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportOptions.map(option => (
            <div
              key={option.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                exportType === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }`}
              onClick={() => setExportType(option.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{option.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">{option.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.description}</p>
                  <div className="flex space-x-2 mt-2">
                    {option.formats.map(format => (
                      <span
                        key={format}
                        className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded"
                      >
                        {format.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      {exportType && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Export Options</h2>

          {/* Format Selection */}
          {exportType !== 'gedcom' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {exportOptions.find(opt => opt.id === exportType)?.formats.map(format => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Include Options */}
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Include photos (where supported)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includePrivateInfo}
                onChange={(e) => setIncludePrivateInfo(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Include private information (email, phone)</span>
            </label>
          </div>
        </div>
      )}

      {/* Member Selection */}
      {exportType && exportType !== 'relationships' && exportType !== 'gedcom' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Members</h2>
            <div className="space-x-2">
              <button
                onClick={selectAllMembers}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {selectedMembers.length === 0 ? 'All members will be exported' : `${selectedMembers.length} members selected`}
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
            {members.map(member => (
              <label
                key={member.id}
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberSelection(member.id)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {member.first_name} {member.last_name}
                  </span>
                  {member.location && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      • {member.location}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Export Summary */}
      {exportType && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Export Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-4 border border-blue-100 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {selectedMembers.length || members.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Members to Export</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded p-4 border border-green-100 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {exportType === 'relationships' ? relationships.length : '—'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Relationships</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded p-4 border border-purple-100 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {exportFormat.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Export Format</div>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="text-center">
        <button
          onClick={handleExport}
          disabled={!exportType || loading}
          className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors ${
            !exportType || loading
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {loading ? 'Exporting...' : 'Export Family Data'}
        </button>
      </div>
    </div>
  );
};

export default ExportFamilyData;