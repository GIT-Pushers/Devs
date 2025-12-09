"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { readContract } from "thirdweb";
import { mainContract } from "@/app/constants/contracts";
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
} from "lucide-react";

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
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-100 dark:bg-blue-950",
      };
    if (now >= startTime && now <= endTime)
      return {
        status: "Active",
        color: "text-green-700 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-950",
      };
    return { status: "Ended", color: "text-foreground", bgColor: "bg-muted" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-destructive">Error</h2>
          <p className="text-muted-foreground mb-4">
            {error || "Hackathon not found"}
          </p>
          <button
            onClick={() => router.push("/home")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Hackathons
          </button>
        </div>
      </div>
    );
  }

  const sponsorshipStatus = getTimeStatus(
    hackathon.sponsorshipStart,
    hackathon.sponsorshipEnd
  );
  const hackathonStatus = getTimeStatus(hackathon.hackStart, hackathon.hackEnd);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathons
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Hackathon #{hackathon.id.toString()}
            </h1>
            <p className="text-muted-foreground">
              Detailed information and statistics
            </p>
          </div>
          {hackathon.finalized && (
            <span className="px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg font-semibold shadow-sm">
              ✓ Finalized
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organizer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Organizer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">
                  Organizer Address
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted/50 border px-3 py-2 rounded flex-1 break-all text-foreground font-mono">
                    {hackathon.organizer}
                  </code>
                  <button
                    onClick={() =>
                      window.open(
                        `https://sepolia.etherscan.io/address/${hackathon.organizer}`,
                        "_blank"
                      )
                    }
                    className="p-2 hover:bg-accent rounded transition-colors"
                    title="View on Etherscan"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">
                  Metadata URI
                </p>
                <code className="text-sm bg-muted/50 border px-3 py-2 rounded block break-all text-foreground font-mono">
                  {hackathon.metadataURI}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-foreground">
                    Sponsorship Period
                  </p>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${sponsorshipStatus.color} ${sponsorshipStatus.bgColor}`}
                  >
                    {sponsorshipStatus.status}
                  </span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 space-y-2 border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      Start:
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDate(hackathon.sponsorshipStart)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      End:
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDate(hackathon.sponsorshipEnd)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-foreground">
                    Hackathon Period
                  </p>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${hackathonStatus.color} ${hackathonStatus.bgColor}`}
                  >
                    {hackathonStatus.status}
                  </span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 space-y-2 border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      Start:
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDate(hackathon.hackStart)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      End:
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDate(hackathon.hackEnd)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fees and Refunds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Fees & Refunds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">
                    Creation Fee
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatEther(hackathon.creationFee)} ETH
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">
                    Fee Status
                  </p>
                  <p className="text-2xl font-bold">
                    {hackathon.creationFeeRefunded ? (
                      <span className="text-green-700 dark:text-green-300">
                        ✓ Refunded
                      </span>
                    ) : (
                      <span className="text-orange-700 dark:text-orange-300">
                        ⏳ Pending
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {/* Sponsorship Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Sponsorship</CardTitle>
              <CardDescription>Funding details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-medium">
                  Total Raised
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatEther(hackathon.totalSponsorshipAmount)} ETH
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2 font-medium">
                  Minimum Threshold
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {formatEther(hackathon.minSponsorshipThreshold)} ETH
                </p>
              </div>
              <div className="pt-4">
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
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
                <p className="text-xs text-muted-foreground mt-2 text-center">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Teams
              </CardTitle>
              <CardDescription>Participation limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-secondary/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">
                    Minimum
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {hackathon.minTeams}
                  </p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">
                    Maximum
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {hackathon.maxTeams}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2 font-medium">
                  Stake Amount
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatEther(hackathon.stakeAmount)} ETH
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Required per team to participate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold">
                Register Team
              </button>
              <button className="w-full py-3 px-4 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors font-semibold">
                Sponsor Hackathon
              </button>
              <button className="w-full py-3 px-4 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors font-semibold">
                View Participants
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
