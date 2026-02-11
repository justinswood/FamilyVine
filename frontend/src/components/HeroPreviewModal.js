import React from 'react';
import { MapPin, ArrowRight, X } from 'lucide-react';

const HeroPreviewModal = ({ imageUrl, onSave, onBack, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
          <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>
            Homepage Preview
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" style={{ color: 'var(--vine-sage)' }} />
          </button>
        </div>

        {/* Storybook Preview (replicates HomePage hero layout) */}
        <div className="p-6" style={{ background: 'linear-gradient(180deg, #FFFEF5 0%, #FAF8F0 100%)' }}>
          <p className="text-center text-sm mb-4" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}>
            This is how your cropped image will appear on the homepage
          </p>

          <div className="storybook-hero" style={{ minHeight: '400px' }}>
            {/* Visual Column */}
            <div className="storybook-visual" style={{ minHeight: '400px' }}>
              <div className="storybook-slide storybook-slide-active" style={{ opacity: 1, transform: 'none' }}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="storybook-artifact-img"
                />
              </div>
            </div>

            {/* Narrative Column */}
            <div className="storybook-narrative">
              <div className="storybook-overline">Family Album</div>
              <h2 className="storybook-title">A Moment in Time</h2>
              <div className="storybook-divider" />
              <div className="storybook-context-item">
                <MapPin className="w-3.5 h-3.5" />
                <span>Location</span>
              </div>
              <p className="storybook-body storybook-empty-fact">
                Every photograph holds a story waiting to be told.
              </p>
              <div className="storybook-read-more" style={{ cursor: 'default', pointerEvents: 'none' }}>
                Explore the Gallery
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="p-4 border-t flex justify-between items-center"
          style={{
            borderColor: 'rgba(212, 175, 55, 0.2)',
            background: 'rgba(134, 167, 137, 0.05)'
          }}
        >
          <button
            onClick={onBack}
            className="px-4 py-2 border rounded-lg transition-colors flex items-center gap-2"
            style={{
              borderColor: 'var(--vine-sage)',
              color: 'var(--vine-dark)',
              fontFamily: 'var(--font-body)'
            }}
          >
            <span style={{ fontSize: '1.1em' }}>&larr;</span> Back to Crop
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg transition-colors"
              style={{
                borderColor: '#ccc',
                color: '#666',
                fontFamily: 'var(--font-body)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-5 py-2 rounded-lg text-white transition-colors font-medium"
              style={{
                backgroundColor: 'var(--vine-green)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Save Hero Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroPreviewModal;
