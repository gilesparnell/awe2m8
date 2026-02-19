'use client';

import { UserStory, AgentId } from '@/types/investigation';
import { Clock, CheckCircle2, Eye, FileText, AlertCircle } from 'lucide-react';

interface UserStoryCardProps {
  story: UserStory;
  onClick?: () => void;
}

const agentColors: Record<AgentId, string> = {
  garion: 'bg-purple-500/20 text-purple-400',
  silk: 'bg-blue-500/20 text-blue-400',
  barak: 'bg-amber-500/20 text-amber-400',
  polgara: 'bg-emerald-500/20 text-emerald-400',
  cenedra: 'bg-pink-500/20 text-pink-400',
};

const agentNames: Record<AgentId, string> = {
  garion: 'Garion',
  silk: 'Silk',
  barak: 'Barak',
  polgara: 'Polgara',
  cenedra: "Ce'Nedra",
};

const statusConfig = {
  inbox: { 
    label: 'Inbox', 
    color: 'bg-gray-500/20 text-gray-400',
    icon: FileText 
  },
  in_progress: { 
    label: 'In Progress', 
    color: 'bg-blue-500/20 text-blue-400',
    icon: Clock 
  },
  review: { 
    label: 'Review', 
    color: 'bg-purple-500/20 text-purple-400',
    icon: Eye 
  },
  done: { 
    label: 'Done', 
    color: 'bg-green-500/20 text-green-400',
    icon: CheckCircle2 
  },
};

const priorityColors = {
  P0: 'bg-red-500/20 text-red-400',
  P1: 'bg-orange-500/20 text-orange-400',
  P2: 'bg-blue-500/20 text-blue-400',
  P3: 'bg-gray-500/20 text-gray-400',
};

export function UserStoryCard({ story, onClick }: UserStoryCardProps) {
  const status = statusConfig[story.status];
  const StatusIcon = status.icon;

  return (
    <div 
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all cursor-pointer group border border-transparent hover:border-gray-700"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-medium text-white group-hover:text-green-400 transition-colors flex-1">
          {story.title}
        </h4>
        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[story.priority]}`}>
          {story.priority}
        </span>
      </div>

      <p className="text-xs text-gray-400 line-clamp-2 mb-3">
        {story.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${agentColors[story.agentId]}`}>
            {agentNames[story.agentId]}
          </span>
        </div>

        {story.deliverableUrl && (
          <a 
            href={story.deliverableUrl}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
          >
            <FileText className="w-3 h-3" />
            Deliverable
          </a>
        )}
      </div>

      {/* Progress indicator if in progress */}
      {story.status === 'in_progress' && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-400 rounded-full animate-pulse"
              style={{ width: '30%' }}
            />
          </div>
          <span className="text-xs text-blue-400">Active</span>
        </div>
      )}

      {/* Blocked indicator */}
      {story.blockedBy && story.blockedBy.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
          <AlertCircle className="w-3 h-3" />
          Blocked by {story.blockedBy.length} story{story.blockedBy.length > 1 ? 'ies' : 'y'}
        </div>
      )}
    </div>
  );
}
