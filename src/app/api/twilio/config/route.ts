import { NextResponse } from 'next/server';
import { getNotificationNumbers, saveNotificationNumbers } from '@/lib/twilio-helpers';

export async function GET() {
    const notificationNumbers = getNotificationNumbers();
    return NextResponse.json({ notificationNumbers });
}

export async function POST(request: Request) {
    try {
        const { notificationNumbers } = await request.json();

        if (!Array.isArray(notificationNumbers)) {
            return NextResponse.json({ error: 'notificationNumbers must be an array' }, { status: 400 });
        }

        saveNotificationNumbers(notificationNumbers);
        return NextResponse.json({ success: true, notificationNumbers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
