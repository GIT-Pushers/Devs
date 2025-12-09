"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { authClient } from "@/lib/client";

export default function GithubLoginButton() {
  const handleGithubLogin = async () => {
    try {
      const res = await authClient.signIn.social({
        provider: "github",
      });

      console.log("GitHub Login Success:", res);
    } catch (err) {
      console.error("GitHub Login Error:", err);
    }
  };

  return (
    <Button
      onClick={handleGithubLogin}
      variant="default"
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
    >
      <Github className="h-5 w-5" />
      Sign in with GitHub
    </Button>
  );
}
