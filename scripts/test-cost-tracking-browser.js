/**
 * Simple test to verify cost tracking is working
 * Run this in the browser console or as part of a component
 */

// Test cost tracking functionality
async function testCostTracking() {
  console.log('🧪 Testing cost tracking functionality...');

  try {
    // Import the functions (this will work in browser context)
    const { logActivity, logWebSearch, logAgentSpawn } = await import('/src/lib/activity-logger');

    // Test 1: Basic activity with cost
    console.log('1. Testing basic activity with cost...');
    const activityId = await logActivity({
      actor: 'garion',
      actorType: 'main',
      category: 'tool',
      action: 'run',
      description: 'Test activity with cost tracking',
      cost: 0.025, // 2.5 cents
      metadata: { test: true }
    });
    console.log(`   ✅ Activity logged with ID: ${activityId}`);

    // Test 2: Web search with cost
    console.log('2. Testing web search with cost...');
    const searchId = await logWebSearch(
      'test query for cost tracking',
      5,
      'garion',
      { test: true },
      0.015 // 1.5 cents
    );
    console.log(`   ✅ Web search logged with ID: ${searchId}`);

    // Test 3: Agent spawn with cost
    console.log('3. Testing agent spawn with cost...');
    const spawnId = await logAgentSpawn(
      'silk',
      'Test coding task with cost',
      'garion',
      { test: true, estimatedCost: 0.075 },
      0.075 // 7.5 cents
    );
    console.log(`   ✅ Agent spawn logged with ID: ${spawnId}`);

    console.log('🎉 All cost tracking tests passed!');
    console.log('💰 Costs should appear in Mission Control activity feed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCostTracking();