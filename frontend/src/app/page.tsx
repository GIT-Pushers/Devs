"use client";
import GithubLoginButton from "@/components/GithubLoginButton";
import { authClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { type Session, type User } from "better-auth";

import WalletConnectionButton from "@/components/WalletConnectionButton";

type SessionData = { session: Session; user: User } | null;

export default function Home() {
  const [sessionData, setSessionData] = useState<SessionData>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await authClient.getSession();
      setSessionData(data);
    };
    fetchSession();
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    setSessionData(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {sessionData ? `Welcome, ${sessionData.user.name}!` : "Please login"}
        </h1>
        {sessionData ? (
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        ) : (
          <GithubLoginButton />
        )}
      </div>
      <WalletConnectionButton />
    </div>
  );
}
