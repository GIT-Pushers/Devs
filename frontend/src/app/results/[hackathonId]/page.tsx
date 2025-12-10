"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { readContract } from "thirdweb";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Trophy, Medal, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainContract } from "@/constants/contracts";
import { toast } from "sonner";

interface Hackathon {
  id: bigint;
  organizer: string;
  sponsorshipStart: bigint;
  sponsorshipEnd: bigint;
  hackStart: bigint;
  hackEnd: bigint;
  stakeAmount: bigint;
  minTeams: number;
  maxTeams: number;
  creationFee: bigint;
  creationFeeRefunded: boolean;
  judges: string[];
  metadataURI: string;
  totalSponsorshipAmount: bigint;
  minSponsorshipThreshold: bigint;
  finalized: boolean;
}

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

interface TeamWithScores extends Team {
  metadata?: TeamMetadata;
  registration: TeamRegistration;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.hackathonId as string;
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [rankedTeams, setRankedTeams] = useState<TeamWithScores[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch hackathon details
        const hackathonData = (await readContract({
          contract: mainContract,
          method:
            "function getHackathon(uint256 id) view returns ((uint256 id, address organizer, uint256 sponsorshipStart, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 creationFee, bool creationFeeRefunded, address[] judges, string metadataURI, uint256 totalSponsorshipAmount, uint256 minSponsorshipThreshold, bool finalized))",
          params: [BigInt(hackathonId)],
        })) as Hackathon;

        setHackathon(hackathonData);

        if (!hackathonData.finalized) {
          toast.error(
            "Results not available yet. Scores must be finalized first."
          );
          return;
        }

        // Fetch all teams
        const teamIds = (await readContract({
          contract: mainContract,
          method:
            "function getHackathonTeams(uint256 hackathonId) view returns (uint256[])",
          params: [BigInt(hackathonId)],
        })) as bigint[];

        if (teamIds.length === 0) {
          setRankedTeams([]);
          return;
        }

        // Fetch team details and registrations
        const teamsData = await Promise.all(
          teamIds.map(async (teamId) => {
            try {
              const team = (await readContract({
                contract: mainContract,
                method:
                  "function getTeam(uint256 id) view returns ((uint256 id, address creator, string metadataURI, address[] members, bytes32 joinCodeHash, bool exists))",
                params: [teamId],
              })) as Team;

              const registration = (await readContract({
                contract: mainContract,
                method:
                  "function getTeamRegistration(uint256 hackathonId, uint256 teamId) view returns ((bool registered, bool staked, address staker, bool tokensMinted, bool projectSubmitted, bytes32 repoHash, uint256 aiScore, uint256 judgeScore, uint256 participantScore, uint256 finalScore, uint256 ranking, bool scoreFinalized))",
                params: [BigInt(hackathonId), teamId],
              })) as TeamRegistration;

              // Only include teams with finalized scores
              if (!registration.scoreFinalized) return null;

              // Fetch metadata
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
                } catch (err) {
                  console.error("Failed to fetch team metadata:", err);
                }
              }

              return { ...team, metadata, registration };
            } catch (err) {
              console.error(`Error fetching team ${teamId}:`, err);
              return null;
            }
          })
        );

        const validTeams = teamsData.filter(
          (t) => t !== null
        ) as TeamWithScores[];

        // Sort teams by ranking
        validTeams.sort((a, b) => {
          return (
            Number(a.registration.ranking) - Number(b.registration.ranking)
          );
        });

        setRankedTeams(validTeams);
      } catch (error) {
        console.error("Error fetching results:", error);
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hackathonId]);

  const formatEther = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-8 w-8 text-yellow-400" />;
      case 2:
        return <Medal className="h-8 w-8 text-gray-300" />;
      case 3:
        return <Medal className="h-8 w-8 text-amber-600" />;
      default:
        return <Award className="h-6 w-6 text-primary" />;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-black";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-800 text-white";
      default:
        return "bg-primary/20 text-primary border-2 border-primary/40";
    }
  };

  const getPrizeAmount = (rank: number) => {
    if (!hackathon) return "0";
    const totalPrize =
      (hackathon.totalSponsorshipAmount * BigInt(80)) / BigInt(100);

    switch (rank) {
      case 1:
        return formatEther((totalPrize * BigInt(50)) / BigInt(100));
      case 2:
        return formatEther((totalPrize * BigInt(30)) / BigInt(100));
      case 3:
        return formatEther((totalPrize * BigInt(20)) / BigInt(100));
      default:
        return "0";
    }
  };

  const totalPrizePool = hackathon
    ? (hackathon.totalSponsorshipAmount * BigInt(80)) / BigInt(100)
    : BigInt(0);

  const topThree = rankedTeams.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050810]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-lg text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050810]">
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold text-foreground">Error</h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Hackathon not found
          </p>
          <Button
            onClick={() => router.push("/home")}
            className="bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hackathons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050810] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[-18%] top-0 h-80 w-80 rounded-full bg-warning/12 blur-3xl" />
        <div className="absolute bottom-[-14%] left-[15%] h-96 w-96 rounded-full bg-secondary/60 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push(`/home/${hackathonId}`)}
            className="border border-border/70 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hackathon
          </Button>
          <span
            className={`rounded-full border border-border/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
              hackathon.finalized
                ? "bg-success/15 text-success border-success/30"
                : "bg-warning/15 text-warning border-warning/30"
            }`}
          >
            {hackathon.finalized ? "Scores finalized" : "Pending finalization"}
          </span>
        </div>

        <div className="rounded-3xl border border-border/70 bg-secondary/60 p-6 shadow-xl backdrop-blur-lg md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Final Results
              </div>
              <div>
                <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
                  Hackathon #{hackathonId} Leaderboard
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  Snapshot of ranked teams, prize splits, and scoring
                  breakdowns.
                </p>
              </div>
              <div className="inline-flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-accent/30 px-3 py-1 text-foreground/80">
                  {hackathon.minTeams} - {hackathon.maxTeams} teams
                </span>
                <span className="rounded-full bg-accent/30 px-3 py-1 text-foreground/80">
                  Judges: {hackathon.judges.length}
                </span>
                <span className="rounded-full bg-accent/30 px-3 py-1 text-foreground/80">
                  Stake: {formatEther(hackathon.stakeAmount)} ETH
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:w-auto md:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-background/50 p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Prize pool (80%)
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatEther(totalPrizePool)} ETH
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Teams ranked
                </p>
                <p className="text-2xl font-bold">{rankedTeams.length}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Organized by
                </p>
                <p className="truncate text-sm font-semibold text-foreground/80">
                  {hackathon.organizer}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Status
                </p>
                <p className="text-sm font-semibold text-success">
                  {hackathon.finalized ? "Finalized" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!hackathon.finalized && (
          <Card className="mt-8 border border-warning/40 bg-warning/10 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Trophy className="h-12 w-12 text-warning" />
                <div>
                  <h3 className="text-lg font-bold">
                    Results not available yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Scores must be finalized before the leaderboard is
                    published.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {rankedTeams.length === 0 ? (
          <Card className="mt-10 border border-border/70 bg-secondary/60 text-center shadow-lg backdrop-blur">
            <CardContent className="p-12">
              <Trophy className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                No teams with finalized scores yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mt-10 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">Podium</h3>
                <span className="text-sm text-muted-foreground">
                  Top three teams by final score
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {topThree.map((team) => {
                  const rank = Number(team.registration.ranking);
                  return (
                    <div
                      key={team.id.toString()}
                      className={`rounded-2xl border border-border/70 bg-secondary/70 p-5 shadow-lg backdrop-blur transition-transform hover:-translate-y-1 ${getRankBadge(
                        rank
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2">
                          <div className="inline-flex items-center gap-2 rounded-full bg-background/40 px-3 py-1 text-xs font-semibold text-foreground/80">
                            {getRankIcon(rank)}
                            <span>#{rank}</span>
                          </div>
                          <h4 className="text-lg font-bold text-foreground">
                            {team.metadata?.name ||
                              `Team #${team.id.toString()}`}
                          </h4>
                          <p className="text-sm text-foreground/80">
                            {team.metadata?.description ||
                              "On-chain submission"}
                          </p>
                        </div>
                        {team.metadata?.image && (
                          <Image
                            src={team.metadata.image.replace(
                              "ipfs://",
                              "https://gateway.pinata.cloud/ipfs/"
                            )}
                            alt={team.metadata.name || "Team"}
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded-lg border border-border/60 object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-foreground/80">
                        <span className="rounded-full bg-background/40 px-3 py-1 font-semibold">
                          Final {team.registration.finalScore.toString()}
                        </span>
                        <span className="rounded-full bg-background/40 px-3 py-1">
                          Judges {team.registration.judgeScore.toString()}
                        </span>
                        <span className="rounded-full bg-background/40 px-3 py-1">
                          Community{" "}
                          {team.registration.participantScore.toString()}
                        </span>
                        <span className="rounded-full bg-background/40 px-3 py-1">
                          AI {team.registration.aiScore.toString()}
                        </span>
                      </div>
                      <div className="mt-3 text-sm font-semibold">
                        Prize: {getPrizeAmount(rank)} ETH
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">Full leaderboard</h3>
                <span className="text-sm text-muted-foreground">
                  Includes score breakdown and prizes
                </span>
              </div>
              <div className="space-y-5">
                {rankedTeams.map((team) => {
                  const rank = Number(team.registration.ranking);
                  const isWinner = rank <= 3;

                  return (
                    <Card
                      key={team.id.toString()}
                      className={`border border-border/70 bg-secondary/60 shadow-lg backdrop-blur transition-transform hover:-translate-y-1 ${
                        isWinner ? "shadow-primary/20" : ""
                      }`}
                    >
                      <CardHeader className="border-b border-border/60 pb-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-4">
                            <div
                              className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl font-extrabold ${getRankBadge(
                                rank
                              )}`}
                            >
                              {rank <= 3 ? getRankIcon(rank) : `#${rank}`}
                            </div>
                            <div className="space-y-1">
                              <CardTitle className="flex items-center gap-2 text-2xl">
                                {team.metadata?.name ||
                                  `Team #${team.id.toString()}`}
                                {rank === 1 && (
                                  <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-semibold text-success">
                                    Winner
                                  </span>
                                )}
                              </CardTitle>
                              {team.metadata?.description && (
                                <CardDescription className="text-sm text-muted-foreground">
                                  {team.metadata.description}
                                </CardDescription>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{team.members.length} members</span>
                              </div>
                            </div>
                          </div>
                          {team.metadata?.image && (
                            <Image
                              src={team.metadata.image.replace(
                                "ipfs://",
                                "https://gateway.pinata.cloud/ipfs/"
                              )}
                              alt={team.metadata.name || "Team"}
                              width={80}
                              height={80}
                              className="h-20 w-20 rounded-lg border border-border/60 object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Final Score
                            </p>
                            <p className="text-3xl font-extrabold text-primary">
                              {team.registration.finalScore.toString()}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Judge
                            </p>
                            <p className="text-2xl font-bold">
                              {team.registration.judgeScore.toString()}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              40% weight
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Community
                            </p>
                            <p className="text-2xl font-bold">
                              {team.registration.participantScore.toString()}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              35% weight
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              AI
                            </p>
                            <p className="text-2xl font-bold">
                              {team.registration.aiScore.toString()}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              25% weight
                            </p>
                          </div>
                          {isWinner ? (
                            <div className="rounded-xl border border-success/50 bg-success/10 p-4 text-center shadow-sm">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-success">
                                Prize
                              </p>
                              <p className="text-2xl font-extrabold">
                                {getPrizeAmount(rank)} ETH
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {rank === 1
                                  ? "50%"
                                  : rank === 2
                                  ? "30%"
                                  : "20%"}
                              </p>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Prize
                              </p>
                              <p className="text-lg font-semibold text-muted-foreground">
                                N/A
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
