import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Eye, EyeOff } from 'lucide-react';

/**
 * Parse an ingredient line into {quantity, name}.
 * Handles: "2 cups flour", "1/2 tsp salt", "1 1/2 lbs beef", "10oz Can Tomato Sauce"
 */
const parseIngredient = (text) => {
  const cleanText = text.replace(/^\[SECRET\]/, '');
  const regex = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)\s*(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|g|kg|ml|l|liters?|quarts?|pints?|gallons?|sticks?|cans?|packages?|bunche?s?|cloves?|heads?|slices?|pieces?|pinch(?:es)?|dash(?:es)?)?)\s+(.*)/i;
  const match = cleanText.match(regex);
  if (match) {
    return { quantity: match[1].trim(), name: match[2].trim() };
  }
  return { quantity: '', name: cleanText };
};

const IngredientCard = ({ ingredient, index, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ingredient.id });

  const isSecret = ingredient.text.startsWith('[SECRET]');
  const cleanText = ingredient.text.replace(/^\[SECRET\]/, '');
  const parsed = parseIngredient(ingredient.text);

  // Local state to avoid re-parsing mid-keystroke (e.g. typing "1/" before completing "1/2")
  const [localQty, setLocalQty] = useState(parsed.quantity);
  const [localName, setLocalName] = useState(parsed.name);

  // Track when we initiated the change to skip re-parsing our own commits
  const selfCommit = useRef(false);

  // Sync local state only for external changes (e.g. drag reorder), not our own commits
  useEffect(() => {
    if (selfCommit.current) {
      selfCommit.current = false;
      return;
    }
    const p = parseIngredient(ingredient.text);
    setLocalQty(p.quantity);
    setLocalName(p.name);
  }, [ingredient.text]);

  const commitChanges = (qty, nm) => {
    selfCommit.current = true;
    const prefix = isSecret ? '[SECRET]' : '';
    const newText = qty.trim() ? `${qty.trim()} ${nm}` : nm;
    onUpdate(ingredient.id, `${prefix}${newText}`);
  };

  const toggleSecret = () => {
    if (isSecret) {
      onUpdate(ingredient.id, cleanText);
    } else {
      onUpdate(ingredient.id, `[SECRET]${cleanText}`);
    }
  };

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
      <div
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{
          backgroundColor: isSecret
            ? 'rgba(212, 175, 55, 0.08)'
            : 'var(--alabaster-parchment, #F5F0E6)',
          borderLeft: isSecret ? '2px solid rgba(212, 175, 55, 0.4)' : '2px solid transparent',
          borderRadius: '5px',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing rounded transition-colors flex-shrink-0"
          aria-label="Drag to reorder"
          style={{ color: 'var(--vine-sage)' }}
        >
          <GripVertical className="w-3 h-3" />
        </button>

        {/* Index Number */}
        <div
          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white font-semibold"
          style={{ background: 'linear-gradient(135deg, var(--vine-green, #2E5A2E), var(--vine-dark, #2D4F1E))', fontSize: '0.5rem' }}
        >
          {index + 1}
        </div>

        {/* Measurement (monospace) */}
        <input
          type="text"
          value={localQty}
          onChange={(e) => setLocalQty(e.target.value)}
          onBlur={() => commitChanges(localQty, localName)}
          placeholder="Qty"
          className="recipe-edit-input"
          style={{
            width: '65px',
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: '0.57rem',
            fontWeight: 600,
            textAlign: 'right',
            padding: '3px 5px',
            flexShrink: 0,
            backgroundColor: 'transparent',
          }}
        />

        {/* Ingredient name (serif) */}
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => commitChanges(localQty, localName)}
          placeholder="Ingredient name..."
          className="recipe-edit-input flex-1"
          style={{
            fontFamily: "var(--font-header, 'Playfair Display', serif)",
            fontSize: '0.6rem',
            padding: '3px 5px',
            backgroundColor: 'transparent',
          }}
        />

        {/* Secret Toggle */}
        <button
          onClick={toggleSecret}
          className="p-0.5 rounded transition-all flex-shrink-0"
          aria-label={isSecret ? 'Remove secret' : 'Mark as secret'}
          title={isSecret ? 'Secret ingredient (click to reveal)' : 'Mark as secret ingredient'}
          style={{ color: isSecret ? 'var(--accent-gold, #D4AF37)' : 'var(--vine-sage, #86A789)' }}
        >
          {isSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(ingredient.id)}
          className="p-0.5 rounded transition-colors group flex-shrink-0"
          aria-label="Delete ingredient"
          title="Delete ingredient"
          style={{ color: 'var(--vine-sage)' }}
        >
          <Trash2 className="w-3 h-3 group-hover:text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default IngredientCard;
