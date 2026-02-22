/**
 * Mission Control Settings Page
 * 
 * Workspace file browser and editor
 */

'use client';

import React, { useState } from 'react';
import { Settings, FileText, Edit3, Save, X } from 'lucide-react';

interface FileItem {
  name: string;
  description: string;
  priority: 'critical' | 'important' | 'standard';
}

const FILES: FileItem[] = [
  { name: 'SOUL.md', description: 'Agent personality and behavior rules', priority: 'critical' },
  { name: 'USER.md', description: 'User profile and preferences', priority: 'critical' },
  { name: 'AGENTS.md', description: 'Agent definitions and squad config', priority: 'critical' },
  { name: 'WORKING.md', description: 'Current active priorities', priority: 'important' },
  { name: 'GOALS.md', description: 'Business goals and targets', priority: 'important' },
  { name: 'TOOLS.md', description: 'Local environment notes', priority: 'standard' },
  { name: 'HEARTBEAT.md', description: 'Periodic check configuration', priority: 'standard' },
];

const priorityColors = {
  critical: 'bg-red-500/20 text-red-400',
  important: 'bg-amber-500/20 text-amber-400',
  standard: 'bg-gray-500/20 text-gray-400',
};

export default function SettingsPage() {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-green-400" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage workspace configuration files</p>
      </div>

      {/* File Browser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FILES.map((file) => (
          <button
            key={file.name}
            onClick={() => setSelectedFile(file)}
            className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-green-500/30 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-white">{file.name}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityColors[file.priority]}`}>
                  {file.priority}
                </span>
              </div>
              <p className="text-sm text-gray-500">{file.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Coming Soon Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">{selectedFile.name}</h2>
              <span className={`text-xs px-2 py-1 rounded ${priorityColors[selectedFile.priority]}`}>
                {selectedFile.priority}
              </span>
            </div>

            <p className="text-gray-400 mb-6">{selectedFile.description}</p>

            <div className="bg-gray-800/50 rounded-xl p-8 text-center">
              <Edit3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">File Editor</h3>
              <p className="text-gray-500 text-sm">
                Full editing capability coming in Phase 2.
                <br />
                File: {selectedFile.name}
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
