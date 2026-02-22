/**
 * Mission Control Board Page
 * 
 * Kanban-style task board view
 */

'use client';

import { useState } from 'react';
import { useAgents, DEFAULT_AGENTS, DEFAULT_TASKS } from '@/hooks/useAgents';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { Loader2, CheckSquare } from 'lucide-react';

const columns = ['inbox', 'in_progress', 'review', 'done'] as const;
const columnNames = { 
  inbox: 'Inbox', 
  in_progress: 'In Progress', 
  review: 'Review', 
  done: 'Done' 
};

const priorityColors = {
  P0: 'bg-red-500/20 text-red-400 border-red-500/50',
  P1: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  P2: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  P3: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
};

export default function BoardPage() {
  const { agents, tasks, loading } = useAgents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const displayAgents = agents.length > 0 ? agents : DEFAULT_AGENTS;
  const displayTasks = tasks.length > 0 ? tasks : DEFAULT_TASKS;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div>
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={() => setIsCreateModalOpen(false)}
        agents={displayAgents.map(a => ({ id: a.id, name: a.name, color: a.color }))}
        creating={false}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-green-400" />
          Task Board
        </h1>
        <p className="text-gray-500 mt-1">Manage and track agent tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
              <h3 className="font-semibold text-white">{columnNames[column]}</h3>
              <span className="text-gray-500 text-sm">
                {displayTasks.filter(t => t.status === column).length}
              </span>
            </div>
            <div className="space-y-3">
              {displayTasks.filter(t => t.status === column).map((task) => {
                const agent = displayAgents.find(a => a.id === task.agentId);
                const colorClass = agent?.color === 'green' ? 'text-green-400 bg-green-900/30' :
                                  agent?.color === 'blue' ? 'text-blue-400 bg-blue-900/30' :
                                  'text-amber-400 bg-amber-900/30';
                return (
                  <div 
                    key={task.id} 
                    className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">
                        {task.title}
                      </h4>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.progressPercent !== undefined && task.progressPercent > 0 && (
                      <div className="mb-2">
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-400 rounded-full" 
                            style={{ width: `${task.progressPercent}%` }} 
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{task.progressPercent}%</div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                        {agent?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {displayTasks.filter(t => t.status === column).length === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 z-40"
      >
        <span className="text-2xl text-white">+</span>
      </button>
    </div>
  );
}
