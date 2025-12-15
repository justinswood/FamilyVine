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
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${
        isDragging
          ? 'border-orange-500 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      } hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-700 rounded-t-lg">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/50 dark:hover:bg-gray-600/50 rounded transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </button>

        {/* Step Label */}
        <span className="font-semibold text-gray-900 dark:text-white text-sm">
          Step {index + 1}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Delete Button */}
        <button
          onClick={() => onDelete(step.id)}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors group"
          aria-label="Delete step"
          title="Delete step"
        >
          <Trash2 className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <textarea
          value={step.text}
          onChange={(e) => onUpdate(step.id, e.target.value)}
          placeholder={`Describe step ${index + 1}...`}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500
                     resize-none transition-colors"
          rows={3}
          style={{ minHeight: '80px' }}
        />
      </div>

      {/* Footer */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tip: Be specific about temperatures, times, and techniques
        </p>
      </div>
    </div>
  );
};

export default InstructionStepCard;
