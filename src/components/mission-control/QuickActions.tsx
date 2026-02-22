/**
 * QuickActions - Mission Control v3
 * 
 * Floating action buttons for quick tasks
 */

'use client';

import React, { useState } from 'react';
import { Plus, X, CheckSquare, Target, FileText, Sparkles } from 'lucide-react';

interface QuickActionsProps {
  onCreateTask?: () => void;
  onCreateArea?: () => void;
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

export function QuickActions({ onCreateTask, onCreateArea }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: ActionButton[] = [
    {
      id: 'task',
      label: 'New Task',
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'bg-green-500 hover:bg-green-400',
      onClick: () => {
        onCreateTask?.();
        setIsOpen(false);
      },
    },
    {
      id: 'area',
      label: 'New Area',
      icon: <Target className="w-4 h-4" />,
      color: 'bg-blue-500 hover:bg-blue-400',
      onClick: () => {
        onCreateArea?.();
        setIsOpen(false);
      },
    },
    {
      id: 'note',
      label: 'Quick Note',
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-amber-500 hover:bg-amber-400',
      onClick: () => {
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Action Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-2 min-w-[160px]">
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`
                flex items-center gap-3 w-full px-4 py-3 rounded-xl
                ${action.color} text-white shadow-lg
                transform transition-all duration-200
                hover:scale-105 active:scale-95
              `}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          shadow-lg shadow-green-500/20
          transform transition-all duration-300
          ${isOpen 
            ? 'bg-gray-700 hover:bg-gray-600 rotate-45' 
            : 'bg-green-500 hover:bg-green-400 hover:scale-110'
          }
        `}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Glow Effect */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping -z-10" />
      )}
    </div>
  );
}

export default QuickActions;