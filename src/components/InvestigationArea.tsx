'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Target, MoreHorizontal } from 'lucide-react';
import { AreaOfInvestigation, UserStory, AgentId } from '@/types/investigation';
import { UserStoryCard } from './UserStoryCard';

interface InvestigationAreaProps {
  area: AreaOfInvestigation;
  stories: UserStory[];
  onStoryClick: (storyId: string) => void;
  onToggleExpand: (areaId: string) => void;
  isExpanded: boolean;
}

const agentColors: Record<AgentId, string> = {
  garion: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  silk: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  barak: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  polgara: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  cenedra: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
};

const agentNames: Record<AgentId, string> = {
  garion: 'Garion',
  silk: 'Silk',
  barak: 'Barak',
  polgara: 'Polgara',
  cenedra: "Ce'Nedra",
};

export function InvestigationArea({ 
  area, 
  stories, 
  onStoryClick,
  onToggleExpand,
  isExpanded 
}: InvestigationAreaProps) {
  const completedStories = stories.filter(s => s.status === 'done').length;
  const progress = stories.length > 0 ? Math.round((completedStories / stories.length) * 100) : 0;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      {/* Area Header */}
      <button
        onClick={() => onToggleExpand(area.id)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-800/50 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">{area.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded border ${agentColors[area.agentId]}`}>
              {agentNames[area.agentId]}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{progress}%</span>
            <span className="text-xs text-gray-500">
              {completedStories}/{stories.length} stories
            </span>
          </div>
        </div>

        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-800">
          <div className="p-4 space-y-3">
            {stories.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No user stories yet</p>
            ) : (
              stories.map((story) => (
                <UserStoryCard 
                  key={story.id} 
                  story={story} 
                  onClick={() => onStoryClick(story.id)}
                />
              ))
            )}
            
            <button className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-green-400 hover:border-green-500/50 transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add User Story</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
