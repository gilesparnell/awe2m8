import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, status } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const agentRef = db.collection('agents').doc(agentId);
    const agentDoc = await agentRef.get();

    if (!agentDoc.exists) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const now = Timestamp.now();
    const updateData: any = {
      lastHeartbeat: now,
      lastActivity: now,
      isOnline: true,
    };

    // If status provided and agent was idle, update to active
    if (status) {
      const currentData = agentDoc.data();
      if (currentData?.status === 'idle') {
        updateData.status = 'active';
      }
    }

    await agentRef.update(updateData);

    return NextResponse.json({
      success: true,
      timestamp: now.toMillis(),
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}
