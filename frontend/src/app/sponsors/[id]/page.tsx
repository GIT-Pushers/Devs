"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReadContract } from "thirdweb/react";
import { mainContract } from "@/constants/contracts";
import axios from "axios";
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
  ExternalLink,
  Globe,
  Building2,
  Trophy,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";

interface SponsorMetadata {
  companyName: string;
  companyDescription: string;
  website?: string;
  logoUrl?: string;
  sponsorshipAmount?: string;
}

interface Sponsor {
  sponsor: string;
  amount: bigint;
  metadataURI: string;
  metadata?: SponsorMetadata;
}

export default function HackathonSponsorsPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch hackathon details
  const { data: hackathon, isLoading: loadingHackathon } = useReadContract({
    contract: mainContract,
    method:
      "function hackathons(uint256) view returns (uint256 id, address organizer, uint256 sponsorshipStart, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 creationFee, bool creationFeeRefunded, string metadataURI, uint256 totalSponsorshipAmount, uint256 minSponsorshipThreshold, bool finalized)",
    params: [BigInt(hackathonId)],
  });

  // Fetch sponsors
  const { data: sponsorsData, isLoading: loadingSponsors } = useReadContract({
    contract: mainContract,
    method:
      "function getSponsors(uint256) view returns ((address sponsor, uint256 amount, string metadataURI)[])",
    params: [BigInt(hackathonId)],
  });

  useEffect(() => {
    const fetchSponsorMetadata = async () => {
      if (!sponsorsData || sponsorsData.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const sponsorsWithMetadata = await Promise.all(
        (
          sponsorsData as Array<{
            sponsor: string;
            amount: bigint;
            metadataURI: string;
          }>
        ).map(async (sponsor) => {
          let metadata: SponsorMetadata | undefined;
          try {
            if (sponsor.metadataURI.startsWith("ipfs://")) {
              const ipfsHash = sponsor.metadataURI.replace("ipfs://", "");
              const response = await axios.get(
                `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
              );
              metadata = response.data;
            }
          } catch (error) {
            console.error("Error fetching sponsor metadata:", error);
          }
          return {
            sponsor: sponsor.sponsor,
            amount: sponsor.amount,
            metadataURI: sponsor.metadataURI,
            metadata,
          };
        })
      );

      setSponsors(sponsorsWithMetadata);
      setIsLoading(false);
    };

    fetchSponsorMetadata();
  }, [sponsorsData]);

  const formatEther = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loadingHackathon || isLoading || loadingSponsors) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading sponsors...</p>
        </div>
      </div>
    );
  }

  if (!hackathon) {
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
            <Trophy className="h-24 w-24 text-muted-foreground mb-6" />
            <h2 className="text-3xl font-bold mb-2">Hackathon Not Found</h2>
            <p className="text-muted-foreground text-lg">
              The hackathon you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/home/${hackathonId}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hackathon
          </Button>
          <div className="flex flex-col items-center justify-center py-20">
            <Building2 className="h-24 w-24 text-muted-foreground mb-6" />
            <h2 className="text-3xl font-bold mb-2">No Sponsors Yet</h2>
            <p className="text-muted-foreground text-lg mb-6">
              This hackathon hasn't received any sponsorships yet.
            </p>
            <Button onClick={() => router.push(`/sponsor/${hackathonId}`)}>
              <Coins className="w-4 h-4 mr-2" />
              Become a Sponsor
            </Button>
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
          onClick={() => router.push(`/home/${hackathonId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hackathon
        </Button>

        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-5xl font-bold">
              Hackathon #{hackathonId} Sponsors
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Meet the companies supporting this hackathon
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Sponsors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{sponsors.length}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Sponsorship
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">
                {formatEther(hackathon[12])} ETH
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                Average Contribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {(Number(hackathon[12]) / 1e18 / sponsors.length).toFixed(4)}{" "}
                ETH
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sponsors Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            Our Sponsors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sponsors.map((sponsor, index) => (
              <Card
                key={index}
                className="border-2 border-border hover:border-primary/50 transition-all hover:shadow-lg"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    {sponsor.metadata?.logoUrl ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/20 flex-shrink-0">
                        <Image
                          src={sponsor.metadata.logoUrl}
                          alt={sponsor.metadata.companyName || "Company"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-2 truncate">
                        {sponsor.metadata?.companyName || "Anonymous Sponsor"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-primary" />
                        <span className="font-bold text-primary text-lg">
                          {formatEther(sponsor.amount)} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {sponsor.metadata?.companyDescription && (
                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {sponsor.metadata.companyDescription}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        Sponsor Address:
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {formatAddress(sponsor.sponsor)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            window.open(
                              `https://sepolia.etherscan.io/address/${sponsor.sponsor}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {sponsor.metadata?.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          window.open(sponsor.metadata!.website, "_blank")
                        }
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader>
            <CardTitle className="text-2xl">Want to Support Too?</CardTitle>
            <CardDescription className="text-base">
              Join these amazing companies and sponsor this hackathon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              onClick={() => router.push(`/sponsor/${hackathonId}`)}
              className="w-full md:w-auto"
            >
              <Coins className="w-5 h-5 mr-2" />
              Become a Sponsor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
