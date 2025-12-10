"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { readContract } from "thirdweb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Lock,
  Trophy,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainContract } from "@/constants/contracts";

interface Team {
  id: bigint;
  creator: string;
  metadataURI: string;
  members: string[];
  joinCodeHash: string;
  exists: boolean;
}

interface TeamMetadata {
  name: string;
  description?: string;
  image?: string;
  tags?: string[];
}

interface TeamRegistration {
  registered: boolean;
  staked: boolean;
  staker: string;
  tokensMinted: boolean;
  projectSubmitted: boolean;
  repoHash: string;
  aiScore: bigint;
  judgeScore: bigint;
  participantScore: bigint;
  finalScore: bigint;
  ranking: bigint;
  scoreFinalized: boolean;
}

interface ParticipantTeam extends Team {
  metadata?: TeamMetadata;
  registration: TeamRegistration;
}

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;

  const [participants, setParticipants] = useState<ParticipantTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    staked: 0,
    submitted: 0,
  });

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get all team IDs registered for this hackathon
        const teamIds = (await readContract({
          contract: mainContract,
          method:
            "function getHackathonTeams(uint256) view returns (uint256[])",
          params: [BigInt(hackathonId)],
        })) as bigint[];

        console.log(
          `Found ${teamIds.length} teams for hackathon ${hackathonId}`
        );

        if (teamIds.length === 0) {
          setParticipants([]);
          setIsLoading(false);
          return;
        }

        // Fetch details for each team
        const teamsData = await Promise.all(
          teamIds.map(async (teamId) => {
            try {
              // Get team details
              const team = (await readContract({
                contract: mainContract,
                method:
                  "function getTeam(uint256 id) view returns ((uint256 id, address creator, string metadataURI, address[] members, bytes32 joinCodeHash, bool exists))",
                params: [teamId],
              })) as Team;

              // Get registration status
              const registration = (await readContract({
                contract: mainContract,
                method:
                  "function getTeamRegistration(uint256 hackathonId, uint256 teamId) view returns ((bool registered, bool staked, address staker, bool tokensMinted, bool projectSubmitted, bytes32 repoHash, uint256 aiScore, uint256 judgeScore, uint256 participantScore, uint256 finalScore, uint256 ranking, bool scoreFinalized))",
                params: [BigInt(hackathonId), teamId],
              })) as TeamRegistration;

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
                registration,
              };
            } catch (err) {
              console.error(`Error fetching team ${teamId}:`, err);
              return null;
            }
          })
        );

        const validTeams = teamsData.filter(
          (team) => team !== null
        ) as ParticipantTeam[];

        // Calculate statistics
        const totalTeams = validTeams.length;
        const registeredTeams = validTeams.filter(
          (t) => t.registration.registered
        ).length;
        const stakedTeams = validTeams.filter(
          (t) => t.registration.staked
        ).length;
        const submittedTeams = validTeams.filter(
          (t) => t.registration.projectSubmitted
        ).length;

        setStats({
          total: totalTeams,
          registered: registeredTeams,
          staked: stakedTeams,
          submitted: submittedTeams,
        });

        setParticipants(validTeams);
      } catch (err) {
        console.error("Error fetching participants:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load participants"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (hackathonId) {
      fetchParticipants();
    }
  }, [hackathonId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="container mx-auto max-w-7xl py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">
                Loading participants...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="container mx-auto max-w-7xl py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-7xl py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Hackathon
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Participants</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            All teams participating in Hackathon #{hackathonId}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-success/20 bg-gradient-to-br from-success/10 to-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Registered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <p className="text-3xl font-bold">{stats.registered}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Staked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-warning" />
                <p className="text-3xl font-bold">{stats.staked}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-info/20 bg-gradient-to-br from-info/10 to-info/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-info" />
                <p className="text-3xl font-bold">{stats.submitted}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams List */}
        {participants.length === 0 ? (
          <Card className="border-2 shadow-xl">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Participants Yet</h2>
              <p className="text-muted-foreground">
                No teams have registered for this hackathon yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {participants.map((team) => (
              <Card
                key={team.id.toString()}
                className="border-2 shadow-xl hover:shadow-2xl transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        {team.metadata?.name || `Team #${team.id.toString()}`}
                      </CardTitle>
                      {team.metadata?.description && (
                        <p className="text-muted-foreground text-sm">
                          {team.metadata.description}
                        </p>
                      )}
                    </div>
                    {team.metadata?.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-border flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={team.metadata.image.replace(
                            "ipfs://",
                            "https://gateway.pinata.cloud/ipfs/"
                          )}
                          alt={team.metadata.name || "Team"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {team.registration.registered && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-success/20 text-success rounded-full text-xs font-semibold">
                        <CheckCircle className="h-3 w-3" />
                        Registered
                      </span>
                    )}
                    {team.registration.staked && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-warning/20 text-warning rounded-full text-xs font-semibold">
                        <Lock className="h-3 w-3" />
                        Staked
                      </span>
                    )}
                    {team.registration.projectSubmitted && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-info/20 text-info rounded-full text-xs font-semibold">
                        <Trophy className="h-3 w-3" />
                        Submitted
                      </span>
                    )}
                    {!team.registration.registered && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-semibold">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Team ID
                      </p>
                      <p className="font-mono text-sm">#{team.id.toString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Members
                      </p>
                      <p className="font-semibold">
                        {team.members.length} member
                        {team.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Skills/Tags */}
                  {team.metadata?.tags && team.metadata.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {team.metadata.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Creator */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Created by
                    </p>
                    <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                      {team.creator}
                    </p>
                  </div>

                  {/* Staker (if different from creator) */}
                  {team.registration.staked &&
                    team.registration.staker !==
                      "0x0000000000000000000000000000000000000000" &&
                    team.registration.staker.toLowerCase() !==
                      team.creator.toLowerCase() && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Staked by
                        </p>
                        <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                          {team.registration.staker}
                        </p>
                      </div>
                    )}

                  {/* Members List */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Team Members
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {team.members.map((member, idx) => (
                        <div
                          key={idx}
                          className="font-mono text-xs bg-accent/50 p-2 rounded break-all"
                        >
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scores (if available) */}
                  {(Number(team.registration.aiScore) > 0 ||
                    Number(team.registration.judgeScore) > 0 ||
                    Number(team.registration.participantScore) > 0) && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">
                        Scores
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-primary/10 p-2 rounded">
                          <p className="text-xs text-muted-foreground">AI</p>
                          <p className="font-bold text-primary">
                            {Number(team.registration.aiScore)}
                          </p>
                        </div>
                        <div className="bg-info/10 p-2 rounded">
                          <p className="text-xs text-muted-foreground">Judge</p>
                          <p className="font-bold text-info">
                            {Number(team.registration.judgeScore)}
                          </p>
                        </div>
                        <div className="bg-success/10 p-2 rounded">
                          <p className="text-xs text-muted-foreground">
                            Participant
                          </p>
                          <p className="font-bold text-success">
                            {Number(team.registration.participantScore)}
                          </p>
                        </div>
                      </div>
                      {team.registration.scoreFinalized && (
                        <div className="mt-2 text-center">
                          <p className="text-xs text-muted-foreground">
                            Final Score
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {Number(team.registration.finalScore)}
                          </p>
                          {Number(team.registration.ranking) > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Rank #{Number(team.registration.ranking)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
