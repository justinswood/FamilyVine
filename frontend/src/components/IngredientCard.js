import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

const IngredientCard = ({ ingredient, index, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ingredient.id });

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
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </button>

        {/* Index Number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500
                        flex items-center justify-center text-white text-sm font-semibold">
          {index + 1}
        </div>

        {/* Input */}
        <input
          type="text"
          value={ingredient.text}
          onChange={(e) => onUpdate(ingredient.id, e.target.value)}
          placeholder={`e.g., 2 cups flour, 1 tsp salt...`}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500
                     transition-colors"
        />

        {/* Delete Button */}
        <button
          onClick={() => onDelete(ingredient.id)}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors group flex-shrink-0"
          aria-label="Delete ingredient"
          title="Delete ingredient"
        >
          <Trash2 className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
        </button>
      </div>
    </div>
  );
};

export default IngredientCard;
