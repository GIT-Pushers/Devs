"use client";

import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { readContract } from "thirdweb";
import { mainContract } from "@/app/constants/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ExternalLink } from "lucide-react";
import Image from "next/image";

interface TeamMetadata {
  name: string;
  description: string;
  image?: string;
  tags?: string[];
}

interface Team {
  id: bigint;
  creator: string;
  metadataURI: string;
  members: string[];
  joinCodeHash: string;
  exists: boolean;
}

interface TeamWithMetadata extends Team {
  metadata?: TeamMetadata;
}

export default function MyTeamsPage() {
  const account = useActiveAccount();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!account?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user's team IDs
        const teamIds = (await readContract({
          contract: mainContract,
          method:
            "function getUserTeams(address user) view returns (uint256[])",
          params: [account.address],
        })) as bigint[];

        console.log("Team IDs:", teamIds);

        if (teamIds.length === 0) {
          setTeams([]);
          setLoading(false);
          return;
        }

        // Fetch team details for each team ID
        const teamsData = await Promise.all(
          teamIds.map(async (teamId) => {
            try {
              const team = (await readContract({
                contract: mainContract,
                method:
                  "function getTeam(uint256 id) view returns ((uint256 id, address creator, string metadataURI, address[] members, bytes32 joinCodeHash, bool exists))",
                params: [teamId],
              })) as Team;

              console.log(`Team ${teamId} data:`, team);

              // Fetch metadata from IPFS
              let metadata: TeamMetadata | undefined;
              if (team.metadataURI) {
                try {
                  const ipfsUrl = team.metadataURI.replace(
                    "ipfs://",
                    "https://gateway.pinata.cloud/ipfs/"
                  );
                  const response = await fetch(ipfsUrl);
                  if (response.ok) {
                    metadata = await response.json();
                    console.log(`Team ${teamId} metadata:`, metadata);
                  }
                } catch (metaError) {
                  console.error(
                    `Failed to fetch metadata for team ${teamId}:`,
                    metaError
                  );
                }
              }

              return {
                ...team,
                metadata,
              };
            } catch (err) {
              console.error(`Error fetching team ${teamId}:`, err);
              return null;
            }
          })
        );

        // Filter out null values
        const validTeams = teamsData.filter(
          (team) => team !== null
        ) as TeamWithMetadata[];
        setTeams(validTeams);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError(err instanceof Error ? err.message : "Failed to load teams");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [account?.address]);

  if (!account?.address) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="border-2 shadow-xl">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to view your teams
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">My Teams</h1>
          <p className="text-muted-foreground">
            View and manage all your hackathon teams
          </p>
        </div>

        {loading && (
          <Card className="border-2 shadow-xl">
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-3 text-muted-foreground">
                  Loading your teams...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-2 shadow-xl border-destructive/50">
            <CardContent className="py-12 text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && teams.length === 0 && (
          <Card className="border-2 shadow-xl">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Teams Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t created or joined any teams yet
              </p>
              <Button onClick={() => router.push("/home")}>
                Browse Hackathons
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && teams.length > 0 && (
          <div className="space-y-4">
            {teams.map((team) => (
              <Card
                key={team.id.toString()}
                className="border-2 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        {team.metadata?.name || `Team #${team.id.toString()}`}
                      </CardTitle>
                      {team.metadata?.description && (
                        <p className="text-muted-foreground">
                          {team.metadata.description}
                        </p>
                      )}
                    </div>
                    {team.metadata?.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-border shrink-0 relative">
                        <Image
                          src={team.metadata.image.replace(
                            "ipfs://",
                            "https://gateway.pinata.cloud/ipfs/"
                          )}
                          alt={team.metadata.name || "Team"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Team ID
                      </label>
                      <p className="font-mono text-sm">#{team.id.toString()}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Members
                      </label>
                      <p className="font-semibold">
                        {team.members.length} member
                        {team.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {team.metadata?.tags && team.metadata.tags.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Skills
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {team.metadata.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">
                      Team Creator
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all">
                        {team.creator}
                      </p>
                      {team.creator.toLowerCase() ===
                        account.address.toLowerCase() && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-semibold shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">
                      Team Members
                    </label>
                    <div className="space-y-1">
                      {team.members.map((member, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 rounded bg-accent/50"
                        >
                          <p className="font-mono text-xs break-all flex-1">
                            {member}
                          </p>
                          {member.toLowerCase() ===
                            account.address.toLowerCase() && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-semibold shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {team.metadataURI && (
                    <div className="pt-4 border-t">
                      <a
                        href={team.metadataURI.replace(
                          "ipfs://",
                          "https://gateway.pinata.cloud/ipfs/"
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View on IPFS
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
