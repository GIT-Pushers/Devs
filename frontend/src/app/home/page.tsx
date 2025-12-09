"use client";
import React, { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { mainContract } from "../constants/contracts";
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
      if (!hackathonCount || hackathonCount === 0n) return;

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">
            Loading hackathon count...
          </p>
        </div>
      </div>
    );
  }

  if (hackathonCount === 0n) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Hackathons Yet</h2>
          <p className="text-muted-foreground">
            Be the first to create a hackathon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Active Hackathons</h1>
        <p className="text-muted-foreground">
          Total: {hackathonCount?.toString()} hackathon(s)
        </p>
      </div>

      {isLoadingHackathons && (
        <div className="mb-8">
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Loading hackathons... {Math.round(loadingProgress)}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hackathons.map((hackathon, index) => (
          <Card
            key={index}
            className="flex flex-col hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Hackathon #{hackathon.id.toString()}</span>
                {hackathon.finalized && (
                  <span className="text-xs bg-green-600 dark:bg-green-700 text-white px-2 py-1 rounded">
                    Finalized
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs truncate">
                Organizer: {hackathon.organizer}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Sponsorship Period
                </p>
                <p className="text-sm">
                  {formatDate(hackathon.sponsorshipStart)} -{" "}
                  {formatDate(hackathon.sponsorshipEnd)}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Hackathon Period
                </p>
                <p className="text-sm">
                  {formatDate(hackathon.hackStart)} -{" "}
                  {formatDate(hackathon.hackEnd)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Teams</p>
                  <p className="text-sm font-medium">
                    {hackathon.minTeams} - {hackathon.maxTeams}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stake Amount</p>
                  <p className="text-sm font-medium">
                    {formatEther(hackathon.stakeAmount)} ETH
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Total Sponsorship
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatEther(hackathon.totalSponsorshipAmount)} ETH
                </p>
                <p className="text-xs text-muted-foreground">
                  Min: {formatEther(hackathon.minSponsorshipThreshold)} ETH
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <button
                onClick={() => router.push(`/home/${hackathon.id.toString()}`)}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                View Details
              </button>
            </CardFooter>
          </Card>
        ))}

        {isLoadingHackathons &&
          Array.from({
            length: Number(hackathonCount) - hackathons.length,
          }).map((_, index) => (
            <Card
              key={`skeleton-${index}`}
              className="flex flex-col animate-pulse"
            >
              <CardHeader>
                <div className="h-6 bg-secondary rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-secondary rounded w-full"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 bg-secondary rounded w-full"></div>
                <div className="h-4 bg-secondary rounded w-5/6"></div>
                <div className="h-4 bg-secondary rounded w-4/6"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-secondary rounded"></div>
                  <div className="h-12 bg-secondary rounded"></div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-secondary rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default HackathonDisplayPage;
