"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { readContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
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
  judges: string[];
  metadataURI: string;
  totalSponsorshipAmount: bigint;
  minSponsorshipThreshold: bigint;
  finalized: boolean;
  creationFeeRefunded: boolean;
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
  const account = useActiveAccount();

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
            "function getHackathon(uint256 id) view returns ((uint256 id, address organizer, uint256 sponsorshipStart, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 creationFee, address[] judges, string metadataURI, uint256 totalSponsorshipAmount, uint256 minSponsorshipThreshold, bool finalized, bool creationFeeRefunded))",
          params: [BigInt(hackathonId)],
        })) as Hackathon;

        setHackathon(hackathonData);

        if (!hackathonData.finalized) {
          toast.error("Results not available yet. Scores must be finalized first.");
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

        const validTeams = teamsData.filter((t) => t !== null) as TeamWithScores[];

        // Sort teams by ranking
        validTeams.sort((a, b) => {
          return Number(a.registration.ranking) - Number(b.registration.ranking);
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
    const totalPrize = (hackathon.totalSponsorshipAmount * BigInt(80)) / BigInt(100);
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2 text-white">Error</h2>
          <p className="text-muted-foreground mb-6 text-lg">
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
    <div className="min-h-screen bg-black">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl relative z-10">
          <Button
            variant="ghost"
            onClick={() => router.push(`/home/${hackathonId}`)}
            className="mb-8 text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hackathon
          </Button>

          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-primary/50"></div>
                <span className="text-primary text-sm font-bold uppercase tracking-widest">
                  Final Results
                </span>
              </div>
              <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                Leaderboard
              </h1>
              <p className="text-2xl text-muted-foreground mb-8">
                Hackathon #{hackathonId} Final Rankings
              </p>

              {/* Prize Pool Info */}
              <div className="bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 border-2 border-primary/40 rounded-xl p-6 inline-block">
                <p className="text-xs text-primary/90 mb-2 font-bold uppercase">
                  Total Prize Pool (80%)
                </p>
                <p className="text-5xl font-extrabold text-white">
                  {formatEther((hackathon.totalSponsorshipAmount * BigInt(80)) / BigInt(100))} ETH
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {!hackathon.finalized && (
          <Card className="mb-6 bg-gradient-to-br from-warning/20 to-warning/10 border-2 border-warning/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Trophy className="h-12 w-12 text-warning" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Results Not Available
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The hackathon scores have not been finalized yet. Check back later.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {rankedTeams.length === 0 ? (
          <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20">
            <CardContent className="p-12 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                No teams with finalized scores yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {rankedTeams.map((team, index) => {
              const rank = Number(team.registration.ranking);
              const isWinner = rank <= 3;

              return (
                <Card
                  key={team.id.toString()}
                  className={`bg-gradient-to-br from-card to-card/50 border-2 ${
                    isWinner
                      ? "border-primary/60 shadow-2xl shadow-primary/20"
                      : "border-primary/20"
                  } transition-all hover:scale-[1.02]`}
                >
                  <CardHeader className={`${isWinner ? "bg-gradient-to-br from-primary/30 via-primary/20 to-transparent" : "bg-gradient-to-br from-primary/10 via-transparent to-transparent"} border-b-2 border-primary/30`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`flex items-center justify-center w-16 h-16 rounded-xl ${getRankBadge(rank)} font-extrabold text-2xl`}>
                          {rank <= 3 ? getRankIcon(rank) : `#${rank}`}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-3xl text-white mb-2 flex items-center gap-3">
                            {team.metadata?.name || `Team #${team.id.toString()}`}
                            {rank === 1 && (
                              <span className="px-4 py-1 bg-yellow-400/20 text-yellow-400 text-base font-semibold rounded-full border-2 border-yellow-400/40">
                                🏆 WINNER
                              </span>
                            )}
                          </CardTitle>
                          {team.metadata?.description && (
                            <CardDescription className="text-base mb-3">
                              {team.metadata.description}
                            </CardDescription>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Users className="h-4 w-4" />
                            <span>{team.members.length} members</span>
                          </div>
                        </div>
                      </div>
                      {team.metadata?.image && (
                        <img
                          src={team.metadata.image.replace(
                            "ipfs://",
                            "https://gateway.pinata.cloud/ipfs/"
                          )}
                          alt={team.metadata.name || "Team"}
                          className="w-24 h-24 rounded-lg object-cover border-2 border-primary/30"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">
                          Final Score
                        </p>
                        <p className="text-3xl font-extrabold text-primary">
                          {team.registration.finalScore.toString()}
                        </p>
                      </div>
                      <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">
                          Judge Score
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {team.registration.judgeScore.toString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          40% weight
                        </p>
                      </div>
                      <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">
                          Community
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {team.registration.participantScore.toString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          35% weight
                        </p>
                      </div>
                      <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">
                          AI Score
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {team.registration.aiScore.toString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          25% weight
                        </p>
                      </div>
                      {isWinner && (
                        <div className="bg-gradient-to-br from-success/30 to-success/10 border-2 border-success/40 rounded-xl p-4 text-center">
                          <p className="text-xs text-success mb-2 font-bold uppercase">
                            Prize
                          </p>
                          <p className="text-2xl font-extrabold text-white">
                            {getPrizeAmount(rank)} ETH
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {rank === 1 ? "50%" : rank === 2 ? "30%" : "20%"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
