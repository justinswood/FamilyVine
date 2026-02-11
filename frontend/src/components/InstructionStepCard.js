import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

const InstructionStepCard = ({ step, index, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.3s ease, box-shadow 0.3s ease',
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        boxShadow: isDragging
          ? '0 8px 25px rgba(123, 45, 142, 0.25)'
          : 'none',
      }}
      className={`rounded-md border ${
        isDragging
          ? 'border-purple-400'
          : 'border-transparent'
      } transition-all duration-300`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-t-md"
        style={{
          backgroundColor: 'var(--alabaster-parchment, #F5F0E6)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
        }}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing rounded transition-colors"
          aria-label="Drag to reorder"
          style={{ color: 'var(--vine-sage)' }}
        >
          <GripVertical className="w-3 h-3" />
        </button>

        {/* Step Number Badge */}
        <div
          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white font-semibold"
          style={{ background: 'linear-gradient(135deg, var(--vine-green, #2E5A2E), var(--vine-dark, #2D4F1E))', fontSize: '0.5rem' }}
        >
          {index + 1}
        </div>

        {/* Step Label */}
        <span style={{ fontFamily: "var(--font-header, 'Playfair Display', serif)", fontWeight: 600, fontSize: '0.6rem', color: 'var(--vine-dark, #2D4F1E)' }}>
          Step {index + 1}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Delete Button */}
        <button
          onClick={() => onDelete(step.id)}
          className="p-0.5 rounded transition-colors group"
          aria-label="Delete step"
          title="Delete step"
          style={{ color: 'var(--vine-sage)' }}
        >
          <Trash2 className="w-3 h-3 group-hover:text-red-600" />
        </button>
      </div>

      {/* Body */}
      <div className="p-2.5" style={{ backgroundColor: 'var(--parchment, #F9F8F3)' }}>
        <textarea
          value={step.text}
          onChange={(e) => onUpdate(step.id, e.target.value)}
          placeholder={`Describe step ${index + 1}...`}
          className="recipe-edit-textarea"
          rows={2}
          style={{ minHeight: '50px' }}
        />
      </div>

      {/* Footer */}
      <div className="px-3 pb-2" style={{ backgroundColor: 'var(--parchment, #F9F8F3)', borderRadius: '0 0 6px 6px' }}>
        <p style={{ fontSize: '0.45rem', color: 'var(--vine-sage)', fontStyle: 'italic' }}>
          Tip: Be specific about temperatures, times, and techniques
        </p>
      </div>
    </div>
  );
};

export default InstructionStepCard;
