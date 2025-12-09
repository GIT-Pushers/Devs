import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/utils/auth';

/**
 * Syncs the better-auth session to a github_user cookie
 * needed for the verification flow
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Store GitHub user data in cookie for verification flow
    const cookieStore = await cookies();
    cookieStore.set('github_user', JSON.stringify({
      id: session.user.id,
      login: session.user.name || session.user.email?.split('@')[0] || '',
      email: session.user.email,
      avatar_url: session.user.image,
      name: session.user.name,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync session error:', error);
    return NextResponse.json({ error: 'Failed to sync session' }, { status: 500 });
  }
}
