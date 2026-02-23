/**
 * Agents API Route (Server-side with Admin SDK)
 * 
 * GET /api/agents — returns list of all agents with their status
 * Uses Firebase Admin SDK to bypass Firestore security rules
 */

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Default agent data - returned if no agents exist in Firebase
const DEFAULT_AGENTS = [
  {
    id: 'garion',
    name: 'Garion',
    role: 'Master Controller',
    status: 'idle',
    currentTask: 'Monitoring system health',
    lastActivity: 'Just now',
    color: 'green',
    icon: 'Crown',
    isOnline: true,
    workload: 0
  },
  {
    id: 'silk',
    name: 'Silk',
    role: 'Code & Implementation',
    status: 'active',
    currentTask: 'Building new features',
    lastActivity: '2 mins ago',
    color: 'blue',
    icon: 'Bot',
    isOnline: true,
    workload: 2
  },
  {
    id: 'barak',
    name: 'Barak',
    role: 'Research & Data',
    status: 'active',
    currentTask: 'Analyzing market trends',
    lastActivity: '5 mins ago',
    color: 'amber',
    icon: 'Target',
    isOnline: true,
    workload: 1
  },
  {
    id: 'polgara',
    name: 'Polgara',
    role: 'Content & Writing',
    status: 'idle',
    currentTask: 'Reviewing content strategy',
    lastActivity: '15 mins ago',
    color: 'purple',
    icon: 'FileText',
    isOnline: true,
    workload: 0
  },
  {
    id: 'cenedra',
    name: "Ce'Nedra",
    role: 'UX & Strategy',
    status: 'active',
    currentTask: 'Designing user flows',
    lastActivity: '3 mins ago',
    color: 'green',
    icon: 'Layout',
    isOnline: true,
    workload: 1
  },
  {
    id: 'relg',
    name: 'Relg',
    role: 'Growth & Marketing',
    status: 'idle',
    currentTask: 'Planning campaign',
    lastActivity: '30 mins ago',
    color: 'blue',
    icon: 'Rocket',
    isOnline: false,
    workload: 0
  },
  {
    id: 'taiba',
    name: 'Taiba',
    role: 'Analytics',
    status: 'active',
    currentTask: 'Generating reports',
    lastActivity: '8 mins ago',
    color: 'amber',
    icon: 'TrendingUp',
    isOnline: true,
    workload: 3
  },
  {
    id: 'beldin',
    name: 'Beldin',
    role: 'QA & Oversight',
    status: 'active',
    currentTask: 'Reviewing code quality',
    lastActivity: '10 mins ago',
    color: 'purple',
    icon: 'ShieldCheck',
    isOnline: true,
    workload: 2
  },
  {
    id: 'durnik',
    name: 'Durnik',
    role: 'Infrastructure & DevOps',
    status: 'idle',
    currentTask: 'Maintaining servers',
    lastActivity: '1 hour ago',
    color: 'green',
    icon: 'Wrench',
    isOnline: true,
    workload: 0
  },
  {
    id: 'errand',
    name: 'Errand',
    role: 'General Tasks',
    status: 'idle',
    currentTask: 'Awaiting assignment',
    lastActivity: '2 hours ago',
    color: 'blue',
    icon: 'Sparkles',
    isOnline: false,
    workload: 0
  },
  {
    id: 'mandorallen',
    name: 'Mandorallen',
    role: 'Security & Compliance',
    status: 'active',
    currentTask: 'Security audit',
    lastActivity: '12 mins ago',
    color: 'amber',
    icon: 'Sword',
    isOnline: true,
    workload: 1
  }
];

export async function GET() {
  try {
    const db = getAdminDb();
    
    // Try to fetch agents from Firebase
    const agentsSnapshot = await db.collection('agents').get();
    
    // If no agents exist in Firebase, return defaults
    if (agentsSnapshot.empty) {
      console.log('[Agents API] No agents found in Firebase, returning defaults');
      return NextResponse.json({ 
        success: true, 
        agents: DEFAULT_AGENTS,
        source: 'defaults'
      });
    }

    // Map Firebase data to Agent format
    const agents = agentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id,
        role: data.role || 'Agent',
        status: data.status || 'idle',
        currentTask: data.currentTask || 'No active task',
        lastActivity: data.lastActivity || 'Unknown',
        color: data.color || 'green',
        icon: data.icon || 'Bot',
        isOnline: data.isOnline || false,
        workload: data.workload || 0
      };
    });

    return NextResponse.json({ 
      success: true, 
      agents,
      source: 'firebase'
    });
  } catch (error) {
    console.error('[Agents API] Error:', error);
    
    // Return default agents on error
    return NextResponse.json({ 
      success: true, 
      agents: DEFAULT_AGENTS,
      source: 'defaults (error fallback)',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
