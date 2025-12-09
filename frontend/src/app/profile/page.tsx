"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  avatarUrl?: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setUser(session.data.user as User);
        } else {
          // Redirect to home if not authenticated
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const imageUrl = user.image || user.avatarUrl || user.avatar_url;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center space-y-4">
            {imageUrl && (
              <div className="mx-auto">
                <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-border mx-auto">
                  <img
                    src={imageUrl}
                    alt={user.name || "User"}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            <CardTitle className="text-3xl font-bold">
              {user.name || "User Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Email
              </label>
              <p className="text-base">{user.email || "Not provided"}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                User ID
              </label>
              <p className="text-base font-mono text-sm">{user.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

