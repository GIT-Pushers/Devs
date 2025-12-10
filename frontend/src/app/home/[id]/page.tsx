"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { readContract, prepareContractCall } from "thirdweb";
import { TransactionButton } from "thirdweb/react";
import { useActiveAccount } from "thirdweb/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Users,
  Coins,
  Award,
  ExternalLink,
  Trophy,
  Sparkles,
  UserPlus,
  Key,
  CheckCircle,
  Lock,
  Upload,
  DollarSign,
  Gavel,
} from "lucide-react";
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
  metadataURI: string;
  totalSponsorshipAmount: bigint;
  minSponsorshipThreshold: bigint;
  finalized: boolean;
  judges?: string[];
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

export default function HackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;
  const account = useActiveAccount();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTeams, setUserTeams] = useState<
    (Team & { metadata?: TeamMetadata })[]
  >([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<
    Map<string, TeamRegistration>
  >(new Map());
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isStakeDialogOpen, setIsStakeDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isJudgeScoreDialogOpen, setIsJudgeScoreDialogOpen] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [submittedTeams, setSubmittedTeams] = useState<
    (Team & { metadata?: TeamMetadata; registration: TeamRegistration })[]
  >([]);
  const [loadingSubmittedTeams, setLoadingSubmittedTeams] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number>(0);

  useEffect(() => {
    const fetchHackathonDetails = async () => {
      try {
        setIsLoading(true);
        const hackathonData = await readContract({
          contract: mainContract,
          method:
            "function hackathons(uint256) view returns (uint256 id, address organizer, uint256 sponsorshipStart, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 creationFee, bool creationFeeRefunded, string metadataURI, uint256 totalSponsorshipAmount, uint256 minSponsorshipThreshold, bool finalized)",
          params: [BigInt(hackathonId)],
        });

        // Fetch judges separately
        const judgesData = await readContract({
          contract: mainContract,
          method:
            "function getHackathonJudges(uint256) view returns (address[])",
          params: [BigInt(hackathonId)],
        });

        setHackathon({
          id: hackathonData[0],
          organizer: hackathonData[1],
          sponsorshipStart: hackathonData[2],
          sponsorshipEnd: hackathonData[3],
          hackStart: hackathonData[4],
          hackEnd: hackathonData[5],
          stakeAmount: hackathonData[6],
          minTeams: hackathonData[7],
          maxTeams: hackathonData[8],
          creationFee: hackathonData[9],
          creationFeeRefunded: hackathonData[10],
          metadataURI: hackathonData[11],
          totalSponsorshipAmount: hackathonData[12],
          minSponsorshipThreshold: hackathonData[13],
          finalized: hackathonData[14],
          judges: judgesData as string[],
        });
      } catch (err) {
        setError("Failed to fetch hackathon details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (hackathonId) {
      fetchHackathonDetails();
    }
  }, [hackathonId]);

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!account?.address) {
        setUserTeams([]);
        return;
      }

      try {
        setLoadingTeams(true);

        // Get user's team IDs
        const teamIds = (await readContract({
          contract: mainContract,
          method:
            "function getUserTeams(address user) view returns (uint256[])",
          params: [account.address],
        })) as bigint[];

        if (teamIds.length === 0) {
          setUserTeams([]);
          setLoadingTeams(false);
          return;
        }

        // Fetch team details and registration status
        const teamsData = await Promise.all(
          teamIds.map(async (teamId) => {
            try {
              const team = (await readContract({
                contract: mainContract,
                method:
                  "function getTeam(uint256 id) view returns ((uint256 id, address creator, string metadataURI, address[] members, bytes32 joinCodeHash, bool exists))",
                params: [teamId],
              })) as Team;

              // Fetch registration status
              const registration = (await readContract({
                contract: mainContract,
                method:
                  "function getTeamRegistration(uint256 hackathonId, uint256 teamId) view returns ((bool registered, bool staked, address staker, bool tokensMinted, bool projectSubmitted, bytes32 repoHash, uint256 aiScore, uint256 judgeScore, uint256 participantScore, uint256 finalScore, uint256 ranking, bool scoreFinalized))",
                params: [BigInt(hackathonId), teamId],
              })) as TeamRegistration;

              // Store registration status
              setRegistrationStatus((prev) => {
                const newMap = new Map(prev);
                newMap.set(teamId.toString(), registration);
                return newMap;
              });

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
              };
            } catch (err) {
              console.error(`Error fetching team ${teamId}:`, err);
              return null;
            }
          })
        );

        const validTeams = teamsData.filter(
          (team) => team !== null
        ) as (Team & {
          metadata?: TeamMetadata;
        })[];
        setUserTeams(validTeams);
      } catch (err) {
        console.error("Error fetching user teams:", err);
      } finally {
        setLoadingTeams(false);
      }
    };

    if (hackathonId && account?.address) {
      fetchUserTeams();
    }
  }, [hackathonId, account?.address]);

  // Fetch submitted teams for judging
  useEffect(() => {
    const fetchSubmittedTeams = async () => {
      if (!account?.address || !hackathon || !isJudge) return;

      // Only fetch after hackathon ends
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (now <= hackathon.hackEnd) return;

      try {
        setLoadingSubmittedTeams(true);

        // Get all hackathon teams
        const teamIds = (await readContract({
          contract: mainContract,
          method:
            "function getHackathonTeams(uint256 hackathonId) view returns (uint256[])",
          params: [BigInt(hackathonId)],
        })) as bigint[];

        if (teamIds.length === 0) {
          setSubmittedTeams([]);
          return;
        }

        // Fetch teams with submitted projects
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

              // Only include teams that submitted projects
              if (!registration.projectSubmitted) return null;

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

        const validTeams = teamsData.filter((t) => t !== null) as (Team & {
          metadata?: TeamMetadata;
          registration: TeamRegistration;
        })[];
        setSubmittedTeams(validTeams);
      } catch (error) {
        console.error("Error fetching submitted teams:", error);
      } finally {
        setLoadingSubmittedTeams(false);
      }
    };

    fetchSubmittedTeams();
  }, [hackathonId, account?.address, hackathon, isJudge]);

  // Check if connected wallet is a judge
  useEffect(() => {
    const checkJudgeStatus = async () => {
      if (!account?.address || !hackathon) return;

      try {
        const judgeStatus = (await readContract({
          contract: mainContract,
          method:
            "function isJudge(uint256 hackathonId, address judge) view returns (bool)",
          params: [BigInt(hackathonId), account.address],
        })) as boolean;

        setIsJudge(judgeStatus);
      } catch (error) {
        console.error("Error checking judge status:", error);
      }
    };

    checkJudgeStatus();
  }, [hackathonId, account?.address, hackathon]);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEther = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(6);
  };

  const getTimeStatus = (start: bigint, end: bigint) => {
    const now = Date.now() / 1000;
    const startTime = Number(start);
    const endTime = Number(end);

    if (now < startTime)
      return {
        status: "Upcoming",
        color: "text-primary",
        bgColor: "bg-primary/20 border-primary/30",
      };
    if (now >= startTime && now <= endTime)
      return {
        status: "Active",
        color: "text-green-400",
        bgColor: "bg-green-500/20 border-green-500/30",
      };
    return {
      status: "Ended",
      color: "text-muted-foreground",
      bgColor: "bg-muted/20 border-border",
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">
            Loading hackathon details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Sparkles className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2 text-white">Error</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            {error || "Hackathon not found"}
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

  const sponsorshipStatus = getTimeStatus(
    hackathon.sponsorshipStart,
    hackathon.sponsorshipEnd
  );
  const hackathonStatus = getTimeStatus(hackathon.hackStart, hackathon.hackEnd);

  const isActive =
    Number(hackathon.hackStart) * 1000 <= Date.now() &&
    Number(hackathon.hackEnd) * 1000 >= Date.now();

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 overflow-hidden"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl relative z-10 overflow-hidden">
          <Button
            variant="ghost"
            onClick={() => router.push("/home")}
            className="mb-8 text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hackathons
          </Button>

          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-primary/50"></div>
                <span className="text-primary text-sm font-bold uppercase tracking-widest">
                  Hackathon Details
                </span>
              </div>
              <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                Hackathon #{hackathon.id.toString()}
              </h1>
              <p className="text-2xl text-muted-foreground mb-8">
                Complete information and statistics
              </p>

              {/* Quick Stats Row */}
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Prize Pool
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatEther(hackathon.totalSponsorshipAmount)} ETH
                  </p>
                </div>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Teams
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {hackathon.minTeams} - {hackathon.maxTeams}
                  </p>
                </div>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Stake
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatEther(hackathon.stakeAmount)} ETH
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {hackathon.finalized && (
                <span className="px-6 py-3 bg-green-500/20 text-green-400 border-2 border-green-500/40 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20">
                  ✓ Finalized
                </span>
              )}
              {isActive && !hackathon.finalized && (
                <span className="px-6 py-3 bg-primary/30 text-primary border-2 border-primary/50 rounded-xl font-bold text-sm animate-pulse shadow-lg shadow-primary/30">
                  🔥 Active Now
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl overflow-hidden">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6 overflow-hidden">
            {/* Organizer Card */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  Organizer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-widest">
                    Organizer Address
                  </p>
                  <div className="flex items-center gap-3">
                    <code className="text-sm bg-black/40 border-2 border-primary/20 px-5 py-4 rounded-xl flex-1 break-all text-white font-mono backdrop-blur-sm">
                      {hackathon.organizer}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(
                          `https://sepolia.etherscan.io/address/${hackathon.organizer}`,
                          "_blank"
                        )
                      }
                      className="flex-shrink-0 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 h-12 w-12"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-widest">
                    Metadata URI
                  </p>
                  <code className="text-sm bg-black/40 border-2 border-primary/20 px-5 py-4 rounded-xl block break-all text-white font-mono backdrop-blur-sm">
                    {hackathon.metadataURI || "No metadata available"}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-white text-xl">
                      Sponsorship Period
                    </p>
                    <span
                      className={`text-xs font-bold px-4 py-2 rounded-full border-2 ${sponsorshipStatus.color} ${sponsorshipStatus.bgColor}`}
                    >
                      {sponsorshipStatus.status}
                    </span>
                  </div>
                  <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-5 space-y-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        Start:
                      </span>
                      <span className="font-bold text-white text-lg">
                        {formatDate(hackathon.sponsorshipStart)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        End:
                      </span>
                      <span className="font-bold text-white text-lg">
                        {formatDate(hackathon.sponsorshipEnd)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-white text-xl">
                      Hackathon Period
                    </p>
                    <span
                      className={`text-xs font-bold px-4 py-2 rounded-full border-2 ${hackathonStatus.color} ${hackathonStatus.bgColor}`}
                    >
                      {hackathonStatus.status}
                    </span>
                  </div>
                  <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-5 space-y-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        Start:
                      </span>
                      <span className="font-bold text-white text-lg">
                        {formatDate(hackathon.hackStart)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        End:
                      </span>
                      <span className="font-bold text-white text-lg">
                        {formatDate(hackathon.hackEnd)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fees and Refunds */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                    <Coins className="w-6 h-6 text-primary" />
                  </div>
                  Fees & Refunds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-5 backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-widest">
                      Creation Fee
                    </p>
                    <p className="text-3xl font-extrabold text-white">
                      {formatEther(hackathon.creationFee)} ETH
                    </p>
                  </div>
                  <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-5 backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-widest">
                      Fee Status
                    </p>
                    <p className="text-2xl font-extrabold">
                      {hackathon.creationFeeRefunded ? (
                        <span className="text-green-400">✓ Refunded</span>
                      ) : (
                        <span className="text-primary">⏳ Pending</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6 overflow-hidden">
            {/* Sponsorship Stats */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                <CardTitle className="text-white text-xl">
                  Sponsorship
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Funding details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/20">
                  <p className="text-xs text-primary/90 mb-3 font-bold uppercase tracking-widest">
                    Total Raised
                  </p>
                  <p className="text-5xl font-extrabold text-white">
                    {formatEther(hackathon.totalSponsorshipAmount)} ETH
                  </p>
                </div>
                <div className="pt-4 border-t-2 border-primary/20">
                  <p className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-widest">
                    Minimum Threshold
                  </p>
                  <p className="text-3xl font-extrabold text-white">
                    {formatEther(hackathon.minSponsorshipThreshold)} ETH
                  </p>
                </div>
                <div className="pt-4">
                  <div className="w-full bg-black/40 border-2 border-primary/20 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                    <div
                      className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 h-4 rounded-full transition-all shadow-lg shadow-primary/30"
                      style={{
                        width: `${Math.min(
                          (Number(hackathon.totalSponsorshipAmount) /
                            Number(hackathon.minSponsorshipThreshold)) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center font-semibold">
                    {(
                      (Number(hackathon.totalSponsorshipAmount) /
                        Number(hackathon.minSponsorshipThreshold)) *
                      100
                    ).toFixed(1)}
                    % of minimum threshold
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Team Information */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  Teams
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Participation limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-5 bg-black/40 border-2 border-primary/20 rounded-xl backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-widest">
                      Minimum
                    </p>
                    <p className="text-4xl font-extrabold text-white">
                      {hackathon.minTeams}
                    </p>
                  </div>
                  <div className="text-center p-5 bg-black/40 border-2 border-primary/20 rounded-xl backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-widest">
                      Maximum
                    </p>
                    <p className="text-4xl font-extrabold text-white">
                      {hackathon.maxTeams}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t-2 border-primary/20">
                  <p className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-widest">
                    Stake Amount
                  </p>
                  <p className="text-3xl font-extrabold text-primary">
                    {formatEther(hackathon.stakeAmount)} ETH
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Required per team to participate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Judges */}
            {hackathon.judges && hackathon.judges.length > 0 && (
              <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                    <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                      <Gavel className="w-6 h-6 text-primary" />
                    </div>
                    Judges
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Panel of judges for this hackathon
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {hackathon.judges.map((judge, index) => (
                    <div
                      key={judge}
                      className={`p-4 bg-black/40 border-2 rounded-xl backdrop-blur-sm transition-all ${
                        account?.address?.toLowerCase() === judge.toLowerCase()
                          ? "border-primary/50 bg-primary/10"
                          : "border-primary/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-widest">
                            Judge #{index + 1}
                          </p>
                          <code className="text-sm text-white font-mono break-all">
                            {judge}
                          </code>
                        </div>
                        {account?.address?.toLowerCase() ===
                          judge.toLowerCase() && (
                          <span className="ml-3 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold border border-primary/30">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                <CardTitle className="text-white text-xl">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Button
                  onClick={() => router.push("/CreateTeam")}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-base shadow-lg shadow-primary/30 border-2 border-primary/40 cursor-pointer"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create Team
                </Button>
                <Button
                  onClick={() => router.push("/jointeam")}
                  variant="outline"
                  className="w-full border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 font-bold py-6 text-base cursor-pointer"
                >
                  <Key className="mr-2 h-5 w-5" />
                  Join Team
                </Button>

                {/* Register Team Dialog */}
                <Dialog
                  open={isRegisterDialogOpen}
                  onOpenChange={setIsRegisterDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10 font-bold py-6 text-base cursor-pointer"
                      disabled={!account?.address || loadingTeams}
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Register Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">
                        Register Team for Hackathon
                      </DialogTitle>
                      <DialogDescription>
                        Select a team to register for this hackathon.
                        Registration is required before staking.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {!account?.address && (
                        <p className="text-center text-muted-foreground py-8">
                          Please connect your wallet to register a team
                        </p>
                      )}
                      {account?.address && loadingTeams && (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="ml-3 text-muted-foreground">
                            Loading your teams...
                          </p>
                        </div>
                      )}
                      {account?.address &&
                        !loadingTeams &&
                        userTeams.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                              You don&apos;t have any teams yet
                            </p>
                            <Button onClick={() => router.push("/CreateTeam")}>
                              Create Team
                            </Button>
                          </div>
                        )}
                      {account?.address &&
                        !loadingTeams &&
                        userTeams.length > 0 && (
                          <div className="space-y-3">
                            {userTeams.map((team) => {
                              const regStatus = registrationStatus.get(
                                team.id.toString()
                              );
                              const isRegistered =
                                regStatus?.registered || false;
                              return (
                                <Card
                                  key={team.id.toString()}
                                  className={`cursor-pointer transition-all ${
                                    selectedTeamId === team.id.toString()
                                      ? "border-2 border-primary bg-primary/5"
                                      : "border hover:border-primary/50"
                                  } ${isRegistered ? "opacity-50" : ""}`}
                                  onClick={() =>
                                    !isRegistered &&
                                    setSelectedTeamId(team.id.toString())
                                  }
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">
                                          {team.metadata?.name ||
                                            `Team #${team.id.toString()}`}
                                        </h3>
                                        {team.metadata?.description && (
                                          <p className="text-sm text-muted-foreground mb-2">
                                            {team.metadata.description}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                          {team.members.length} member
                                          {team.members.length !== 1 ? "s" : ""}
                                        </p>
                                        {isRegistered && (
                                          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                            <CheckCircle className="h-3 w-3" />
                                            Already Registered
                                          </div>
                                        )}
                                      </div>
                                      {team.metadata?.image && (
                                        <img
                                          src={team.metadata.image.replace(
                                            "ipfs://",
                                            "https://gateway.pinata.cloud/ipfs/"
                                          )}
                                          alt={team.metadata.name || "Team"}
                                          className="w-16 h-16 rounded-lg object-cover border"
                                        />
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      {selectedTeamId &&
                        !registrationStatus.get(selectedTeamId)?.registered && (
                          <div className="pt-4 border-t">
                            <TransactionButton
                              transaction={() => {
                                return prepareContractCall({
                                  contract: mainContract,
                                  method:
                                    "function registerTeam(uint256 hackathonId, uint256 teamId)",
                                  params: [
                                    BigInt(hackathonId),
                                    BigInt(selectedTeamId),
                                  ],
                                });
                              }}
                              onTransactionConfirmed={() => {
                                toast.success("Team registered successfully!");
                                setIsRegisterDialogOpen(false);
                                setSelectedTeamId(null);
                                // Refresh the page to update status
                                window.location.reload();
                              }}
                              onError={(error) => {
                                console.error("Registration error:", error);
                                toast.error(
                                  `Registration failed: ${error.message}`
                                );
                              }}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6"
                            >
                              Register Team #{selectedTeamId}
                            </TransactionButton>
                          </div>
                        )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Stake for Team Dialog */}
                <Dialog
                  open={isStakeDialogOpen}
                  onOpenChange={setIsStakeDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/10 font-bold py-6 text-base cursor-pointer"
                      disabled={!account?.address || loadingTeams}
                    >
                      <Lock className="mr-2 h-5 w-5" />
                      Stake for Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">
                        Stake for Team
                      </DialogTitle>
                      <DialogDescription>
                        Select a registered team to stake{" "}
                        {formatEther(hackathon.stakeAmount)} ETH
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {!account?.address && (
                        <p className="text-center text-muted-foreground py-8">
                          Please connect your wallet to stake
                        </p>
                      )}
                      {account?.address && loadingTeams && (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="ml-3 text-muted-foreground">
                            Loading your teams...
                          </p>
                        </div>
                      )}
                      {account?.address &&
                        !loadingTeams &&
                        userTeams.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                              You don&apos;t have any teams yet
                            </p>
                            <Button onClick={() => router.push("/CreateTeam")}>
                              Create Team
                            </Button>
                          </div>
                        )}
                      {account?.address &&
                        !loadingTeams &&
                        userTeams.length > 0 && (
                          <>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                              <p className="text-sm font-semibold mb-2">
                                Stake Amount Required:
                              </p>
                              <p className="text-3xl font-bold text-yellow-400">
                                {formatEther(hackathon.stakeAmount)} ETH
                              </p>
                            </div>
                            <div className="space-y-3">
                              {userTeams.map((team) => {
                                const regStatus = registrationStatus.get(
                                  team.id.toString()
                                );
                                const isRegistered =
                                  regStatus?.registered || false;
                                const isStaked = regStatus?.staked || false;
                                const canStake = isRegistered && !isStaked;
                                return (
                                  <Card
                                    key={team.id.toString()}
                                    className={`cursor-pointer transition-all ${
                                      selectedTeamId === team.id.toString()
                                        ? "border-2 border-primary bg-primary/5"
                                        : "border hover:border-primary/50"
                                    } ${!canStake ? "opacity-50" : ""}`}
                                    onClick={() =>
                                      canStake &&
                                      setSelectedTeamId(team.id.toString())
                                    }
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <h3 className="font-bold text-lg mb-1">
                                            {team.metadata?.name ||
                                              `Team #${team.id.toString()}`}
                                          </h3>
                                          {team.metadata?.description && (
                                            <p className="text-sm text-muted-foreground mb-2">
                                              {team.metadata.description}
                                            </p>
                                          )}
                                          <p className="text-xs text-muted-foreground">
                                            {team.members.length} member
                                            {team.members.length !== 1
                                              ? "s"
                                              : ""}
                                          </p>
                                          {!isRegistered && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                                              Not Registered
                                            </div>
                                          )}
                                          {isStaked && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                              <Lock className="h-3 w-3" />
                                              Already Staked
                                            </div>
                                          )}
                                          {isRegistered && !isStaked && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                                              Ready to Stake
                                            </div>
                                          )}
                                        </div>
                                        {team.metadata?.image && (
                                          <img
                                            src={team.metadata.image.replace(
                                              "ipfs://",
                                              "https://gateway.pinata.cloud/ipfs/"
                                            )}
                                            alt={team.metadata.name || "Team"}
                                            className="w-16 h-16 rounded-lg object-cover border"
                                          />
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </>
                        )}
                      {selectedTeamId &&
                        registrationStatus.get(selectedTeamId)?.registered &&
                        !registrationStatus.get(selectedTeamId)?.staked && (
                          <div className="pt-4 border-t">
                            <TransactionButton
                              transaction={() => {
                                return prepareContractCall({
                                  contract: mainContract,
                                  method:
                                    "function stakeForTeam(uint256 hackathonId, uint256 teamId) payable",
                                  params: [
                                    BigInt(hackathonId),
                                    BigInt(selectedTeamId),
                                  ],
                                  value: hackathon.stakeAmount,
                                });
                              }}
                              onTransactionConfirmed={() => {
                                toast.success(
                                  `Successfully staked ${formatEther(
                                    hackathon.stakeAmount
                                  )} ETH!`
                                );
                                setIsStakeDialogOpen(false);
                                setSelectedTeamId(null);
                                // Refresh the page to update status
                                window.location.reload();
                              }}
                              onError={(error) => {
                                console.error("Staking error:", error);
                                toast.error(`Staking failed: ${error.message}`);
                              }}
                              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6"
                            >
                              Stake {formatEther(hackathon.stakeAmount)} ETH for
                              Team #{selectedTeamId}
                            </TransactionButton>
                          </div>
                        )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() =>
                    router.push(`/sponsor/${hackathon.id.toString()}`)
                  }
                  variant="outline"
                  className="w-full border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 font-bold py-6 text-base cursor-pointer"
                >
                  <Coins className="mr-2 h-5 w-5" />
                  Sponsor Hackathon
                </Button>
                <Button
                  onClick={() =>
                    router.push(`/sponsors/${hackathon.id.toString()}`)
                  }
                  variant="outline"
                  className="w-full border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 font-bold py-6 text-base cursor-pointer"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  View Sponsors
                </Button>
                <Button
                  onClick={() =>
                    router.push(`/participants/${hackathon.id.toString()}`)
                  }
                  variant="outline"
                  className="w-full border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 font-bold py-6 text-base cursor-pointer"
                >
                  <Users className="mr-2 h-5 w-5" />
                  View Participants
                </Button>
                <Button
                  onClick={() =>
                    router.push(`/submission/${hackathon.id.toString()}`)
                  }
                  variant="outline"
                  className="w-full border-2 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10 font-bold py-6 text-base cursor-pointer"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Submit Project
                </Button>

                {/* Judge Score Dialog */}
                {isJudge &&
                  hackathon.hackEnd < BigInt(Math.floor(Date.now() / 1000)) && (
                    <Dialog
                      open={isJudgeScoreDialogOpen}
                      onOpenChange={setIsJudgeScoreDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 font-bold py-6 text-base cursor-pointer"
                          disabled={!account?.address || loadingSubmittedTeams}
                        >
                          <Gavel className="mr-2 h-5 w-5" />
                          Judge Submissions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">
                            Judge Submissions
                          </DialogTitle>
                          <DialogDescription>
                            Score submitted projects (0-100). You can only score
                            each team once.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {!account?.address && (
                            <p className="text-center text-muted-foreground py-8">
                              Please connect your wallet to judge
                            </p>
                          )}
                          {account?.address && loadingSubmittedTeams && (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              <p className="ml-3 text-muted-foreground">
                                Loading submissions...
                              </p>
                            </div>
                          )}
                          {account?.address &&
                            !loadingSubmittedTeams &&
                            submittedTeams.length === 0 && (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                  No submissions yet for this hackathon
                                </p>
                              </div>
                            )}
                          {account?.address &&
                            !loadingSubmittedTeams &&
                            submittedTeams.length > 0 && (
                              <div className="space-y-3">
                                {submittedTeams.map((team) => {
                                  const hasScored =
                                    team.registration.judgeScore > 0n;

                                  return (
                                    <Card
                                      key={team.id.toString()}
                                      className={`transition-all ${
                                        selectedTeamId === team.id.toString()
                                          ? "border-2 border-primary bg-primary/5"
                                          : "border hover:border-primary/50"
                                      }`}
                                    >
                                      <CardContent className="p-4">
                                        <div className="space-y-4">
                                          <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                              <h3 className="font-bold text-lg mb-1">
                                                {team.metadata?.name ||
                                                  `Team #${team.id.toString()}`}
                                              </h3>
                                              {team.metadata?.description && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                  {team.metadata.description}
                                                </p>
                                              )}
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                                                  <CheckCircle className="h-3 w-3" />
                                                  Project Submitted
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                                                  AI Score:{" "}
                                                  {team.registration.aiScore.toString()}
                                                  /100
                                                </span>
                                                {hasScored && (
                                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Scored
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            {team.metadata?.image && (
                                              <img
                                                src={team.metadata.image.replace(
                                                  "ipfs://",
                                                  "https://gateway.pinata.cloud/ipfs/"
                                                )}
                                                alt={
                                                  team.metadata.name || "Team"
                                                }
                                                className="w-16 h-16 rounded-lg object-cover border"
                                              />
                                            )}
                                          </div>

                                          {selectedTeamId ===
                                            team.id.toString() &&
                                            !hasScored && (
                                              <div className="space-y-3 pt-3 border-t">
                                                <div>
                                                  <label className="text-sm font-semibold mb-2 block">
                                                    Score (0-100):
                                                  </label>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={selectedScore}
                                                    onChange={(e) =>
                                                      setSelectedScore(
                                                        Math.min(
                                                          100,
                                                          Math.max(
                                                            0,
                                                            parseInt(
                                                              e.target.value
                                                            ) || 0
                                                          )
                                                        )
                                                      )
                                                    }
                                                    className="w-full px-4 py-3 bg-black/40 border-2 border-primary/20 rounded-lg text-white font-semibold text-lg focus:outline-none focus:border-primary/50"
                                                    placeholder="Enter score (0-100)"
                                                  />
                                                </div>
                                                <TransactionButton
                                                  transaction={() => {
                                                    if (
                                                      selectedScore < 0 ||
                                                      selectedScore > 100
                                                    ) {
                                                      toast.error(
                                                        "Score must be between 0 and 100"
                                                      );
                                                      return;
                                                    }
                                                    return prepareContractCall({
                                                      contract: mainContract,
                                                      method:
                                                        "function submitJudgeScore(uint256 hackathonId, uint256 teamId, uint256 score)",
                                                      params: [
                                                        BigInt(hackathonId),
                                                        team.id,
                                                        BigInt(selectedScore),
                                                      ],
                                                    });
                                                  }}
                                                  onTransactionConfirmed={() => {
                                                    toast.success(
                                                      `Score ${selectedScore} submitted successfully!`
                                                    );
                                                    setSelectedTeamId(null);
                                                    setSelectedScore(0);
                                                    // Refresh the page to update status
                                                    window.location.reload();
                                                  }}
                                                  onError={(error) => {
                                                    console.error(
                                                      "Scoring error:",
                                                      error
                                                    );
                                                    toast.error(
                                                      `Scoring failed: ${error.message}`
                                                    );
                                                  }}
                                                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3"
                                                >
                                                  Submit Score: {selectedScore}
                                                  /100
                                                </TransactionButton>
                                              </div>
                                            )}

                                          {!hasScored &&
                                            selectedTeamId !==
                                              team.id.toString() && (
                                              <Button
                                                onClick={() => {
                                                  setSelectedTeamId(
                                                    team.id.toString()
                                                  );
                                                  setSelectedScore(0);
                                                }}
                                                className="w-full"
                                                variant="outline"
                                              >
                                                <Gavel className="mr-2 h-4 w-4" />
                                                Score This Team
                                              </Button>
                                            )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                {/* Calculate Final Scores - Anyone can call after hackathon ends */}
                {hackathon.hackEnd < BigInt(Math.floor(Date.now() / 1000)) &&
                  !hackathon.finalized && (
                    <TransactionButton
                      transaction={() => {
                        return prepareContractCall({
                          contract: mainContract,
                          method:
                            "function calculateFinalScores(uint256 hackathonId)",
                          params: [BigInt(hackathonId)],
                        });
                      }}
                      onTransactionSent={() => {
                        toast.info("Calculating final scores...");
                      }}
                      onTransactionConfirmed={() => {
                        toast.success(
                          "Final scores calculated and rankings assigned!"
                        );
                        setTimeout(() => window.location.reload(), 2000);
                      }}
                      onError={(error) => {
                        console.error("Calculate scores error:", error);
                        toast.error(
                          `Failed to calculate scores: ${error.message}`
                        );
                      }}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-6 text-base border-2 border-purple-600"
                    >
                      <Award className="mr-2 h-5 w-5" />
                      Calculate Final Scores & Rankings
                    </TransactionButton>
                  )}

                {/* Distribute Rewards - Anyone can call after finalization */}
                {hackathon.finalized && (
                  <TransactionButton
                    transaction={() => {
                      return prepareContractCall({
                        contract: mainContract,
                        method:
                          "function distributeRewards(uint256 hackathonId)",
                        params: [BigInt(hackathonId)],
                      });
                    }}
                    onTransactionSent={() => {
                      toast.info("Distributing rewards...");
                    }}
                    onTransactionConfirmed={() => {
                      toast.success(
                        "Rewards distributed successfully to winning teams!"
                      );
                      setTimeout(() => window.location.reload(), 2000);
                    }}
                    onError={(error) => {
                      console.error("Distribute rewards error:", error);
                      toast.error(
                        `Failed to distribute rewards: ${error.message}`
                      );
                    }}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-base border-2 border-yellow-600 shadow-lg shadow-yellow-500/30"
                  >
                    <Trophy className="mr-2 h-5 w-5" />
                    Distribute Rewards to Winners
                  </TransactionButton>
                )}

                {/* Settle Creation Fee - Organizer Only */}
                {account?.address?.toLowerCase() ===
                  hackathon.organizer.toLowerCase() &&
                  hackathon.finalized &&
                  !hackathon.creationFeeRefunded && (
                    <TransactionButton
                      transaction={() => {
                        return prepareContractCall({
                          contract: mainContract,
                          method:
                            "function settleCreationFee(uint256 hackathonId)",
                          params: [BigInt(hackathonId)],
                        });
                      }}
                      onTransactionSent={() => {
                        toast.info("Settling creation fee...");
                      }}
                      onTransactionConfirmed={() => {
                        toast.success(
                          "Creation fee settled! Refund transferred if ≥100 participants."
                        );
                        setTimeout(() => window.location.reload(), 2000);
                      }}
                      onError={(error) => {
                        console.error("Settle creation fee error:", error);
                        toast.error(
                          `Failed to settle creation fee: ${error.message}`
                        );
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-6 text-base border-2 border-blue-600 shadow-lg shadow-blue-500/30"
                    >
                      <DollarSign className="mr-2 h-5 w-5" />
                      Settle Creation Fee (80% Refund if ≥100 Participants)
                    </TransactionButton>
                  )}

                {/* Refund Stake Dialog */}
                {hackathon.finalized && (
                  <Dialog
                    open={isRefundDialogOpen}
                    onOpenChange={setIsRefundDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-2 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10 font-bold py-6 text-base cursor-pointer"
                        disabled={!account?.address || loadingTeams}
                      >
                        <DollarSign className="mr-2 h-5 w-5" />
                        Claim Stake Refund
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">
                          Claim Stake Refund
                        </DialogTitle>
                        <DialogDescription>
                          Hackathon is finalized. Claim your stake refund of{" "}
                          {formatEther(hackathon.stakeAmount)} ETH
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {!account?.address && (
                          <p className="text-center text-muted-foreground py-8">
                            Please connect your wallet to claim refund
                          </p>
                        )}
                        {account?.address && loadingTeams && (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="ml-3 text-muted-foreground">
                              Loading your teams...
                            </p>
                          </div>
                        )}
                        {account?.address &&
                          !loadingTeams &&
                          userTeams.length === 0 && (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground mb-4">
                                You don&apos;t have any teams in this hackathon
                              </p>
                            </div>
                          )}
                        {account?.address &&
                          !loadingTeams &&
                          userTeams.length > 0 && (
                            <>
                              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <p className="text-sm font-semibold mb-2">
                                  Refund Amount per Team:
                                </p>
                                <p className="text-3xl font-bold text-green-400">
                                  {formatEther(hackathon.stakeAmount)} ETH
                                </p>
                              </div>
                              <div className="space-y-3">
                                {userTeams.map((team) => {
                                  const regStatus = registrationStatus.get(
                                    team.id.toString()
                                  );
                                  const isStaked = regStatus?.staked || false;
                                  const isStaker =
                                    regStatus?.staker?.toLowerCase() ===
                                    account.address?.toLowerCase();
                                  const canRefund = isStaked && isStaker;

                                  return (
                                    <Card
                                      key={team.id.toString()}
                                      className={`cursor-pointer transition-all ${
                                        selectedTeamId === team.id.toString()
                                          ? "border-2 border-primary bg-primary/5"
                                          : "border hover:border-primary/50"
                                      } ${!canRefund ? "opacity-50" : ""}`}
                                      onClick={() =>
                                        canRefund &&
                                        setSelectedTeamId(team.id.toString())
                                      }
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">
                                              {team.metadata?.name ||
                                                `Team #${team.id.toString()}`}
                                            </h3>
                                            {team.metadata?.description && (
                                              <p className="text-sm text-muted-foreground mb-2">
                                                {team.metadata.description}
                                              </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                              {team.members.length} member
                                              {team.members.length !== 1
                                                ? "s"
                                                : ""}
                                            </p>
                                            {!isStaked && (
                                              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                                                Not Staked
                                              </div>
                                            )}
                                            {isStaked && !isStaker && (
                                              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                                                Staked by Another Member
                                              </div>
                                            )}
                                            {canRefund && (
                                              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                                <DollarSign className="h-3 w-3" />
                                                Refund Available
                                              </div>
                                            )}
                                          </div>
                                          {team.metadata?.image && (
                                            <img
                                              src={team.metadata.image.replace(
                                                "ipfs://",
                                                "https://gateway.pinata.cloud/ipfs/"
                                              )}
                                              alt={team.metadata.name || "Team"}
                                              className="w-16 h-16 rounded-lg object-cover border"
                                            />
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        {selectedTeamId &&
                          account?.address &&
                          registrationStatus.get(selectedTeamId)?.staked &&
                          registrationStatus
                            .get(selectedTeamId)
                            ?.staker?.toLowerCase() ===
                            account.address?.toLowerCase() && (
                            <div className="pt-4 border-t">
                              <TransactionButton
                                transaction={() => {
                                  return prepareContractCall({
                                    contract: mainContract,
                                    method:
                                      "function refundStake(uint256 hackathonId, uint256 teamId)",
                                    params: [
                                      BigInt(hackathonId),
                                      BigInt(selectedTeamId),
                                    ],
                                  });
                                }}
                                onTransactionConfirmed={() => {
                                  toast.success(
                                    `Successfully refunded ${formatEther(
                                      hackathon.stakeAmount
                                    )} ETH!`
                                  );
                                  setIsRefundDialogOpen(false);
                                  setSelectedTeamId(null);
                                  // Refresh the page to update status
                                  window.location.reload();
                                }}
                                onError={(error) => {
                                  console.error("Refund error:", error);
                                  toast.error(
                                    `Refund failed: ${error.message}`
                                  );
                                }}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6"
                              >
                                Claim {formatEther(hackathon.stakeAmount)} ETH
                                Refund for Team #{selectedTeamId}
                              </TransactionButton>
                            </div>
                          )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
