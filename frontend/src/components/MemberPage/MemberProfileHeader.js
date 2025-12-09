import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatDate, calculateAge } from '../../utils/dateUtils';

/**
 * MemberProfileHeader Component
 * Displays member profile photo, name, dates, and quick actions
 */
const MemberProfileHeader = React.memo(({ member, onShowPhotos }) => {
  const firstName = member.first_name || '';
  const middleName = member.middle_name || '';
  const lastName = member.last_name || '';
  const fullName = `${firstName} ${middleName} ${lastName}`.trim() || 'Unknown Name';
  const age = calculateAge(member.birth_date, member.death_date);

  return (
    <div className="text-center mb-10">
      {/* Profile Photo */}
      <div className="relative inline-block mb-5">
        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 p-0.5 shadow-xl shadow-purple-200/50">
          <div className="w-full h-full rounded-full bg-white p-0.5">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
              {member.photo_url ? (
                <img
                  src={`${process.env.REACT_APP_API}/${member.photo_url}`}
                  alt={fullName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span className={`text-4xl font-light text-purple-400 ${member.photo_url ? 'hidden' : 'flex'}`}>
                {firstName[0]}{lastName[0]}
              </span>
            </div>
          </div>
        </div>
        {/* Living indicator */}
        {!member.death_date && (
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white shadow-md" title="Living" />
        )}
      </div>

      {/* Name */}
      <h1 className="text-3xl font-semibold text-slate-800 tracking-tight mb-1">
        {fullName}
      </h1>

      {/* Life dates */}
      {member.birth_date && (
        <p className="text-slate-500 text-sm">
          {formatDate(member.birth_date)} — {member.death_date ? formatDate(member.death_date) : 'Present'}
          {age !== null && (
            <>
              <span className="mx-2 text-slate-300">•</span>
              <span className="text-purple-600 font-medium">
                {member.death_date ? `Lived ${age} years` : `${age} years old`}
              </span>
            </>
          )}
        </p>
      )}

      {/* Quick Actions */}
      <div className="flex justify-center gap-3 mt-5">
        <Link
          to={`/members/${member.id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </Link>
        <button
          onClick={onShowPhotos}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-all shadow-sm shadow-purple-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Photos
        </button>
      </div>
    </div>
  );
});

MemberProfileHeader.displayName = 'MemberProfileHeader';

MemberProfileHeader.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.number.isRequired,
    first_name: PropTypes.string,
    middle_name: PropTypes.string,
    last_name: PropTypes.string,
    photo_url: PropTypes.string,
    birth_date: PropTypes.string,
    death_date: PropTypes.string
  }).isRequired,
  onShowPhotos: PropTypes.func.isRequired
};

export default MemberProfileHeader;
