'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { PlusCircle, Target, Clock, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  assignedAgent: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Timestamp | string;
}

const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Critical' },
  high: { bg: 'bg-amber-900/30', text: 'text-amber-400', label: 'High' },
  medium: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Medium' },
  low: { bg: 'bg-gray-800', text: 'text-gray-400', label: 'Low' },
};

const columnConfig = [
  { key: 'todo', label: 'To Do', icon: <Target className="w-4 h-4 text-gray-400" />, dot: 'bg-gray-400' },
  { key: 'in_progress', label: 'In Progress', icon: <Clock className="w-4 h-4 text-blue-400" />, dot: 'bg-blue-400 animate-pulse' },
  { key: 'done', label: 'Done', icon: <CheckCircle2 className="w-4 h-4 text-green-400" />, dot: 'bg-green-400' },
];

function TaskCard({ task, onMove }: { task: Task; onMove: (status: Task['status']) => void }) {
  const priority = priorityStyles[task.priority] || priorityStyles.low;
  const nextStatus: Record<string, Task['status']> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all group">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-white flex-1">{task.title}</h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
          {priority.label}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">{task.assignedAgent || 'Unassigned'}</span>
        <button
          onClick={() => onMove(nextStatus[task.status])}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-all px-2 py-1 rounded-lg hover:bg-gray-700"
        >
          <ArrowRight className="w-3 h-3" />
          {task.status === 'done' ? 'Reopen' : 'Move'}
        </button>
      </div>
    </div>
  );
}

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void }) {
  const [title, setTitle] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');

  const agents = ['Garion', 'Silk', 'Barak', 'Polgara', "Ce'Nedra", 'Relg', 'Taiba', 'Beldin', 'Durnik', 'Errand', 'Mandorallen'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), assignedAgent, status: 'todo', priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <h3 className="text-lg font-bold text-white mb-6">New Task</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Assign To</label>
            <select
              value={assignedAgent}
              onChange={(e) => setAssignedAgent(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((p) => {
                const style = priorityStyles[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      priority === p
                        ? `${style.bg} ${style.text} border-current`
                        : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Create Task
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tasksRef = collection(db, 'tasks');
    const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Task));
      setTasks(tasksData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const tasksRef = collection(db, 'tasks');
    await addDoc(tasksRef, {
      ...task,
      createdAt: Timestamp.now(),
    });
  };

  const handleMoveTask = async (taskId: string, newStatus: Task['status']) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Task Board</h2>
          <p className="text-sm text-gray-500 mt-1">{tasks.length} tasks total</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columnConfig.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                {col.icon}
                <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                <span className="ml-auto text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-gray-800/50 rounded-xl p-4 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : columnTasks.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-6">No tasks</p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMove={(status) => handleMoveTask(task.id, status)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />
      )}
    </div>
  );
}
