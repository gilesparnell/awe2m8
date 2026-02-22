/**
 * Simple test to check if Firebase is working and activities exist
 */

import { getAdminDb } from '@/lib/firebase-admin';

async function checkActivities() {
  try {
    const db = getAdminDb();
    
    console.log('🔍 Checking Firebase connection...');
    
    // Try to get a count of activities
    const activitiesSnapshot = await db.collection('activities').limit(5).get();
    
    console.log(`📊 Found ${activitiesSnapshot.size} activities in database`);
    
    if (activitiesSnapshot.size > 0) {
      activitiesSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Activity ${index + 1}:`, {
          id: doc.id,
          description: data.description,
          actor: data.actor,
          cost: data.cost,
          timestamp: data.timestamp?.toDate?.()
        });
      });
    } else {
      console.log('No activities found in database');
    }
    
    // Test adding a simple activity
    console.log('\n🧪 Testing activity creation...');
    const testDoc = await db.collection('activities').add({
      actor: 'garion',
      actorType: 'main',
      category: 'system',
      action: 'test',
      description: 'Test activity from server check',
      cost: 0.010, // 1 cent
      timestamp: new Date(),
      sessionId: 'test-session'
    });
    
    console.log(`✅ Test activity created with ID: ${testDoc.id}`);
    
    // Verify it was created
    const verifyDoc = await db.collection('activities').doc(testDoc.id).get();
    if (verifyDoc.exists) {
      console.log('✅ Test activity verified in database');
    }
    
    // Clean up
    await testDoc.delete();
    console.log('🧹 Test activity cleaned up');
    
    console.log('\n🎉 Firebase and activity logging are working correctly!');
    
  } catch (error) {
    console.error('❌ Error checking activities:', error);
    process.exit(1);
  }
}

checkActivities();