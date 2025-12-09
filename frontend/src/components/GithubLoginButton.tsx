"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { authClient } from "@/lib/client";

export default function GithubLoginButton() {
  const handleGithubLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: window.location.origin + "/submission", // Full URL for redirect
      });

      // The redirect should happen automatically, but let's add a small delay and manual check
      setTimeout(() => {
        window.location.href = "/submission";
      }, 1000);
    } catch (err) {
      console.error("GitHub Login Error:", err);
    }
  };

  return (
    <Button
      onClick={handleGithubLogin}
      variant="default"
      className="bg-white text-black hover:bg-gray-100 flex items-center gap-2 px-4 py-2 text-sm"
    >
      <Github className="h-4 w-4" />
      Sign in
    </Button>
  );
}
