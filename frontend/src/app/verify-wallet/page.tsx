'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount, ConnectButton, darkTheme, lightTheme } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useGitHubVerification } from '@/hooks/useGitHubVerification';
import { prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { githubVerifierContract } from '@/app/constants/contracts';
import type { VerificationData } from '@/types/verification';
import client from '@/utils/client';

export default function VerifyWalletPage() {
  const [githubUser, setGithubUser] = useState<any>(null);
  const [step, setStep] = useState<'github' | 'connect' | 'sign' | 'submit' | 'complete'>('github');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const account = useActiveAccount();
  const router = useRouter();
  const { theme } = useTheme();
  const { initiateGitHubLogin, prepareVerification, signVerification, isLoading, error } = useGitHubVerification();

  useEffect(() => {
    if (account) {
      checkVerificationStatus();
    }
  }, [account]);

  useEffect(() => {
    // Check GitHub session on mount and after redirects
    checkGitHubSession();
  }, []);

  const checkVerificationStatus = async () => {
    if (!account) return;

    try {
      const isVerified = await readContract({
        contract: githubVerifierContract,
        method: 'function isGitHubVerified(address user) view returns (bool)',
        params: [account.address],
      });

      if (isVerified) {
        router.push('/home');
      }
    } catch (err) {
      console.error('Check verification error:', err);
    }
  };

  const checkGitHubSession = async () => {
    console.log('Checking GitHub session...');
    try {
      const response = await fetch('/api/verify/check-session');
      if (response.ok) {
        const data = await response.json();
        console.log('Session data:', data);
        if (data.hasSession) {
          setGithubUser(data.githubUser);
          setStep('connect');
          console.log('GitHub session found, moving to connect step');
        } else {
          console.log('No GitHub session found');
        }
      }
    } catch (err) {
      console.error('Check session error:', err);
    }
  };

  const handleGitHubLogin = () => {
    initiateGitHubLogin();
  };

  const handlePrepareVerification = async () => {
    try {
      const data = await prepareVerification();
      setGithubUser(data.githubUser);
      setVerificationData(data);
      setStep('sign');
    } catch (err: any) {
      console.error('Preparation error:', err);
      if (err.message.includes('No GitHub session')) {
        setStep('github');
      }
    }
  };

  const handleSignVerification = async () => {
    if (!verificationData) return;
    
    try {
      const result = await signVerification(verificationData);
      setVerificationData(result.data as any);
      setStep('submit');
    } catch (err) {
      console.error('Signing error:', err);
    }
  };

  const handleSubmitToBlockchain = async () => {
    if (!account || !verificationData) return;

    try {
      const data = verificationData as any;
      
      const transaction = prepareContractCall({
        contract: githubVerifierContract,
        method: 'function verifyGitHub(string githubId, string githubUsername, uint256 nonce, uint256 timestamp, bytes signature)',
        params: [
          data.githubId,
          data.githubUsername,
          BigInt(`0x${data.nonce}`),
          BigInt(data.timestamp),
          data.signature,
        ],
      });

      const result = await sendTransaction({
        account,
        transaction,
      });

      setTxHash(result.transactionHash);
      setStep('complete');
    } catch (err: any) {
      console.error('Blockchain submission error:', err);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 border rounded-lg bg-card text-center space-y-4">
          <h1 className="text-2xl font-bold">Connect Wallet</h1>
          <p className="text-muted-foreground">Please connect your wallet to continue with verification.</p>
          <ConnectButton
            theme={theme === "dark" ? darkTheme() : lightTheme()}
            client={client}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full p-8 border rounded-lg bg-card">
        <h1 className="text-3xl font-bold mb-6">Verify Your Identity</h1>

        {step === 'github' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Link your GitHub account to verify your identity and participate in hackathons.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Connected Wallet:</p>
              <p className="text-sm font-mono">{account.address}</p>
            </div>
            <Button onClick={handleGitHubLogin} disabled={isLoading} className="w-full">
              <Github className="mr-2 h-5 w-5" />
              {isLoading ? 'Connecting...' : 'Connect GitHub Account'}
            </Button>
          </div>
        )}

        {step === 'connect' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              GitHub account detected! Connect it to your wallet to complete verification.
            </p>
            {githubUser && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">{githubUser.login}</p>
                {githubUser.email && (
                  <p className="text-sm text-muted-foreground">{githubUser.email}</p>
                )}
              </div>
            )}
            <Button onClick={handlePrepareVerification} disabled={isLoading} className="w-full">
              {isLoading ? 'Preparing...' : 'Continue to Sign'}
            </Button>
          </div>
        )}

        {step === 'sign' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Sign the message to prove you own this wallet:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><span className="text-muted-foreground">GitHub:</span> {githubUser?.login}</p>
              <p><span className="text-muted-foreground">Wallet:</span> {account.address}</p>
            </div>
            <Button onClick={handleSignVerification} disabled={isLoading} className="w-full">
              {isLoading ? 'Signing...' : 'Sign Message'}
            </Button>
          </div>
        )}

        {step === 'submit' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Submit your verification to the blockchain:
            </p>
            <Button onClick={handleSubmitToBlockchain} disabled={isLoading} className="w-full">
              {isLoading ? 'Submitting...' : 'Submit to Blockchain'}
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
              <p className="font-semibold">✓ Verification Complete!</p>
              {txHash && (
                <p className="text-sm mt-2">
                  Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </p>
              )}
            </div>
            <Button onClick={() => router.push('/home')} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p className="text-sm mt-1">{error}</p>
            {error.includes('GitHub session') && (
              <Button onClick={() => setStep('github')} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
