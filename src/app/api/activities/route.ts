/**
 * Activities API Route (Server-side with Admin SDK)
 * 
 * GET /api/activities — returns all activities from Firebase
 * Bypasses Firestore security rules via Admin SDK
 */

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('activities')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const activities = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        agentName: data.agentName,
        message: data.message,
        cost: data.cost || 0,
        timestamp: data.timestamp?.toDate?.() 
          ? data.timestamp.toDate().toISOString() 
          : new Date(data.timestamp).toISOString(),
        metadata: data.metadata || {},
      };
    });

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('[API] Activities error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
