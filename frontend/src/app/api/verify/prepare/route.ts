import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createThirdwebClient } from 'thirdweb';
import { sepolia } from 'thirdweb/chains';
import { getContract, readContract } from 'thirdweb';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const githubVerifierContract = getContract({
  client,
  chain: sepolia,
  address: '0x62F7448dd19DF9059B55F4fE670c41021D002fEf',
});

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Get GitHub user from cookie
    const cookieStore = await cookies();
    const githubUserCookie = cookieStore.get('github_user');
    
    if (!githubUserCookie) {
      return NextResponse.json({ error: 'No GitHub session found' }, { status: 401 });
    }

    const githubUser = JSON.parse(githubUserCookie.value);

    // Get the current nonce from the contract
    const nonce = await readContract({
      contract: githubVerifierContract,
      method: 'function getNonce(address user) view returns (uint256)',
      params: [walletAddress as `0x${string}`],
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + 600; // 10 minutes

    // Store verification session
    const verificationSession = {
      githubUser,
      walletAddress: walletAddress.toLowerCase(),
      nonce: nonce.toString(),
      timestamp,
      expiresAt,
    };

    cookieStore.set('verification_session', JSON.stringify(verificationSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    return NextResponse.json({
      githubUser,
      nonce: nonce.toString(),
      timestamp,
      chainId: 11155111, // Sepolia
    });
  } catch (error) {
    console.error('Prepare verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
