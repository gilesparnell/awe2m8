# Firestore Collections Schema
## Mission Control Redesign

### areas_of_investigation
Epic-level work areas assigned to agents

```typescript
interface AreaOfInvestigation {
  id: string;
  title: string;
  description: string;
  agentId: 'garion' | 'silk' | 'barak' | 'polgara' | 'cenedra';
  status: 'planned' | 'in_progress' | 'completed';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  userStoryIds: string[];
  progressPercent: number;
  estimatedHours: number;
  actualHours: number;
}
```

### user_stories
User stories within an area

```typescript
interface UserStory {
  id: string;
  title: string;
  description: string;
  areaId: string;
  agentId: string;
  status: 'inbox' | 'in_progress' | 'review' | 'done';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  acceptanceCriteria: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  taskIds: string[];
  deliverableUrl?: string;
  estimatedHours: number;
  actualHours: number;
  blockedBy?: string[];
}
```

### tasks
Individual tasks within a user story

```typescript
interface Task {
  id: string;
  title: string;
  storyId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'code' | 'research' | 'write' | 'review' | 'test';
  artifactUrl?: string;
  description: string;
  result?: string;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  progress: string;
  cost: number;
  exitCode?: number;
}
```

### considerations
User/agent considerations for an area

```typescript
interface Consideration {
  id: string;
  areaId: string;
  type: 'revenue_impact' | 'risk_assessment' | 'opportunity' | 'integration_note' | 'strategic';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'addressed' | 'dismissed';
  createdBy: 'agent' | 'user';
  agentResponse?: string;
  userComment?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
