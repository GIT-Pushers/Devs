import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { signature } = await request.json();
    
    if (!signature) {
      return NextResponse.json({ error: 'Signature required' }, { status: 400 });
    }

    // Get verification session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('verification_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No verification session found' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Check expiration
    if (Date.now() / 1000 > session.expiresAt) {
      return NextResponse.json({ error: 'Verification session expired' }, { status: 401 });
    }

    // Return data needed for blockchain transaction
    // Note: Signature verification happens on-chain
    return NextResponse.json({
      success: true,
      data: {
        githubId: session.githubUser.id,
        githubUsername: session.githubUser.login,
        walletAddress: session.walletAddress,
        nonce: session.nonce,
        timestamp: session.timestamp,
        signature,
      },
    });
  } catch (error) {
    console.error('Complete verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
