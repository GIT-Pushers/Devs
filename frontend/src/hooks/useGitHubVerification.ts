'use client';

import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import type { VerificationData, VerificationResult } from '@/types/verification';

export function useGitHubVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();

  const initiateGitHubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      setError('GitHub client ID not configured');
      return;
    }
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('github_oauth_state', state);
    
    // Use better-auth callback URL format
    const redirectUri = `${window.location.origin}/api/auth/callback/github`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email&state=${state}`;
    window.location.href = githubAuthUrl;
  };

  const prepareVerification = async (): Promise<VerificationData> => {
    if (!account) {
      throw new Error('No wallet connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account.address }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to prepare verification');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signVerification = async (verificationData: VerificationData): Promise<VerificationResult> => {
    if (!account) {
      throw new Error('No wallet connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sign EIP-712 message
      const domain = {
        name: 'GLYTCH',
        version: '1',
        chainId: verificationData.chainId,
        verifyingContract: '0x62F7448dd19DF9059B55F4fE670c41021D002fEf' as `0x${string}`,
      };

      const types = {
        GitHubBinding: [
          { name: 'githubId', type: 'string' },
          { name: 'githubUsername', type: 'string' },
          { name: 'walletAddress', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      };

      const message = {
        githubId: verificationData.githubUser.id,
      githubUsername: verificationData.githubUser.login,
      walletAddress: account.address as `0x${string}`,
      nonce: BigInt(`0x${verificationData.nonce}`),
      timestamp: BigInt(verificationData.timestamp),
    };

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: 'GitHubBinding',
      message,
    });

    // Verify signature on backend
    const verifyResponse = await fetch('/api/verify/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature }),
    });      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Failed to verify signature');
      }

      return await verifyResponse.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiateGitHubLogin,
    prepareVerification,
    signVerification,
    isLoading,
    error,
  };
}
