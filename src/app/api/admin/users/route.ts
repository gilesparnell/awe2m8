import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listAdminUsers, addAdminUser, deleteAdminUser } from '@/lib/firebase-admin';

// GET - List all admin users
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await listAdminUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error listing admin users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add a new admin user
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, name, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const user = await addAdminUser(email, name, role || 'admin');
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding admin user:', error);
    if (error.message === 'User already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove an admin user
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Prevent self-deletion
    if (email.toLowerCase() === session.user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await deleteAdminUser(email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting admin user:', error);
    if (error.message === 'User not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
