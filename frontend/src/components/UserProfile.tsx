"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { User as UserIcon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  avatarUrl?: string;
  avatar_url?: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setUser(session.data.user as User);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
    
    // Refresh session on focus
    const handleFocus = () => {
      fetchSession();
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      setOpen(false);
      // Refresh the page to update the auth state
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleViewProfile = () => {
    setOpen(false);
    // Navigate to profile page - adjust route as needed
    router.push("/profile");
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Try different possible image field names
  const imageUrl = user.image || user.avatarUrl || user.avatar_url;

  if (!imageUrl) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <img
            src={imageUrl}
            alt={user.name || "User"}
            className="h-full w-full object-cover"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold">{user.name || "User"}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            )}
          </div>
          <Button
            onClick={handleViewProfile}
            variant="ghost"
            className="w-full justify-start gap-2"
          >
            <UserIcon className="h-4 w-4" />
            View Profile
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

