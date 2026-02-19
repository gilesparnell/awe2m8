/**
 * Firestore Hooks for Investigation System
 * 
 * Real-time hooks for Areas, User Stories, and Tasks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  DocumentData
} from 'firebase/firestore';
import { 
  AreaOfInvestigation, 
  UserStory, 
  Task,
  Consideration,
  CreateAreaInput,
  CreateStoryInput,
  CreateTaskInput,
  CreateConsiderationInput,
  AgentId
} from '@/types/investigation';

// ============================================================================
// AREAS OF INVESTIGATION
// ============================================================================

export function useInvestigations() {
  const [areas, setAreas] = useState<AreaOfInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const q = query(
      collection(db, 'areas_of_investigation'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const areasData: AreaOfInvestigation[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          areasData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            agentId: data.agentId,
            status: data.status,
            priority: data.priority,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
            userStoryIds: data.userStoryIds || [],
            progressPercent: data.progressPercent || 0,
            estimatedHours: data.estimatedHours || 0,
            actualHours: data.actualHours || 0,
          });
        });
        setAreas(areasData);
        setLoading(false);
      },
      (err) => {
        console.error('[useInvestigations] Error:', err);
        setError('Failed to load investigations');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createArea = useCallback(async (input: CreateAreaInput) => {
    const now = Timestamp.now();
    const areaData = {
      ...input,
      status: 'planned',
      createdAt: now,
      updatedAt: now,
      userStoryIds: [],
      progressPercent: 0,
      actualHours: 0,
    };
    
    const docRef = await addDoc(collection(db, 'areas_of_investigation'), areaData);
    return docRef.id;
  }, []);

  const updateArea = useCallback(async (areaId: string, updates: Partial<AreaOfInvestigation>) => {
    await updateDoc(doc(db, 'areas_of_investigation', areaId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }, []);

  const deleteArea = useCallback(async (areaId: string) => {
    await deleteDoc(doc(db, 'areas_of_investigation', areaId));
  }, []);

  return { areas, loading, error, createArea, updateArea, deleteArea };
}

// ============================================================================
// USER STORIES
// ============================================================================

export function useUserStories(areaId?: string) {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    let q = query(
      collection(db, 'user_stories'),
      orderBy('createdAt', 'desc')
    );
    
    if (areaId) {
      q = query(q, where('areaId', '==', areaId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData: UserStory[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        storiesData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          areaId: data.areaId,
          agentId: data.agentId,
          status: data.status,
          priority: data.priority,
          acceptanceCriteria: data.acceptanceCriteria || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          taskIds: data.taskIds || [],
          deliverableUrl: data.deliverableUrl,
          deliverableType: data.deliverableType,
          estimatedHours: data.estimatedHours || 0,
          actualHours: data.actualHours || 0,
          blockedBy: data.blockedBy,
        });
      });
      setStories(storiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [areaId]);

  const createStory = useCallback(async (input: CreateStoryInput) => {
    const now = Timestamp.now();
    const storyData = {
      ...input,
      status: 'inbox',
      createdAt: now,
      updatedAt: now,
      taskIds: [],
      actualHours: 0,
    };
    
    const docRef = await addDoc(collection(db, 'user_stories'), storyData);
    
    // Update area with new story ID
    await updateDoc(doc(db, 'areas_of_investigation', input.areaId), {
      userStoryIds: arrayUnion(docRef.id),
      updatedAt: now,
    });
    
    return docRef.id;
  }, []);

  const updateStory = useCallback(async (storyId: string, updates: Partial<UserStory>) => {
    await updateDoc(doc(db, 'user_stories', storyId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }, []);

  const moveStory = useCallback(async (storyId: string, newStatus: UserStory['status']) => {
    const updates: any = { status: newStatus, updatedAt: Timestamp.now() };
    
    if (newStatus === 'in_progress' && !stories.find(s => s.id === storyId)?.startedAt) {
      updates.startedAt = Timestamp.now();
    }
    if (newStatus === 'done') {
      updates.completedAt = Timestamp.now();
    }
    
    await updateDoc(doc(db, 'user_stories', storyId), updates);
  }, [stories]);

  return { stories, loading, createStory, updateStory, moveStory };
}

// ============================================================================
// TASKS
// ============================================================================

export function useTasks(storyId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    let q = query(
      collection(db, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    
    if (storyId) {
      q = query(q, where('storyId', '==', storyId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tasksData.push({
          id: doc.id,
          title: data.title,
          storyId: data.storyId,
          agentId: data.agentId,
          status: data.status,
          type: data.type,
          artifactUrl: data.artifactUrl,
          artifactType: data.artifactType,
          description: data.description,
          result: data.result,
          createdAt: data.createdAt,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          progress: data.progress || '',
          cost: data.cost || 0,
          exitCode: data.exitCode,
          metadata: data.metadata,
        });
      });
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storyId]);

  const createTask = useCallback(async (input: CreateTaskInput) => {
    const now = Timestamp.now();
    const taskData = {
      ...input,
      status: 'pending',
      progress: 'Waiting to start...',
      createdAt: now,
      cost: 0,
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), taskData);
    
    // Update story with new task ID
    await updateDoc(doc(db, 'user_stories', input.storyId), {
      taskIds: arrayUnion(docRef.id),
      updatedAt: now,
    });
    
    return docRef.id;
  }, []);

  const updateTaskProgress = useCallback(async (taskId: string, progress: string, metadata?: Task['metadata']) => {
    const updates: any = { progress, updatedAt: Timestamp.now() };
    if (metadata) updates.metadata = metadata;
    await updateDoc(doc(db, 'tasks', taskId), updates);
  }, []);

  const completeTask = useCallback(async (taskId: string, result: string, cost: number) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      status: 'completed',
      result,
      cost,
      completedAt: Timestamp.now(),
      progress: 'Completed',
    });
  }, []);

  return { tasks, loading, createTask, updateTaskProgress, completeTask };
}

// ============================================================================
// CONSIDERATIONS
// ============================================================================

export function useConsiderations(areaId?: string) {
  const [considerations, setConsiderations] = useState<Consideration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    let q = query(
      collection(db, 'considerations'),
      orderBy('createdAt', 'desc')
    );
    
    if (areaId) {
      q = query(q, where('areaId', '==', areaId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const considerationsData: Consideration[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        considerationsData.push({
          id: doc.id,
          areaId: data.areaId,
          type: data.type,
          title: data.title,
          description: data.description,
          severity: data.severity,
          status: data.status,
          createdBy: data.createdBy,
          agentResponse: data.agentResponse,
          userComment: data.userComment,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setConsiderations(considerationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [areaId]);

  const createConsideration = useCallback(async (input: CreateConsiderationInput) => {
    const now = Timestamp.now();
    const considerationData = {
      ...input,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, 'considerations'), considerationData);
    return docRef.id;
  }, []);

  const updateConsideration = useCallback(async (considerationId: string, updates: Partial<Consideration>) => {
    await updateDoc(doc(db, 'considerations', considerationId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }, []);

  const dismissConsideration = useCallback(async (considerationId: string, userComment?: string) => {
    await updateDoc(doc(db, 'considerations', considerationId), {
      status: 'dismissed',
      userComment,
      updatedAt: Timestamp.now(),
    });
  }, []);

  const repromptConsideration = useCallback(async (considerationId: string, agentResponse: string) => {
    await updateDoc(doc(db, 'considerations', considerationId), {
      agentResponse,
      updatedAt: Timestamp.now(),
    });
  }, []);

  return { 
    considerations, 
    loading, 
    createConsideration, 
    updateConsideration,
    dismissConsideration,
    repromptConsideration
  };
}

// ============================================================================
// AGENT ACTIVITY (REAL-TIME)
// ============================================================================

export function useAgentActivity(agentId?: AgentId) {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    let q = query(
      collection(db, 'agent_activities'),
      orderBy('timestamp', 'desc')
    );
    
    if (agentId) {
      q = query(q, where('agentId', '==', agentId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesData: any[] = [];
      snapshot.forEach((doc) => {
        activitiesData.push({ id: doc.id, ...doc.data() });
      });
      setActivities(activitiesData);
    });

    return () => unsubscribe();
  }, [agentId]);

  return { activities };
}

// Helper function
function arrayUnion(...elements: any[]) {
  return { arrayUnion: elements };
}
