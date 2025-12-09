import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Check session API called');
    
    // First try to get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    console.log('Better-auth session:', session ? 'found' : 'not found');

    if (session?.user) {
      // Store GitHub user data in cookie for verification flow
      const cookieStore = await cookies();
      const githubUser = {
        id: session.user.id,
        login: session.user.name || session.user.email?.split('@')[0] || '',
        email: session.user.email,
        avatar_url: session.user.image,
        name: session.user.name,
      };
      
      console.log('Storing GitHub user in cookie:', githubUser.login);
      
      cookieStore.set('github_user', JSON.stringify(githubUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      });
      
      return NextResponse.json({ 
        hasSession: true,
        githubUser 
      });
    }
    
    // Fallback to cookie-based session
    const cookieStore = await cookies();
    const githubUserCookie = cookieStore.get('github_user');
    
    console.log('GitHub user cookie:', githubUserCookie ? 'found' : 'not found');
    
    if (!githubUserCookie) {
      return NextResponse.json({ hasSession: false });
    }

    const githubUser = JSON.parse(githubUserCookie.value);
    
    return NextResponse.json({ 
      hasSession: true,
      githubUser 
    });
  } catch (error) {
    console.error('Check session error:', error);
    return NextResponse.json({ hasSession: false });
  }
}
