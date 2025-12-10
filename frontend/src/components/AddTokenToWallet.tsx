"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface AddTokenToWalletProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals?: number;
  hackathonId: string;
}

export function AddTokenToWallet({
  tokenAddress,
  tokenSymbol,
  tokenDecimals = 18,
  hackathonId,
}: AddTokenToWalletProps) {
  const [copied, setCopied] = useState(false);

  const addTokenToMetaMask = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed");
      return;
    }

    try {
      // @ts-ignore
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: "", // Optional: add token logo URL
          },
        },
      });

      if (wasAdded) {
        toast.success(`${tokenSymbol} added to MetaMask!`);
      } else {
        toast.error("Token was not added");
      }
    } catch (error) {
      console.error("Error adding token to MetaMask:", error);
      toast.error("Failed to add token to MetaMask");
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    toast.success("Token address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">
          Voting Token Address
        </p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-white font-mono break-all flex-1">
            {tokenAddress}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={copyAddress}
            className="flex-shrink-0 h-8 w-8"
            title="Copy address"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button
        onClick={addTokenToMetaMask}
        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Add {tokenSymbol} to MetaMask
      </Button>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          <strong className="text-primary">Tip:</strong> After adding the token, you&apos;ll see your GVOTE{hackathonId} balance in MetaMask&apos;s token list.
        </p>
      </div>
    </div>
  );
}
