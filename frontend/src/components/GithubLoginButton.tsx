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
      className="bg-[#24292e] text-white hover:bg-[#2f363d] flex items-center gap-2 px-4 py-2 text-sm"
    >
      <Github className="h-4 w-4" />
      Sign in
    </Button>
  );
}
