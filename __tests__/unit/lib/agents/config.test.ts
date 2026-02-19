/**
 * @jest-environment node
 */

import {
  AGENT_CONFIGS,
  getAgentConfig,
  getActiveAgents,
  getSubAgents,
  agentCan,
  estimateTaskCost,
  shouldEscalate,
  getAgentSystemPrompt,
  AgentId,
} from '@/lib/agents/config';

describe('Agent Config', () => {
  describe('AGENT_CONFIGS', () => {
    it('should have all 5 agents defined', () => {
      expect(Object.keys(AGENT_CONFIGS)).toHaveLength(5);
      expect(AGENT_CONFIGS.garion).toBeDefined();
      expect(AGENT_CONFIGS.silk).toBeDefined();
      expect(AGENT_CONFIGS.barak).toBeDefined();
      expect(AGENT_CONFIGS.polgara).toBeDefined();
      expect(AGENT_CONFIGS.cenedra).toBeDefined();
    });

    it('should have correct Belgariad names', () => {
      expect(AGENT_CONFIGS.garion.belgariadName).toContain('Belgarion');
      expect(AGENT_CONFIGS.silk.belgariadName).toContain('Kheldar');
      expect(AGENT_CONFIGS.barak.belgariadName).toContain('Barak');
      expect(AGENT_CONFIGS.polgara.belgariadName).toContain('Polgara');
      expect(AGENT_CONFIGS.cenedra.belgariadName).toContain("Ce'Nedra");
    });

    it('should have unique roles', () => {
      const roles = Object.values(AGENT_CONFIGS).map((a) => a.role);
      const uniqueRoles = new Set(roles);
      expect(uniqueRoles.size).toBe(roles.length);
    });
  });

  describe('getAgentConfig', () => {
    it('should return config for valid agent', () => {
      const config = getAgentConfig('silk');
      expect(config.id).toBe('silk');
      expect(config.name).toBe('Silk');
      expect(config.model.provider).toBe('openai');
    });

    it('should throw for invalid agent', () => {
      expect(() => getAgentConfig('invalid' as AgentId)).toThrow('Unknown agent');
    });
  });

  describe('getActiveAgents', () => {
    it('should return all agents except Ce\'Nedra', () => {
      const agents = getActiveAgents();
      const ids = agents.map((a) => a.id);
      expect(ids).toContain('garion');
      expect(ids).toContain('silk');
      expect(ids).toContain('barak');
      expect(ids).toContain('polgara');
      expect(ids).not.toContain('cenedra');
    });
  });

  describe('getSubAgents', () => {
    it('should return only sub-agents (no Garion, no Ce\'Nedra)', () => {
      const agents = getSubAgents();
      const ids = agents.map((a) => a.id);
      expect(ids).not.toContain('garion');
      expect(ids).toContain('silk');
      expect(ids).toContain('barak');
      expect(ids).toContain('polgara');
      expect(ids).not.toContain('cenedra');
    });
  });

  describe('agentCan', () => {
    it('should return true for valid capability', () => {
      expect(agentCan('silk', 'write_files')).toBe(true);
      expect(agentCan('barak', 'web_search')).toBe(true);
      expect(agentCan('polgara', 'web_fetch')).toBe(true);
    });

    it('should return false for invalid capability', () => {
      expect(agentCan('barak', 'spawn_subagents')).toBe(false);
      expect(agentCan('polgara', 'browser_automation')).toBe(false);
    });

    it('Garion should have all capabilities', () => {
      expect(agentCan('garion', 'read_files')).toBe(true);
      expect(agentCan('garion', 'write_files')).toBe(true);
      expect(agentCan('garion', 'spawn_subagents')).toBe(true);
      expect(agentCan('garion', 'send_messages')).toBe(true);
    });
  });

  describe('estimateTaskCost', () => {
    it('should calculate cost correctly', () => {
      // Garion: $3 per 1K tokens
      expect(estimateTaskCost('garion', 1000)).toBe(3.0);
      expect(estimateTaskCost('garion', 2000)).toBe(6.0);

      // Silk: $2 per 1K tokens
      expect(estimateTaskCost('silk', 1000)).toBe(2.0);

      // Barak/Polgara: $0.25 per 1K tokens
      expect(estimateTaskCost('barak', 1000)).toBe(0.25);
      expect(estimateTaskCost('polgara', 4000)).toBe(1.0);
    });
  });

  describe('shouldEscalate', () => {
    it('should never escalate for Garion', () => {
      expect(shouldEscalate('garion', 'cost_exceeded')).toBe(false);
      expect(shouldEscalate('garion', 'complex_reasoning_needed')).toBe(false);
    });

    it('should escalate for valid triggers', () => {
      expect(shouldEscalate('silk', 'complex_reasoning_needed')).toBe(true);
      expect(shouldEscalate('barak', 'complex_reasoning_needed')).toBe(true);
    });

    it('should not escalate for invalid triggers', () => {
      expect(shouldEscalate('silk', 'cost_exceeded')).toBe(false);
      expect(shouldEscalate('barak', 'unclear_task')).toBe(false);
    });
  });

  describe('getAgentSystemPrompt', () => {
    it('should include Belgariad name', () => {
      const prompt = getAgentSystemPrompt('silk');
      expect(prompt).toContain('Prince Kheldar');
      expect(prompt).toContain('Silk');
    });

    it('should include cost information', () => {
      const prompt = getAgentSystemPrompt('barak');
      expect(prompt).toContain('cost');
      expect(prompt).toContain('$0.25');
    });

    it('should include capabilities', () => {
      const prompt = getAgentSystemPrompt('polgara');
      expect(prompt).toContain('CAPABILITIES');
    });

    it('should include personality', () => {
      const prompt = getAgentSystemPrompt('garion');
      expect(prompt).toContain('Belgarion');
      expect(prompt).toContain('Overlord');
    });
  });

  describe('Model Configuration', () => {
    it('Garion should use Claude 4.5 Sonnet', () => {
      expect(AGENT_CONFIGS.garion.model.provider).toBe('anthropic');
      expect(AGENT_CONFIGS.garion.model.model).toBe('claude-sonnet-4');
    });

    it('Silk should use Codex', () => {
      expect(AGENT_CONFIGS.silk.model.provider).toBe('openai');
      expect(AGENT_CONFIGS.silk.model.model).toBe('codex');
      expect(AGENT_CONFIGS.silk.model.temperature).toBe(0.3); // Lower for code
    });

    it('Barak and Polgara should use cheap models', () => {
      expect(AGENT_CONFIGS.barak.model.provider).toBe('moonshot');
      expect(AGENT_CONFIGS.polgara.model.provider).toBe('moonshot');
      expect(AGENT_CONFIGS.barak.costProfile.estimatedCostPer1KTokens).toBe(0.25);
    });

    it("Ce'Nedra should use xAI Grok", () => {
      expect(AGENT_CONFIGS.cenedra.model.provider).toBe('xai');
      expect(AGENT_CONFIGS.cenedra.model.model).toBe('grok');
    });
  });

  describe('Budget Configuration', () => {
    it('should have daily budgets', () => {
      expect(AGENT_CONFIGS.garion.costProfile.dailyBudget).toBeGreaterThan(0);
      expect(AGENT_CONFIGS.silk.costProfile.dailyBudget).toBeGreaterThan(0);
      expect(AGENT_CONFIGS.barak.costProfile.dailyBudget).toBeGreaterThan(0);
    });

    it('Garion should have highest budget', () => {
      const garionBudget = AGENT_CONFIGS.garion.costProfile.dailyBudget;
      const silkBudget = AGENT_CONFIGS.silk.costProfile.dailyBudget;
      const barakBudget = AGENT_CONFIGS.barak.costProfile.dailyBudget;

      expect(garionBudget).toBeGreaterThan(silkBudget);
      expect(garionBudget).toBeGreaterThan(barakBudget);
    });
  });
});
