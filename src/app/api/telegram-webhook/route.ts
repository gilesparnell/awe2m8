import { NextRequest, NextResponse } from 'next/server';

/**
 * Telegram Webhook Endpoint
 * Receives updates from Telegram and forwards to OpenClaw
 */

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    console.log('📨 Telegram update received:', {
      update_id: update.update_id,
      message: update.message ? {
        from: update.message.from?.username,
        text: update.message.text,
        chat: update.message.chat.type
      } : 'No message',
      callback_query: update.callback_query ? 'Callback query' : 'No callback'
    });

    // Extract message data
    if (update.message) {
      const message = update.message;
      const from = message.from;
      const chat = message.chat;
      
      // Forward to OpenClaw message system
      // This would integrate with the existing message infrastructure
      console.log(`Message from ${from?.username || from?.first_name}: ${message.text}`);
      
      // TODO: Integrate with OpenClaw message routing
      // For now, just log and acknowledge
    }
    
    // Acknowledge receipt to Telegram
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('❌ Telegram webhook error:', error);
    return NextResponse.json({ error: 'Failed to process update' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Telegram webhook endpoint',
    status: 'Ready to receive updates'
  });
}