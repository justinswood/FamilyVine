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
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ fontFamily: "var(--font-header, 'Playfair Display', serif)", fontSize: '0.77rem', fontWeight: 700, color: 'var(--vine-dark, #2D4F1E)' }}>
            Instructions
          </h3>
          <p style={{ fontSize: '0.49rem', color: 'var(--vine-sage, #86A789)', fontFamily: 'var(--font-body)' }}>
            Write step-by-step instructions
          </p>
        </div>
        <button
          onClick={handleAddStep}
          className="recipe-btn-sage"
        >
          <Plus className="w-3 h-3" />
          Add Step
        </button>
      </div>

      {/* Steps List */}
      {steps.length === 0 ? (
        <div className="text-center py-8 rounded-md border-2 border-dashed" style={{ backgroundColor: 'var(--alabaster-parchment, #F5F0E6)', borderColor: 'rgba(212, 175, 55, 0.25)' }}>
          <p style={{ color: 'var(--vine-sage)', fontSize: '0.6rem', marginBottom: '8px' }}>
            No instructions yet
          </p>
          <button
            onClick={handleAddStep}
            style={{ color: 'var(--vine-dark)', fontWeight: 600, fontSize: '0.6rem' }}
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
            <div className="space-y-1.5">
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
        <p style={{ fontSize: '0.52rem', color: 'var(--vine-sage)', marginTop: '6px' }}>
          {steps.length} {steps.length === 1 ? 'step' : 'steps'}
        </p>
      )}
    </div>
  );
};

export default InstructionStepsEditor;
