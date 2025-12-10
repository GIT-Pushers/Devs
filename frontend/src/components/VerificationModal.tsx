"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prepareContractCall, sendTransaction, readContract } from "thirdweb";
import { githubVerifierContract } from "@/app/constants/contracts";
import { X } from "lucide-react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubUser: any;
}

export function VerificationModal({
  isOpen,
  onClose,
  githubUser,
}: VerificationModalProps) {
  const [step, setStep] = useState<"sign" | "submit" | "complete">("sign");
  const [verificationData, setVerificationData] = useState<any>(null);
  const [txHash, setTxHash] = useState<string>("");
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
      const syncResponse = await fetch("/api/auth/sync-session", {
        method: "POST",
      });

      if (!syncResponse.ok) {
        throw new Error(
          "Failed to sync session. Please sign in with GitHub again."
        );
      }

      // Now prepare verification
      const response = await fetch("/api/verify/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: account.address }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to prepare verification";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, use status text
          const text = await response.text();
          console.error(
            "API returned non-JSON response:",
            text.substring(0, 200)
          );
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error("Prepare verification error:", err);
      setError(err.message);
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
        name: "GLYTCH",
        version: "1",
        chainId: 11155111,
        verifyingContract:
          "0x62F7448dd19DF9059B55F4fE670c41021D002fEf" as `0x${string}`,
      };

      const types = {
        GitHubBinding: [
          { name: "githubId", type: "string" },
          { name: "githubUsername", type: "string" },
          { name: "walletAddress", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "timestamp", type: "uint256" },
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
        primaryType: "GitHubBinding",
        message,
      });

      const verifyResponse = await fetch("/api/verify/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Signature verification failed");
      }

      const result = await verifyResponse.json();
      setVerificationData(result.data);
      setStep("submit");
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
        method:
          "function verifyGitHub(string githubId, string githubUsername, uint256 nonce, uint256 timestamp, bytes signature)",
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
      setStep("complete");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg p-6 max-w-md w-full shadow-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold mb-2">
              Verify Your GitHub Account
            </h2>
            <p className="text-sm text-muted-foreground">
              Link your GitHub account to your wallet to participate in
              hackathons
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "sign" && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm mb-2">
                <span className="font-semibold">GitHub:</span>{" "}
                {githubUser?.login || githubUser?.name}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Wallet:</span>{" "}
                {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Sign a message to prove you own this wallet
            </p>
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
                {error}
              </div>
            )}
            <Button
              onClick={handleSignVerification}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Signing..." : "Sign Message"}
            </Button>
          </div>
        )}

        {step === "submit" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Submit your verification to the blockchain
            </p>
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
                {error}
              </div>
            )}
            <Button
              onClick={handleSubmitToBlockchain}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Submitting..." : "Submit to Blockchain"}
            </Button>
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
              <p className="font-semibold">✓ Verification Complete!</p>
              {txHash && (
                <p className="text-sm mt-2">
                  Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </p>
              )}
            </div>
            <Button onClick={handleComplete} className="w-full">
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
