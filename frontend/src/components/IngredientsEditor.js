import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import IngredientCard from './IngredientCard';

const IngredientsEditor = ({ value, onChange }) => {
  const [ingredients, setIngredients] = useState([]);
  const isInitializing = useRef(true);
  const lastValueRef = useRef(value);

  // Parse ingredients string into ingredient objects on mount or when value changes from outside
  useEffect(() => {
    // Only re-initialize if this is the first render
    if (isInitializing.current) {
      if (typeof value === 'string' && value.trim()) {
        // Split by newlines and create ingredient objects
        const lines = value.split('\n').filter(line => line.trim());
        const ingredientObjects = lines.map((line, index) => ({
          id: `ingredient-${Date.now()}-${index}`,
          text: line.replace(/^[-•]\s*/, ''), // Remove leading bullets
          order: index,
        }));
        setIngredients(ingredientObjects);
      } else if (value === '') {
        setIngredients([]);
      }
      // Mark initialization as complete after first render
      isInitializing.current = false;
    }
    lastValueRef.current = value;
  }, [value]);

  // Helper function to sync ingredients back to parent
  const syncToParent = (updatedIngredients) => {
    if (isInitializing.current) return; // Don't sync during initialization

    if (updatedIngredients.length > 0) {
      const ingredientsString = updatedIngredients.map(ing => ing.text).join('\n');
      onChange(ingredientsString);
    } else {
      onChange('');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor)
    // KeyboardSensor removed to prevent interference with text input
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setIngredients((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        syncToParent(reorderedItems);
        return reorderedItems;
      });
    }
  };

  const handleAddIngredient = () => {
    const newIngredient = {
      id: `ingredient-${Date.now()}`,
      text: '',
      order: ingredients.length,
    };
    const updatedIngredients = [...ingredients, newIngredient];
    setIngredients(updatedIngredients);
    syncToParent(updatedIngredients);
  };

  const handleUpdateIngredient = (id, text) => {
    const updatedIngredients = ingredients.map(ing =>
      ing.id === id ? { ...ing, text } : ing
    );
    setIngredients(updatedIngredients);
    syncToParent(updatedIngredients);
  };

  const handleDeleteIngredient = (id) => {
    const updatedIngredients = ingredients.filter(ing => ing.id !== id);
    setIngredients(updatedIngredients);
    syncToParent(updatedIngredients);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ingredients
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            List all ingredients with quantities
          </p>
        </div>
        <button
          onClick={handleAddIngredient}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500
                     hover:from-orange-600 hover:to-red-600 text-white rounded-lg
                     transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Ingredient
        </button>
      </div>

      {/* Ingredients List */}
      {ingredients.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No ingredients yet
          </p>
          <button
            onClick={handleAddIngredient}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
          >
            Add your first ingredient
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ingredients.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <IngredientCard
                  key={ingredient.id}
                  ingredient={ingredient}
                  index={index}
                  onUpdate={handleUpdateIngredient}
                  onDelete={handleDeleteIngredient}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Helper Text */}
      {ingredients.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {ingredients.length} {ingredients.length === 1 ? 'ingredient' : 'ingredients'}
        </p>
      )}
    </div>
  );
};

export default IngredientsEditor;
