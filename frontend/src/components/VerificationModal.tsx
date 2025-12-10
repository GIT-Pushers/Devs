'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { githubVerifierContract } from '@/app/constants/contracts';
import { X } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubUser: any;
}

export function VerificationModal({ isOpen, onClose, githubUser }: VerificationModalProps) {
  const [step, setStep] = useState<'sign' | 'submit' | 'complete'>('sign');
  const [verificationData, setVerificationData] = useState<any>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();
  const router = useRouter();

  if (!isOpen) return null;

  const prepareVerification = async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      // First, sync the session to create github_user cookie
      const syncResponse = await fetch('/api/auth/sync-session', {
        method: 'POST',
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync session. Please sign in with GitHub again.');
      }

      // Now prepare verification
      const response = await fetch('/api/verify/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account.address }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to prepare verification';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use default message
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Prepare verification error:', err);
      setError(err.message || 'Failed to prepare verification');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignVerification = async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await prepareVerification();
      setVerificationData(data);

      // EIP-712 domain and types
      const domain = {
        name: 'GLYTCH',
        version: '1',
        chainId: 11155111,
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
        githubId: data.githubUser.id.toString(),
        githubUsername: data.githubUser.login,
        walletAddress: account.address as `0x${string}`,
        nonce: BigInt(`0x${data.nonce}`),
        timestamp: BigInt(data.timestamp),
      };

      const signature = await account.signTypedData({
        domain,
        types,
        primaryType: 'GitHubBinding',
        message,
      });

      const verifyResponse = await fetch('/api/verify/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Signature verification failed');
      }

      const result = await verifyResponse.json();
      setVerificationData(result.data);
      setStep('submit');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitToBlockchain = async () => {
    if (!account || !verificationData) return;

    setIsLoading(true);
    setError(null);

    try {
      const transaction = prepareContractCall({
        contract: githubVerifierContract,
        method: 'function verifyGitHub(string githubId, string githubUsername, uint256 nonce, uint256 timestamp, bytes signature)',
        params: [
          verificationData.githubId,
          verificationData.githubUsername,
          BigInt(`0x${verificationData.nonce}`),
          BigInt(verificationData.timestamp),
          verificationData.signature,
        ],
      });

      const result = await sendTransaction({
        account,
        transaction,
      });

      setTxHash(result.transactionHash);
      setStep('complete');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onClose();
    router.refresh();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-gradient-to-br from-background via-background to-background/95 border-2 border-primary/40 rounded-3xl p-10 max-w-3xl w-full shadow-[0_0_80px_rgba(var(--primary),0.3)] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
        
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 rounded-xl bg-muted/50 hover:bg-muted transition-all hover:rotate-90 duration-300 group"
        >
          <X className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
        </button>

        {/* Header */}
        <div className="mb-10 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                GitHub Verification
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your GitHub to unlock hackathon features
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {step === 'sign' && (
            <div className="space-y-6">
              {/* Account Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">GitHub</p>
                      <p className="font-bold text-lg">{githubUser?.login || githubUser?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Wallet</p>
                      <p className="font-mono text-sm font-bold">{account?.address.slice(0, 8)}...{account?.address.slice(-6)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">What happens next?</p>
                    <p className="text-sm text-muted-foreground">
                      You'll sign a message to link your GitHub account with your wallet. This is free and doesn't require any gas fees.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Error</p>
                    <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSignVerification} 
                disabled={isLoading}
                size="lg"
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Signing Message...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Sign Message
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'submit' && (
            <div className="space-y-6">
              <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-2xl font-bold mb-3">Message Signed!</p>
                <p className="text-muted-foreground">
                  Now submit your verification to the blockchain to complete the process.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Error</p>
                    <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSubmitToBlockchain} 
                disabled={isLoading}
                size="lg"
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Submitting to Blockchain...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Submit to Blockchain
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-2 border-green-500/40 rounded-2xl p-10 text-center">
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400 mb-3">
                  Verification Complete!
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  Your GitHub account is now linked to your wallet
                </p>
                
                {txHash && (
                  <div className="bg-background/80 border-2 border-border rounded-xl p-5">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Transaction Hash</p>
                    <p className="text-xs font-mono break-all text-foreground">{txHash}</p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleComplete}
                size="lg"
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30"
              >
                Continue to Dashboard
                <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
