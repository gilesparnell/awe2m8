import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { pid, port } = body;

    if (!pid || !port) {
      return NextResponse.json(
        { error: 'pid and port are required' },
        { status: 400 }
      );
    }

    // Validate PID is still listening on the expected port
    try {
      const check = execSync(`lsof -p ${pid} -iTCP -n -P 2>/dev/null`, {
        encoding: 'utf-8',
        timeout: 3000,
      });

      if (!check.includes(`:${port}`)) {
        return NextResponse.json(
          { error: `Process ${pid} is no longer listening on port ${port}` },
          { status: 409 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: `Process ${pid} is no longer listening on port ${port}` },
        { status: 409 }
      );
    }

    // Send SIGTERM (graceful shutdown)
    execSync(`kill -TERM ${pid}`, { timeout: 3000 });

    return NextResponse.json({ success: true, message: `Sent SIGTERM to PID ${pid}` });
  } catch (error) {
    console.error('Stop server error:', error);
    return NextResponse.json(
      { error: 'Failed to stop server' },
      { status: 500 }
    );
  }
}
