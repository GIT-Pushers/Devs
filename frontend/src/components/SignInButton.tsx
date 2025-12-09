"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { authClient } from "@/lib/client";
import { useTheme } from "next-themes";

export default function SignInButton() {
  const { theme } = useTheme();

  const handleGithubLogin = async () => {
    try {
      // better-auth signIn.social initiates OAuth flow and returns redirect URL
      const result = await authClient.signIn.social({
        provider: "github",
      });

      // Handle different response formats
      const redirectUrl = 
        result?.data?.url || 
        result?.url || 
        result?.redirectUrl ||
        (typeof result === "string" ? result : null);

      if (redirectUrl) {
        // Redirect to GitHub OAuth
        window.location.href = redirectUrl;
      } else {
        // Log the response to debug
        console.log("Sign-in response:", result);
        // Try to check if we're already authenticated
        const session = await authClient.getSession();
        if (session?.data?.user) {
          window.location.reload();
        } else {
          console.error("No redirect URL received from sign-in");
        }
      }
    } catch (err: any) {
      console.error("GitHub Login Error:", err);
      
      // Check if error contains a redirect URL
      if (err?.data?.url || err?.url) {
        window.location.href = err.data?.url || err.url;
      } else {
        // Show user-friendly error
        alert("Sign in failed. Please check your GitHub OAuth configuration.");
      }
    }
  };

  return (
    <button
      onClick={handleGithubLogin}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all h-auto px-3 py-2 bg-background/80 dark:bg-input/30 border border-border/50 hover:bg-accent hover:border-border dark:hover:bg-input/50 text-foreground shadow-sm"
    >
      <Github className="h-4 w-4" />
      <span>Sign in</span>
    </button>
  );
}

