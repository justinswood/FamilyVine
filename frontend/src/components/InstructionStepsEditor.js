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
import InstructionStepCard from './InstructionStepCard';

const InstructionStepsEditor = ({ value, onChange }) => {
  const [steps, setSteps] = useState([]);
  const isInitializing = useRef(true);
  const lastValueRef = useRef(value);

  // Parse instructions string into steps on mount or when value changes from outside
  useEffect(() => {
    // Only re-initialize if this is the first render
    if (isInitializing.current) {
      if (typeof value === 'string' && value.trim()) {
        // Split by newlines and create step objects
        const lines = value.split('\n').filter(line => line.trim());
        const stepObjects = lines.map((line, index) => ({
          id: `step-${Date.now()}-${index}`,
          text: line.replace(/^\d+\.\s*/, ''), // Remove leading numbers like "1. "
          order: index,
        }));
        setSteps(stepObjects);
      } else if (value === '') {
        setSteps([]);
      }
      // Mark initialization as complete after first render
      isInitializing.current = false;
    }
    lastValueRef.current = value;
  }, [value]);

  // Helper function to sync steps back to parent
  const syncToParent = (updatedSteps) => {
    if (isInitializing.current) return; // Don't sync during initialization

    if (updatedSteps.length > 0) {
      const instructionsString = updatedSteps.map(step => step.text).join('\n');
      onChange(instructionsString);
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
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        syncToParent(reorderedItems);
        return reorderedItems;
      });
    }
  };

  const handleAddStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      text: '',
      order: steps.length,
    };
    const updatedSteps = [...steps, newStep];
    setSteps(updatedSteps);
    syncToParent(updatedSteps);
  };

  const handleUpdateStep = (id, text) => {
    const updatedSteps = steps.map(step =>
      step.id === id ? { ...step, text } : step
    );
    setSteps(updatedSteps);
    syncToParent(updatedSteps);
  };

  const handleDeleteStep = (id) => {
    const updatedSteps = steps.filter(step => step.id !== id);
    setSteps(updatedSteps);
    syncToParent(updatedSteps);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Instructions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag to reorder steps
          </p>
        </div>
        <button
          onClick={handleAddStep}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500
                     hover:from-orange-600 hover:to-red-600 text-white rounded-lg
                     transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>

      {/* Steps List */}
      {steps.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No instructions yet
          </p>
          <button
            onClick={handleAddStep}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
          >
            Add your first step
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {steps.map((step, index) => (
                <InstructionStepCard
                  key={step.id}
                  step={step}
                  index={index}
                  onUpdate={handleUpdateStep}
                  onDelete={handleDeleteStep}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Helper Text */}
      {steps.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {steps.length} {steps.length === 1 ? 'step' : 'steps'}
        </p>
      )}
    </div>
  );
};

export default InstructionStepsEditor;
