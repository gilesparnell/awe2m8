'use client';

import React from 'react';
import { 
  Sword, Crown, Shield, Wand2, BookOpen, Target, 
  TrendingUp, Eye, Wrench, Sparkles, Swords,
  ExternalLink, Users
} from 'lucide-react';

interface AgentProfile {
  id: string;
  name: string;
  title: string;
  emoji: string;
  description: string;
  responsibilities: string[];
  model: string;
  color: string;
  icon: React.ReactNode;
  soulPath: string;
}

const agents: AgentProfile[] = [
  {
    id: 'garion',
    name: 'Garion',
    title: 'Belgarion — Master Controller',
    emoji: '⚔️',
    description: 'The reluctant farmboy who became king. Orchestrates the entire squad, makes strategic decisions, and keeps Gilo focused on what matters. Handles complex reasoning and delegates execution.',
    responsibilities: ['Strategic planning & orchestration', 'Sub-agent coordination', 'Quality review of critical work', 'Cost management & optimization', 'Focus protection for Gilo'],
    model: 'Claude Sonnet 4',
    color: 'green',
    icon: <Sword className="w-6 h-6" />,
    soulPath: 'SOUL.md',
  },
  {
    id: 'silk',
    name: 'Silk',
    title: 'Prince Kheldar — Code/Trickster',
    emoji: '🎭',
    description: 'The charming spy and master thief. Finds elegant solutions to complex problems. Builds the code, ships the features, and occasionally breaks the Tailwind config.',
    responsibilities: ['Frontend & backend development', 'Feature implementation', 'Bug fixes & refactoring', 'Technical architecture', 'Code optimization'],
    model: 'Claude Sonnet 4',
    color: 'blue',
    icon: <Wand2 className="w-6 h-6" />,
    soulPath: 'agents/silk/SOUL.md',
  },
  {
    id: 'barak',
    name: 'Barak',
    title: 'The Bear — Deep Research',
    emoji: '🐻',
    description: 'Reliable, thorough, and unstoppable. When you need to know something, Barak tears through data until he finds the answer. No shortcuts, no surprises.',
    responsibilities: ['Market & competitor research', 'Data gathering & analysis', 'Pricing intelligence', 'Technology assessments', 'Report writing'],
    model: 'Kimi K2.5',
    color: 'amber',
    icon: <Target className="w-6 h-6" />,
    soulPath: 'agents/barak/SOUL.md',
  },
  {
    id: 'polgara',
    name: 'Polgara',
    title: 'The Sorceress — Content & SEO',
    emoji: '🔮',
    description: 'Terrifying when disappointed. Writes words that make people feel things. Quality matters to her — a lot. She fills pages with magic.',
    responsibilities: ['Landing page copy', 'Blog posts & articles', 'SEO optimization', 'Email sequences', 'Brand voice development'],
    model: 'Kimi K2.5',
    color: 'purple',
    icon: <BookOpen className="w-6 h-6" />,
    soulPath: 'agents/polgara/SOUL.md',
  },
  {
    id: 'cenedra',
    name: "Ce'Nedra",
    title: 'The Queen — Product & UX Strategy',
    emoji: '👑',
    description: 'The strategist who sees patterns others miss. Sometimes you think she\'s overthinking, but she\'s usually right about user needs.',
    responsibilities: ['UX/UI strategy & design', 'User flow optimization', 'Product roadmap input', 'Competitor UX analysis', 'Mobile-first thinking'],
    model: 'Claude Sonnet 4',
    color: 'green',
    icon: <Crown className="w-6 h-6" />,
    soulPath: 'agents/cenedra/SOUL.md',
  },
  {
    id: 'beldin',
    name: 'Beldin',
    title: 'The Sorcerer — QA & Oversight',
    emoji: '🦅',
    description: 'The cynical CEO who\'s seen too many startups crash. Cuts through bullshit with surgical precision. Blunt, sometimes harsh, but always honest.',
    responsibilities: ['Code quality oversight', 'Performance audits', 'Claims verification', 'Risk assessment', 'Brutal honesty reports'],
    model: 'Kimi K2.5',
    color: 'amber',
    icon: <Eye className="w-6 h-6" />,
    soulPath: 'agents/beldin/SOUL.md',
  },
  {
    id: 'taiba',
    name: 'Taiba',
    title: 'The Marag — Analytics & Growth',
    emoji: '📊',
    description: 'Sees connections in data that others miss. Tells you what\'s working so you can prioritize what to build next.',
    responsibilities: ['Analytics dashboards', 'Conversion analysis', 'A/B test design', 'ROI calculations', 'Growth metrics tracking'],
    model: 'Kimi K2.5',
    color: 'blue',
    icon: <TrendingUp className="w-6 h-6" />,
    soulPath: 'agents/taiba/SOUL.md',
  },
  {
    id: 'relg',
    name: 'Relg',
    title: 'The Zealot — Growth & Marketing',
    emoji: '⛪',
    description: 'Obsessive, methodical, and relentless in pursuit of growth. Finds leads in the dark places others are afraid to look.',
    responsibilities: ['Marketing campaigns', 'Lead generation strategies', 'Ad copy & creatives', 'Growth hacking', 'Channel optimization'],
    model: 'Kimi K2.5',
    color: 'purple',
    icon: <Sparkles className="w-6 h-6" />,
    soulPath: 'agents/relg/SOUL.md',
  },
  {
    id: 'durnik',
    name: 'Durnik',
    title: 'The Smith — Operations & Infrastructure',
    emoji: '🔧',
    description: 'The steady hand that keeps the wheels turning. Shapes raw chaos into functional order through patient craft and systematic optimization.',
    responsibilities: ['Infrastructure maintenance', 'DevOps & deployment', 'System monitoring', 'Performance optimization', 'Operational workflows'],
    model: 'Kimi K2.5',
    color: 'green',
    icon: <Wrench className="w-6 h-6" />,
    soulPath: 'agents/durnik/SOUL.md',
  },
  {
    id: 'errand',
    name: 'Errand',
    title: 'The Child — Feedback & Training',
    emoji: '✨',
    description: 'The eternal student who teaches and the eternal teacher who learns. Sees potential where others see only current limitations.',
    responsibilities: ['Agent training & feedback', 'Process documentation', 'Knowledge base building', 'Onboarding workflows', 'Capability assessment'],
    model: 'Kimi K2.5',
    color: 'blue',
    icon: <Sparkles className="w-6 h-6" />,
    soulPath: 'agents/errand/SOUL.md',
  },
  {
    id: 'mandorallen',
    name: 'Mandorallen',
    title: 'The Knight — Security & Compliance',
    emoji: '🛡️',
    description: 'The unwavering shield. Stands as the last line of defense between chaos and order, between vulnerability and security.',
    responsibilities: ['Security audits', 'Compliance checks', 'Access control review', 'Vulnerability assessment', 'Policy enforcement'],
    model: 'Kimi K2.5',
    color: 'amber',
    icon: <Shield className="w-6 h-6" />,
    soulPath: 'agents/mandorallen/SOUL.md',
  },
];

const colorStyles: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  green: { bg: 'bg-green-900/10', border: 'border-green-800/50', text: 'text-green-400', iconBg: 'bg-green-900/30' },
  blue: { bg: 'bg-blue-900/10', border: 'border-blue-800/50', text: 'text-blue-400', iconBg: 'bg-blue-900/30' },
  amber: { bg: 'bg-amber-900/10', border: 'border-amber-800/50', text: 'text-amber-400', iconBg: 'bg-amber-900/30' },
  purple: { bg: 'bg-purple-900/10', border: 'border-purple-800/50', text: 'text-purple-400', iconBg: 'bg-purple-900/30' },
};

function AgentCard({ agent }: { agent: AgentProfile }) {
  const style = colorStyles[agent.color] || colorStyles.green;

  return (
    <div className={`${style.bg} rounded-2xl border ${style.border} p-6 hover:border-opacity-100 transition-all group`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-14 h-14 ${style.iconBg} border ${style.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <span className={style.text}>{agent.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{agent.emoji}</span>
            <h3 className="text-lg font-bold text-white">{agent.name}</h3>
          </div>
          <p className={`text-sm font-medium ${style.text}`}>{agent.title}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed mb-4">
        {agent.description}
      </p>

      {/* Responsibilities */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Responsibilities</p>
        <div className="flex flex-wrap gap-1.5">
          {agent.responsibilities.map((r, i) => (
            <span key={i} className="text-xs bg-gray-800/80 text-gray-300 px-2 py-1 rounded-md">
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Model:</span>
          <span className={`text-xs font-medium ${style.text}`}>{agent.model}</span>
        </div>
        <a
          href={`https://github.com/gilesparnell/openclaw/blob/main/${agent.soulPath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <ExternalLink className="w-3 h-3" />
          SOUL.md
        </a>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-900/30 border border-green-800 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">The Belgariad Squad</h1>
            <p className="text-sm text-gray-400">Your AI agent fleet — 11 specialists inspired by David Eddings</p>
          </div>
        </div>

        {/* Fleet summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-2xl font-bold text-white">11</p>
            <p className="text-xs text-gray-400">Total Agents</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-2xl font-bold text-green-400">3</p>
            <p className="text-xs text-gray-400">On Sonnet (premium)</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-2xl font-bold text-blue-400">8</p>
            <p className="text-xs text-gray-400">On Kimi K2.5 (budget)</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-2xl font-bold text-amber-400">$12</p>
            <p className="text-xs text-gray-400">Daily budget target</p>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-600">
          Named after characters from David Eddings&apos; <em>The Belgariad</em> series
        </p>
      </footer>
    </div>
  );
}
