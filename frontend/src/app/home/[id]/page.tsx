"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { readContract } from "thirdweb";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Users,
  Coins,
  Award,
  ExternalLink,
  Trophy,
  Sparkles,
  ArrowRight,
  UserPlus,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainContract } from "@/constants/contracts";

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

export default function HackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                  variant="outline"
                  className="w-full border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 font-bold py-6 text-base cursor-pointer"
                >
                  <Users className="mr-2 h-5 w-5" />
                  View Participants
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
