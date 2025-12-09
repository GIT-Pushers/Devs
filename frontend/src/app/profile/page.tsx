"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
} from "lucide-react";

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  avatarUrl?: string;
  avatar_url?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  private: boolean;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchRepos = async () => {
      if (!user) return;

      setReposLoading(true);
      setReposError(null);

      try {
        const response = await fetch("/api/github/repos");

        if (!response.ok) {
          if (response.status === 401) {
            setReposError("Please sign in with GitHub to view repositories");
          } else if (response.status === 400) {
            setReposError("GitHub access token not found");
          } else {
            setReposError("Failed to fetch repositories");
          }
          return;
        }

        const data = await response.json();
        setRepos(data);
      } catch (error) {
        console.error("Error fetching repos:", error);
        setReposError("Error loading repositories");
      } finally {
        setReposLoading(false);
      }
    };

    fetchRepos();
  }, [user]);

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
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
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

        {/* GitHub Repositories Section */}
        <Card className="border-2 shadow-xl mt-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <GitBranch className="h-6 w-6" />
              Your GitHub Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reposLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-3 text-muted-foreground">
                  Loading repositories...
                </p>
              </div>
            )}

            {reposError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                <p className="text-destructive font-medium">{reposError}</p>
              </div>
            )}

            {!reposLoading && !reposError && repos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No repositories found</p>
              </div>
            )}

            {!reposLoading && !reposError && repos.length > 0 && (
              <div className="space-y-3">
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            {repo.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {repo.private && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                              Private
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-primary"></span>
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.forks_count}
                          </span>
                          <span>
                            Updated{" "}
                            {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
