import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditorToolbar({
  onSave,
  onCancel,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isSaving
}) {
  const [isSaveAnimating, setIsSaveAnimating] = useState(false);

  const handleSave = () => {
    setIsSaveAnimating(true);
    setTimeout(() => {
      onSave();
      setIsSaveAnimating(false);
    }, 600);
  };

  return (
    <div className="editor-toolbar">
      <div className="toolbar-left">
        <button
          className="toolbar-button undo-button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last action (Ctrl+Z)"
        >
          <span className="button-icon">↶</span>
          <span className="button-label">Undo</span>
        </button>

        <button
          className="toolbar-button redo-button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo last action (Ctrl+Y)"
        >
          <span className="button-icon">↷</span>
          <span className="button-label">Redo</span>
        </button>
      </div>

      <div className="toolbar-right">
        <button
          className="toolbar-button cancel-button"
          onClick={onCancel}
          disabled={isSaving || isSaveAnimating}
        >
          Cancel
        </button>

        <button
          className={`toolbar-button save-button ${isSaveAnimating ? 'saving-animate' : ''}`}
          onClick={handleSave}
          disabled={isSaving || isSaveAnimating}
          style={{ minWidth: '120px', position: 'relative', overflow: 'hidden' }}
        >
          <AnimatePresence mode="wait">
            {isSaveAnimating ? (
              <motion.span
                key="checkmark"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ color: 'white', fontSize: '18px', display: 'inline-block' }}
              >
                ✓
              </motion.span>
            ) : (
              <motion.span
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
