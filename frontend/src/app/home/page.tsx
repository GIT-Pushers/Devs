"use client";
import React, { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { mainContract } from "@/constants/contracts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readContract } from "thirdweb";
import { useRouter } from "next/navigation";
import { Calendar, Users, Coins, Trophy, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const HackathonDisplayPage = () => {
  const router = useRouter();
  const { data: hackathonCount, isPending: isCountPending } = useReadContract({
    contract: mainContract,
    method: "function hackathonCount() view returns (uint256)",
    params: [],
  });

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoadingHackathons, setIsLoadingHackathons] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const fetchHackathons = async () => {
      if (!hackathonCount || hackathonCount === BigInt(0)) return;

      setIsLoadingHackathons(true);
      const count = Number(hackathonCount);
      const fetchedHackathons: Hackathon[] = [];

      for (let i = 0; i < count; i++) {
        try {
          const hackathonData = await readContract({
            contract: mainContract,
            method:
              "function hackathons(uint256) view returns (uint256 id, address organizer, uint256 sponsorshipStart, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 creationFee, bool creationFeeRefunded, string metadataURI, uint256 totalSponsorshipAmount, uint256 minSponsorshipThreshold, bool finalized)",
            params: [BigInt(i)],
          });

          fetchedHackathons.push({
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
          });

          setLoadingProgress(((i + 1) / count) * 100);
        } catch (error) {
          console.error(`Error fetching hackathon ${i}:`, error);
        }
      }

      setHackathons(fetchedHackathons);
      setIsLoadingHackathons(false);
    };

    fetchHackathons();
  }, [hackathonCount]);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEther = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  if (isCountPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">
            Loading hackathon count...
          </p>
        </div>
      </div>
    );
  }

  if (hackathonCount === BigInt(0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2 text-white">No Hackathons Yet</h2>
          <p className="text-muted-foreground text-lg">
            Be the first to create a hackathon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-primary"></div>
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Active Hackathons
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Discover & Compete
          </h1>
          <p className="text-xl text-muted-foreground">
            {hackathonCount?.toString()} active hackathon{hackathonCount !== BigInt(1) ? 's' : ''} ready for you
          </p>
        </div>

        {isLoadingHackathons && (
          <div className="mb-12">
            <div className="w-full bg-muted/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-primary/60 h-3 rounded-full transition-all duration-300 shadow-lg shadow-primary/20"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Loading hackathons... {Math.round(loadingProgress)}%
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon, index) => {
            const isActive = Number(hackathon.hackStart) * 1000 <= Date.now() && Number(hackathon.hackEnd) * 1000 >= Date.now();
            
            return (
              <Card
                key={index}
                className="group flex flex-col bg-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden"
              >
                {/* Card Header with Gradient */}
                <CardHeader className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/50 pb-3 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-white mb-0.5">
                        Hackathon #{hackathon.id.toString()}
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground truncate">
                        {hackathon.organizer.slice(0, 6)}...{hackathon.organizer.slice(-4)}
                      </CardDescription>
                    </div>
                    {hackathon.finalized ? (
                      <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Finalized
                      </span>
                    ) : isActive ? (
                      <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-medium animate-pulse flex-shrink-0">
                        Active
                      </span>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-2.5 pt-3 px-4">
                  {/* Sponsorship Period */}
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/10 border border-border/30">
                    <Calendar className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Sponsorship
                      </p>
                      <p className="text-xs text-white font-medium leading-tight">
                        {formatDate(hackathon.sponsorshipStart)} - {formatDate(hackathon.sponsorshipEnd)}
                      </p>
                    </div>
                  </div>

                  {/* Hackathon Period */}
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/10 border border-border/30">
                    <Trophy className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Hackathon
                      </p>
                      <p className="text-xs text-white font-medium leading-tight">
                        {formatDate(hackathon.hackStart)} - {formatDate(hackathon.hackEnd)}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-muted/10 border border-border/30">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Users className="h-3 w-3 text-primary" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Teams</p>
                      </div>
                      <p className="text-sm font-bold text-white">
                        {hackathon.minTeams} - {hackathon.maxTeams}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/10 border border-border/30">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Coins className="h-3 w-3 text-primary" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stake</p>
                      </div>
                      <p className="text-sm font-bold text-white">
                        {formatEther(hackathon.stakeAmount)} ETH
                      </p>
                    </div>
                  </div>

                  {/* Prize Pool Highlight */}
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                    <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wide mb-1">
                      Total Prize Pool
                    </p>
                    <p className="text-lg font-bold text-white mb-0.5">
                      {formatEther(hackathon.totalSponsorshipAmount)} ETH
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Min: {formatEther(hackathon.minSponsorshipThreshold)} ETH
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 px-4 pb-4">
                  <Button
                    onClick={() => router.push(`/home/${hackathon.id.toString()}`)}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-2 h-9 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300"
                  >
                    View Details
                    <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          {isLoadingHackathons &&
            Array.from({
              length: Number(hackathonCount) - hackathons.length,
            }).map((_, index) => (
              <Card
                key={`skeleton-${index}`}
                className="flex flex-col animate-pulse bg-card border-border/50"
              >
                <CardHeader className="bg-muted/10 pb-3 pt-4 px-4">
                  <div className="h-5 bg-muted/30 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted/30 rounded w-full"></div>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-3 px-4">
                  <div className="h-12 bg-muted/20 rounded-lg"></div>
                  <div className="h-12 bg-muted/20 rounded-lg"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-14 bg-muted/20 rounded-lg"></div>
                    <div className="h-14 bg-muted/20 rounded-lg"></div>
                  </div>
                  <div className="h-16 bg-muted/20 rounded-lg"></div>
                </CardContent>
                <CardFooter className="px-4 pb-4">
                  <div className="h-9 bg-muted/30 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HackathonDisplayPage;
