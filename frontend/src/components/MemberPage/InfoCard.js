import React from 'react';
import PropTypes from 'prop-types';

/**
 * InfoCard Component
 * Displays a piece of information with an icon and label
 */
const InfoCard = ({ icon, label, value, isLink = false, tint = 'purple' }) => {
  if (!value) return null;

  const tintStyles = {
    purple: 'bg-vine-50/80 border-vine-100 hover:border-vine-200',
    pink: 'bg-vine-50/80 border-vine-100 hover:border-vine-200',
    blue: 'bg-vine-50/80 border-vine-100 hover:border-vine-200',
    emerald: 'bg-emerald-50/80 border-emerald-100 hover:border-emerald-200',
    amber: 'bg-amber-50/80 border-amber-100 hover:border-amber-200',
    slate: 'bg-vine-50/80 border-vine-100 hover:border-vine-200',
  };

  return (
    <div className={`rounded-xl p-4 border hover:shadow-md transition-all ${tintStyles[tint]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-vine-sage uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${isLink ? 'text-vine-600' : 'text-vine-dark'}`}>
        {value}
      </p>
    </div>
  );
};

InfoCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  isLink: PropTypes.bool,
  tint: PropTypes.oneOf(['purple', 'pink', 'blue', 'emerald', 'amber', 'slate'])
};

export default InfoCard;
