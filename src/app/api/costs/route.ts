/**
 * Costs API Route (Server-side)
 * 
 * GET /api/costs — returns real cost data from LLM providers + Firebase activities
 * Pulls live balance from OpenRouter API
 */

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Manual cost entries for providers without API access
const MANUAL_COSTS: Record<string, number> = {
  anthropic: 15.00, // Manually tracked Anthropic direct spend
};

async function getOpenRouterUsage(): Promise<{ total: number; used: number; remaining: number } | null> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const res = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();

    if (data?.data) {
      return {
        total: data.data.total_credits || 0,
        used: data.data.total_usage || 0,
        remaining: (data.data.total_credits || 0) - (data.data.total_usage || 0),
      };
    }
    return null;
  } catch (err) {
    console.error('[Costs] OpenRouter API error:', err);
    return null;
  }
}

async function getFirebaseActivityCosts() {
  try {
    const db = getAdminDb();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const snapshot = await db
      .collection('activities')
      .orderBy('timestamp', 'desc')
      .get();

    let todayCost = 0;
    let weekCost = 0;
    let monthCost = 0;
    const costByAgent: Record<string, number> = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const cost = data.cost || 0;
      const ts = data.timestamp?.toDate?.()
        ? data.timestamp.toDate()
        : new Date(data.timestamp);

      if (ts >= todayStart) todayCost += cost;
      if (ts >= weekStart) weekCost += cost;
      if (ts >= monthStart) monthCost += cost;

      if (data.agentName) {
        costByAgent[data.agentName] = (costByAgent[data.agentName] || 0) + cost;
      }
    });

    return {
      todayCost: Math.round(todayCost * 1000) / 1000,
      weekCost: Math.round(weekCost * 1000) / 1000,
      monthCost: Math.round(monthCost * 1000) / 1000,
      costByAgent,
      totalActivities: snapshot.size,
    };
  } catch (err) {
    console.error('[Costs] Firebase error:', err);
    return { todayCost: 0, weekCost: 0, monthCost: 0, costByAgent: {}, totalActivities: 0 };
  }
}

export async function GET() {
  try {
    const [openRouter, activityCosts] = await Promise.all([
      getOpenRouterUsage(),
      getFirebaseActivityCosts(),
    ]);

    // Calculate total all-time spend across providers
    const openRouterSpend = openRouter?.used || 0;
    const anthropicSpend = MANUAL_COSTS.anthropic || 0;
    const totalAllTimeSpend = Math.round((openRouterSpend + anthropicSpend) * 100) / 100;

    return NextResponse.json({
      success: true,

      // Real provider data
      providers: {
        openRouter: openRouter
          ? {
              totalCredits: Math.round(openRouter.total * 100) / 100,
              totalUsed: Math.round(openRouter.used * 100) / 100,
              remaining: Math.round(openRouter.remaining * 100) / 100,
            }
          : null,
        anthropic: {
          totalUsed: anthropicSpend,
          note: 'Manually tracked',
        },
      },

      // Combined totals
      totalAllTimeSpend,

      // Activity-based costs (from Firebase seed/logged data)
      todayCost: activityCosts.todayCost,
      weekCost: activityCosts.weekCost,
      monthCost: activityCosts.monthCost,
      costByAgent: activityCosts.costByAgent,
      totalActivities: activityCosts.totalActivities,
    });
  } catch (error) {
    console.error('[API] Costs error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
