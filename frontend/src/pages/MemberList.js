import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MemberCard from '../components/MemberCard';
import ProfileImage from '../components/ProfileImage';
import { formatFullName, formatSimpleName } from '../utils/nameUtils';
import { computeKinship } from '../lib/familyvine-tree/react/kinship';
import { MapPin } from 'lucide-react';

/* ── Decorative leaf icon ── */
const LeafIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-3.5 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const API = process.env.REACT_APP_API;

const MemberList = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memoryCounts, setMemoryCounts] = useState({});
  const [kinshipMap, setKinshipMap] = useState({});

  // UI state
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [activeLetter, setActiveLetter] = useState(null);

  const contentRef = useRef(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchMembers();
    fetchMemoryCounts();
    fetchTreeForKinship();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/members`);
      const membersData = res.data || [];

      // Filter out placeholder members
      const filtered = membersData.filter(member => {
        const fullName = formatSimpleName(member);
        return fullName !== 'Unknown Parent' &&
               fullName !== 'Unknown Mother' &&
               fullName !== 'Unknown Father';
      });

      setAllMembers(filtered);
    } catch (err) {
      console.error('Error fetching members:', err);
      setAllMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemoryCounts = async () => {
    try {
      const res = await axios.get(`${API}/api/members/memory-counts`);
      setMemoryCounts(res.data || {});
    } catch (err) {
      console.error('Error fetching memory counts:', err);
    }
  };

  const fetchTreeForKinship = async () => {
    try {
      const res = await axios.get(`${API}/api/tree/descendants?max_generations=6`);
      if (!res.data || !res.data.unions) return;

      // Build nodeMap from union data
      const nodeMap = new Map();
      const unions = res.data.unions;

      // First pass: create all member nodes
      unions.forEach(union => {
        const p1 = union.partner1;
        const p2 = union.partner2;

        if (p1 && p1.id) {
          if (!nodeMap.has(p1.id)) {
            nodeMap.set(p1.id, {
              id: p1.id,
              firstName: p1.first_name,
              lastName: p1.last_name,
              fatherId: null,
              motherId: null,
              partnerIds: []
            });
          }
          const node = nodeMap.get(p1.id);
          if (p2 && p2.id && !node.partnerIds.includes(p2.id)) {
            node.partnerIds.push(p2.id);
          }
        }

        if (p2 && p2.id) {
          if (!nodeMap.has(p2.id)) {
            nodeMap.set(p2.id, {
              id: p2.id,
              firstName: p2.first_name,
              lastName: p2.last_name,
              fatherId: null,
              motherId: null,
              partnerIds: []
            });
          }
          const node = nodeMap.get(p2.id);
          if (p1 && p1.id && !node.partnerIds.includes(p1.id)) {
            node.partnerIds.push(p1.id);
          }
        }

        // Process children — assign parents
        if (union.children) {
          union.children.forEach(child => {
            if (!child || !child.id) return;
            if (!nodeMap.has(child.id)) {
              nodeMap.set(child.id, {
                id: child.id,
                firstName: child.first_name,
                lastName: child.last_name,
                fatherId: null,
                motherId: null,
                partnerIds: []
              });
            }
            const childNode = nodeMap.get(child.id);
            // Assign parents based on gender
            if (p1 && p1.id) {
              if (p1.gender === 'male') childNode.fatherId = p1.id;
              else childNode.motherId = p1.id;
            }
            if (p2 && p2.id) {
              if (p2.gender === 'male') childNode.fatherId = p2.id;
              else childNode.motherId = p2.id;
            }
          });
        }
      });

      // Find root (generation 1) members
      const rootUnion = unions.find(u => u.generation === 1);
      if (!rootUnion) return;

      const rootId = rootUnion.partner1?.id || rootUnion.partner2?.id;
      if (!rootId) return;

      // Compute kinship for all members
      const kinships = {};
      const rootNode = nodeMap.get(rootId);
      const rootName = rootNode ?
        `${rootNode.firstName || ''} ${rootNode.lastName || ''}`.trim() :
        'Family Root';

      for (const [memberId] of nodeMap) {
        if (memberId === rootId) continue;
        const result = computeKinship(nodeMap, rootId, memberId);
        if (result) {
          kinships[memberId] = `${result.title} of ${rootName}`;
        }
      }

      setKinshipMap(kinships);
    } catch (err) {
      console.error('Error building kinship map:', err);
    }
  };

  // Extract unique branches (surnames) with counts
  const branches = useMemo(() => {
    const surnames = {};
    allMembers.forEach(m => {
      const name = (m.last_name || '').trim();
      if (name && !name.toLowerCase().includes('unknown')) {
        surnames[name] = (surnames[name] || 0) + 1;
      }
    });
    return Object.entries(surnames)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allMembers]);

  // Filter and sort logic
  useEffect(() => {
    if (!allMembers || allMembers.length === 0) {
      setFilteredMembers([]);
      return;
    }

    let filtered = [...allMembers];

    // Branch filter
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(m =>
        (m.last_name || '').trim() === selectedBranch
      );
    }

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(member => {
        const fullName = formatFullName(member).toLowerCase();
        const location = (member.location || '').toLowerCase();
        const occupation = (member.occupation || '').toLowerCase();
        return fullName.includes(q) || location.includes(q) || occupation.includes(q);
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let valueA, valueB;
      switch (sortBy) {
        case 'name':
          valueA = (a.last_name || '').toLowerCase() + (a.first_name || '').toLowerCase();
          valueB = (b.last_name || '').toLowerCase() + (b.first_name || '').toLowerCase();
          break;
        case 'location':
          valueA = (a.location || '').toLowerCase();
          valueB = (b.location || '').toLowerCase();
          break;
        case 'age': {
          const getAge = (m) => {
            if (m.birth_date) {
              const bd = new Date(m.birth_date);
              const end = m.death_date ? new Date(m.death_date) : new Date();
              return end.getFullYear() - bd.getFullYear();
            }
            return 0;
          };
          valueA = getAge(a);
          valueB = getAge(b);
          break;
        }
        default:
          return 0;
      }
      if (sortOrder === 'desc') return valueA < valueB ? 1 : -1;
      return valueA > valueB ? 1 : -1;
    });

    setFilteredMembers(sorted);
  }, [searchTerm, allMembers, sortBy, sortOrder, selectedBranch]);

  // Group members by first letter of last name for A-Z sections
  const letterGroups = useMemo(() => {
    const groups = {};
    filteredMembers.forEach(m => {
      const letter = (m.last_name || '?').charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(m);
    });
    return groups;
  }, [filteredMembers]);

  // A-Z letters that exist
  const activeLetters = useMemo(() => {
    return new Set(Object.keys(letterGroups));
  }, [letterGroups]);

  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const isDeceased = (member) => {
    if (!member) return false;
    return member.is_alive === false ||
      (member.death_date !== null && member.death_date !== undefined && member.death_date !== '');
  };

  const scrollToLetter = useCallback((letter) => {
    if (!activeLetters.has(letter)) return;
    setActiveLetter(letter);
    const el = document.getElementById(`letter-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeLetters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto p-3">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-vine-sage" style={{ fontFamily: 'var(--font-body)' }}>Loading family registry...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registry-page">
      <div className="max-w-7xl mx-auto p-2 relative z-10">

        {/* Registry Header */}
        <div className="registry-header">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">

            {/* Left: Title + Count */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <LeafIcon className="w-3.5 h-3.5" style={{ color: 'var(--vine-sage)' }} />
              <div>
                <h1 className="registry-header-title">Ancestral Registry</h1>
                <p className="registry-count">
                  {filteredMembers.length} of {allMembers.length} members
                  {selectedBranch !== 'all' && ` \u00b7 ${selectedBranch} branch`}
                </p>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex items-center gap-1.5 flex-1 max-w-lg">
              <div className="relative flex-1">
                <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5" style={{ color: 'var(--vine-sage)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search the registry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-6 pr-6 py-1 rounded-lg border"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.5rem',
                    background: 'rgba(255,253,249,0.6)',
                    borderColor: 'rgba(134, 167, 137, 0.2)',
                    color: 'var(--vine-dark)',
                    outline: 'none',
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    style={{ color: 'var(--vine-sage)' }}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-md p-0.5" style={{ background: 'rgba(134, 167, 137, 0.08)', border: '1px solid rgba(134, 167, 137, 0.12)' }}>
                <button
                  onClick={() => setViewMode('list')}
                  className="px-1.5 py-0.5 rounded font-medium transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.5rem',
                    background: viewMode === 'list' ? 'var(--parchment)' : 'transparent',
                    color: viewMode === 'list' ? 'var(--vine-dark)' : 'var(--vine-sage)',
                    boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className="px-1.5 py-0.5 rounded font-medium transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.5rem',
                    background: viewMode === 'grid' ? 'var(--parchment)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--vine-dark)' : 'var(--vine-sage)',
                    boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  Grid
                </button>
              </div>
            </div>

            {/* Right: Sort + Add */}
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-0.5 px-1.5 rounded-lg border"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.5rem',
                  background: 'rgba(255,253,249,0.6)',
                  borderColor: 'rgba(134, 167, 137, 0.2)',
                  color: 'var(--vine-dark)',
                  outline: 'none',
                }}
              >
                <option value="name">Name</option>
                <option value="location">Location</option>
                <option value="age">Age</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn-registry btn-registry-secondary"
                style={{ padding: '2px 6px' }}
              >
                {sortBy === 'age' ? (sortOrder === 'asc' ? '\u2191' : '\u2193') : (sortOrder === 'asc' ? 'A-Z' : 'Z-A')}
              </button>
              <Link to="/add" className="btn-registry btn-registry-primary" style={{ padding: '3px 8px' }}>
                + Add
              </Link>
            </div>
          </div>

          {/* Branch Filter (Vine Selector) */}
          {branches.length > 1 && (
            <>
              <div style={{
                height: '1px',
                background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.25) 50%, rgba(212,175,55,0) 100%)',
                margin: '8px 0 4px',
              }} />
              <div className="vine-selector">
                <div className="vine-selector-label">
                  <LeafIcon className="w-2 h-2" />
                  <span>Branches</span>
                </div>
                <button
                  onClick={() => setSelectedBranch('all')}
                  className={`vine-pill ${selectedBranch === 'all' ? 'vine-pill-active' : ''}`}
                >
                  All Families
                </button>
                {branches.map(branch => (
                  <button
                    key={branch.name}
                    onClick={() => setSelectedBranch(branch.name === selectedBranch ? 'all' : branch.name)}
                    className={`vine-pill ${selectedBranch === branch.name ? 'vine-pill-active' : ''}`}
                  >
                    {branch.name}
                    <span className="vine-pill-count">({branch.count})</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main Content Area with A-Z Sidebar */}
        <div className="flex gap-2">

          {/* A-Z Sidebar (desktop only, grid mode) */}
          {viewMode === 'grid' && filteredMembers.length > 10 && (
            <div className="hidden lg:block flex-shrink-0" style={{ width: '28px' }}>
              <div className="az-index">
                {allLetters.map(letter => (
                  <button
                    key={letter}
                    onClick={() => scrollToLetter(letter)}
                    className={`az-letter ${
                      activeLetter === letter ? 'az-letter-active' : ''
                    } ${!activeLetters.has(letter) ? 'az-letter-inactive' : ''}`}
                    disabled={!activeLetters.has(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Members Display */}
          <div className="registry-content flex-1" ref={contentRef}>
            {!filteredMembers || filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <LeafIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--vine-sage)', opacity: 0.4 }} />
                <p className="text-lg mb-2" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-sage)' }}>
                  {searchTerm
                    ? `No members found matching "${searchTerm}"`
                    : selectedBranch !== 'all'
                      ? `No members in the ${selectedBranch} branch`
                      : 'No family members found yet!'
                  }
                </p>
                {(searchTerm || selectedBranch !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedBranch('all'); }}
                    className="btn-registry btn-registry-secondary mt-2"
                  >
                    Clear filters
                  </button>
                )}
                {allMembers.length === 0 && (
                  <Link to="/add" className="btn-registry btn-registry-primary mt-4 inline-block">
                    + Add First Family Member
                  </Link>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'list' ? (
                  /* ── List View ── */
                  <div className="space-y-2">
                    {Object.keys(letterGroups).sort().map(letter => (
                      <div key={letter} id={`letter-${letter}`}>
                        <div className="letter-divider">
                          <span className="letter-divider-char">{letter}</span>
                          <div className="letter-divider-line" />
                        </div>
                        <div className="space-y-1.5">
                          {letterGroups[letter].map(member => {
                            if (!member || !member.id) return null;
                            return (
                              <Link
                                key={member.id}
                                to={`/members/${member.id}`}
                                className="registry-list-row"
                                style={{ textDecoration: 'none' }}
                              >
                                <div className="relative flex-shrink-0">
                                  <ProfileImage member={member} size="small" className="" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="registry-list-name truncate">
                                      {formatFullName(member)}
                                    </span>
                                    {isDeceased(member) && (
                                      <span style={{ fontSize: '0.7rem', color: 'var(--vine-sage)', opacity: 0.6 }} title="Deceased">
                                        &#x269C;
                                      </span>
                                    )}
                                    {memoryCounts[member.id] && (
                                      <span className="memory-badge" style={{ position: 'static', borderColor: 'transparent', fontSize: '0.5rem', padding: '1px 5px' }}>
                                        {(memoryCounts[member.id]?.stories || 0) + (memoryCounts[member.id]?.photos || 0)} memories
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="registry-list-meta">
                                      {member.birth_date
                                        ? (isDeceased(member) && member.death_date
                                          ? `${new Date(member.birth_date).getFullYear()} \u2014 ${new Date(member.death_date).getFullYear()}`
                                          : `b. ${new Date(member.birth_date).getFullYear()}`)
                                        : ''}
                                    </span>
                                    {member.location && (
                                      <span className="registry-list-meta flex items-center gap-1">
                                        <MapPin style={{ width: 9, height: 9 }} />
                                        {member.location}
                                      </span>
                                    )}
                                    {kinshipMap[member.id] && (
                                      <span className="registry-list-meta" style={{ fontStyle: 'normal', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {kinshipMap[member.id]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ── Grid View ── */
                  <div>
                    {Object.keys(letterGroups).sort().map(letter => (
                      <div key={letter} id={`letter-${letter}`}>
                        <div className="letter-divider">
                          <span className="letter-divider-char">{letter}</span>
                          <div className="letter-divider-line" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-2">
                          {letterGroups[letter].map(member => {
                            if (!member || !member.id) return null;
                            return (
                              <MemberCard
                                key={member.id}
                                member={member}
                                memoryCounts={memoryCounts[member.id]}
                                kinshipTitle={kinshipMap[member.id]}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberList;
