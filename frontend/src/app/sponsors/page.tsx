"use client";

import React, { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { mainContract } from "@/constants/contracts";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Coins,
  Building2,
  Sparkles,
  Trophy,
  ArrowRight,
  Users,
} from "lucide-react";

interface Hackathon {
  id: bigint;
  totalSponsorshipAmount: bigint;
  sponsorCount: number;
}

const SponsorsPage = () => {
  const router = useRouter();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: hackathonCount } = useReadContract({
    contract: mainContract,
    method: "function hackathonCount() view returns (uint256)",
    params: [],
  });

  useEffect(() => {
    const fetchAllData = async () => {
      if (!hackathonCount || hackathonCount === BigInt(0)) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const count = Number(hackathonCount);
      const fetchedHackathons: Hackathon[] = [];

      for (let i = 0; i < count; i++) {
        try {
          const { readContract } = await import("thirdweb");

          // Fetch hackathon basic data
          const hackathonData = await readContract({
            contract: mainContract,
            method:
              "function hackathons(uint256) view returns (uint256 id, address organizer, uint256 sponsorshipStart, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 creationFee, bool creationFeeRefunded, string metadataURI, uint256 totalSponsorshipAmount, uint256 minSponsorshipThreshold, bool finalized)",
            params: [BigInt(i)],
          });

          // Fetch sponsors count
          const sponsorsData = await readContract({
            contract: mainContract,
            method:
              "function getSponsors(uint256) view returns ((address sponsor, uint256 amount, string metadataURI)[])",
            params: [BigInt(i)],
          });

          const sponsorCount = (sponsorsData as any[]).length;

          if (sponsorCount > 0) {
            fetchedHackathons.push({
              id: hackathonData[0],
              totalSponsorshipAmount: hackathonData[12],
              sponsorCount,
            });
          }
        } catch (error) {
          console.error(`Error fetching hackathon ${i}:`, error);
        }
      }

      setHackathons(fetchedHackathons);
      setIsLoading(false);
    };

    fetchAllData();
  }, [hackathonCount]);

  const formatEther = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading sponsors...</p>
        </div>
      </div>
    );
  }

  if (hackathons.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/home")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex flex-col items-center justify-center py-20">
            <Building2 className="h-24 w-24 text-muted-foreground mb-6" />
            <h2 className="text-3xl font-bold mb-2">No Sponsors Yet</h2>
            <p className="text-muted-foreground text-lg">
              No hackathons have received sponsorships yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/home")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-5xl font-bold">Sponsored Hackathons</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Explore hackathons and their amazing sponsors
          </p>
        </div>

        {/* Hackathons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {hackathons.map((hackathon) => (
            <Card
              key={hackathon.id.toString()}
              className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-xl cursor-pointer group"
              onClick={() =>
                router.push(`/sponsors/${hackathon.id.toString()}`)
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-8 h-8 text-primary" />
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-2xl">
                  Hackathon #{hackathon.id.toString()}
                </CardTitle>
                <CardDescription className="text-base">
                  Click to view all sponsors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Sponsors
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      {hackathon.sponsorCount}
                    </p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      {formatEther(hackathon.totalSponsorshipAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">ETH</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/sponsors/${hackathon.id.toString()}`);
                  }}
                >
                  View Sponsors
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Overall Stats */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                  Hackathons with Sponsors
                </p>
                <p className="text-4xl font-bold">{hackathons.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                  Total Sponsors
                </p>
                <p className="text-4xl font-bold">
                  {hackathons.reduce((sum, h) => sum + h.sponsorCount, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                  Total Sponsorship
                </p>
                <p className="text-4xl font-bold text-primary">
                  {hackathons
                    .reduce(
                      (sum, h) => sum + Number(h.totalSponsorshipAmount),
                      0
                    )
                    .toFixed(4)}{" "}
                  ETH
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SponsorsPage;
