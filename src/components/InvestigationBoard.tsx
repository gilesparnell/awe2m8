'use client';

import { useState } from 'react';
import { Plus, Target, Loader2 } from 'lucide-react';
import { useInvestigations, useUserStories } from '@/hooks/useInvestigations';
import { InvestigationArea } from './InvestigationArea';
import { AreaOfInvestigation } from '@/types/investigation';

interface InvestigationBoardProps {
  onStoryClick?: (storyId: string) => void;
}

export function InvestigationBoard({ onStoryClick }: InvestigationBoardProps) {
  const { areas, loading: areasLoading, error: areasError } = useInvestigations();
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const toggleExpand = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  if (areasLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
      </div>
    );
  }

  if (areasError) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-400">Error loading investigations: {areasError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Areas of Investigation
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {areas.length} active investigation{areas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-800 rounded-lg text-green-400 hover:bg-green-900/50 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Area</span>
        </button>
      </div>

      {/* Areas List */}
      {areas.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No investigations yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first area of investigation to get started</p>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-800 rounded-lg text-green-400 hover:bg-green-900/50 transition-colors mx-auto">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create First Area</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {areas.map((area) => (
            <AreaWithStories
              key={area.id}
              area={area}
              isExpanded={expandedAreas.has(area.id)}
              onToggleExpand={toggleExpand}
              onStoryClick={onStoryClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component to handle stories per area
function AreaWithStories({
  area,
  isExpanded,
  onToggleExpand,
  onStoryClick,
}: {
  area: AreaOfInvestigation;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onStoryClick?: (id: string) => void;
}) {
  const { stories, loading } = useUserStories(isExpanded ? area.id : undefined);

  return (
    <InvestigationArea
      area={area}
      stories={stories}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      onStoryClick={onStoryClick || (() => {})}
    />
  );
}
