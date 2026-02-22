/**
 * Test API route to verify cost tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { logActivityServer, logWebSearchServer, logAgentSpawnServer } from '@/lib/activity-logger-server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing cost tracking via API...');

    // Test 1: Basic activity with cost
    const activityId = await logActivityServer({
      actor: 'garion',
      actorType: 'main',
      category: 'tool',
      action: 'run',
      description: 'API test activity with cost tracking',
      cost: 0.025, // 2.5 cents
      metadata: { test: true, source: 'api' }
    });

    // Test 2: Web search with cost
    const searchId = await logWebSearchServer(
      'api test query for cost tracking',
      3,
      'garion',
      { test: true, source: 'api' },
      0.015 // 1.5 cents
    );

    // Test 3: Agent spawn with cost
    const spawnId = await logAgentSpawnServer(
      'silk',
      'API test coding task with cost',
      'garion',
      { test: true, source: 'api', estimatedCost: 0.075 },
      0.075 // 7.5 cents
    );

    console.log('✅ Cost tracking test completed:', {
      activityId,
      searchId,
      spawnId
    });

    return NextResponse.json({
      success: true,
      message: 'Cost tracking test completed',
      results: {
        activityId,
        searchId,
        spawnId,
        totalCost: 0.025 + 0.015 + 0.075
      }
    });

  } catch (error) {
    console.error('❌ Cost tracking test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}