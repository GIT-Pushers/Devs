import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the current session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.redirect(new URL('/verify-wallet?error=no_session', request.url));
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
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Redirect to verify-wallet
    return NextResponse.redirect(new URL('/verify-wallet', request.url));
  } catch (error) {
    console.error('Post GitHub sign-in error:', error);
    return NextResponse.redirect(new URL('/verify-wallet?error=session_failed', request.url));
  }
}
