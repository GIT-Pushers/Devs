"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/client";
import SignInButton from "./SignInButton";
import UserProfile from "./UserProfile";

export default function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session?.data?.user);
      } catch (error) {
        console.error("Error checking session:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Check session on focus (when user returns to tab)
    const handleFocus = () => {
      checkSession();
    };
    window.addEventListener("focus", handleFocus);

    // Check session periodically (less frequent)
    const interval = setInterval(checkSession, 3000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (loading) {
    return null;
  }

  return isAuthenticated ? <UserProfile /> : <SignInButton />;
}

