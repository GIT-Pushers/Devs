"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { readContract, prepareContractCall } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainContract } from "@/constants/contracts";
import { toast } from "sonner";

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

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export default function MintNFTPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hackathonId = params.hackathonId as string;
  const teamIdParam = searchParams.get("teamId");
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isTransactionPending } =
    useSendTransaction();

  const [team, setTeam] = useState<(Team & { metadata?: TeamMetadata }) | null>(
    null
  );
  const [registration, setRegistration] = useState<TeamRegistration | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [nftMinted, setNftMinted] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!account?.address || !teamIdParam) return;

      try {
        setLoading(true);

        // Fetch team details
        const teamData = (await readContract({
          contract: mainContract,
          method:
            "function getTeam(uint256 id) view returns ((uint256 id, address creator, string metadataURI, address[] members, bytes32 joinCodeHash, bool exists))",
          params: [BigInt(teamIdParam)],
        })) as Team;

        // Check if user is a member
        const isMember = teamData.members.some(
          (member) => member.toLowerCase() === account.address?.toLowerCase()
        );
        if (!isMember) {
          toast.error("You are not a member of this team");
          router.push(`/home/${hackathonId}`);
          return;
        }

        // Fetch registration details
        const regData = (await readContract({
          contract: mainContract,
          method:
            "function getTeamRegistration(uint256 hackathonId, uint256 teamId) view returns ((bool registered, bool staked, address staker, bool tokensMinted, bool projectSubmitted, bytes32 repoHash, uint256 aiScore, uint256 judgeScore, uint256 participantScore, uint256 finalScore, uint256 ranking, bool scoreFinalized))",
          params: [BigInt(hackathonId), BigInt(teamIdParam)],
        })) as TeamRegistration;

        // Check if project was submitted
        if (!regData.projectSubmitted) {
          toast.error("Project not submitted yet");
          router.push(`/submission/${hackathonId}`);
          return;
        }

        // Check if already minted
        if (regData.tokensMinted) {
          setNftMinted(true);
        }

        // Fetch team metadata
        let metadata: TeamMetadata | undefined;
        if (teamData.metadataURI) {
          try {
            const ipfsUrl = teamData.metadataURI.replace(
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

        setTeam({ ...teamData, metadata });
        setRegistration(regData);
      } catch (error) {
        console.error("Error fetching team data:", error);
        toast.error("Error loading team data");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [account?.address, teamIdParam, hackathonId, router]);

  const handleMintNFT = async () => {
    if (!team || !registration || !teamIdParam) {
      toast.error("Missing required data");
      return;
    }

    try {
      setUploadingToIPFS(true);

      // Create NFT metadata
      const nftMetadata: NFTMetadata = {
        name: `GLYTCH Hackathon #${hackathonId} - ${
          team.metadata?.name || `Team #${teamIdParam}`
        }`,
        description: `Participation NFT for ${
          team.metadata?.name || `Team #${teamIdParam}`
        } in Hackathon #${hackathonId}. AI Score: ${registration.aiScore.toString()}/100`,
        image:
          "ipfs://bafkreidzslse25yfgophsdyk54znibm3gnceyymedgpnyk7re66mysizvi",
        attributes: [
          {
            trait_type: "Hackathon ID",
            value: hackathonId,
          },
          {
            trait_type: "Team ID",
            value: teamIdParam,
          },
          {
            trait_type: "Team Name",
            value: team.metadata?.name || `Team #${teamIdParam}`,
          },
          {
            trait_type: "AI Score",
            value: Number(registration.aiScore),
          },
          {
            trait_type: "Judge Score",
            value: Number(registration.judgeScore),
          },
          {
            trait_type: "Participant Score",
            value: Number(registration.participantScore),
          },
          {
            trait_type: "Final Score",
            value: Number(registration.finalScore),
          },
          {
            trait_type: "Ranking",
            value: Number(registration.ranking),
          },
          {
            trait_type: "Score Finalized",
            value: registration.scoreFinalized ? "Yes" : "No",
          },
        ],
      };

      // Upload NFT metadata to IPFS
      const nftPinataResponse = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
          body: JSON.stringify({
            pinataContent: nftMetadata,
            pinataMetadata: {
              name: `nft-metadata-${hackathonId}-${teamIdParam}.json`,
            },
          }),
        }
      );

      if (!nftPinataResponse.ok) {
        throw new Error("Failed to upload NFT metadata to IPFS");
      }

      const { IpfsHash: nftIpfsHash } = await nftPinataResponse.json();
      const metadataURI = `ipfs://${nftIpfsHash}`;

      setUploadingToIPFS(false);

      // Mint NFT on blockchain
      const transaction = prepareContractCall({
        contract: mainContract,
        method:
          "function mintParticipationNFT(uint256 hackathonId, uint256 teamId, string metadataURI)",
        params: [BigInt(hackathonId), BigInt(teamIdParam), metadataURI],
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          toast.success("NFT minted successfully!");
          setNftMinted(true);
        },
        onError: (error) => {
          console.error("NFT minting error:", error);
          toast.error(`Failed to mint NFT: ${error.message}`);
        },
      });
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast.error("Failed to mint NFT");
      setUploadingToIPFS(false);
    }
  };

  if (!account?.address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <Card className="border-2 shadow-xl">
            <CardContent className="py-12 text-center">
              <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to mint your NFT
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <Card className="border-2 shadow-xl">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading team data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!team || !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <Card className="border-2 shadow-xl">
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
              <Button onClick={() => router.push(`/home/${hackathonId}`)}>
                Back to Hackathon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Mint Participation NFT</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Commemorate your participation in Hackathon #{hackathonId}
          </p>
        </div>

        {/* NFT Minting Card */}
        {nftMinted ? (
          <Card className="border-2 border-green-500/50 bg-green-500/10 shadow-xl">
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-3xl font-bold text-green-500 mb-2">
                    NFT Minted Successfully!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Your participation NFT has been minted to your wallet.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => router.push(`/home/${hackathonId}`)}
                    variant="outline"
                  >
                    Back to Hackathon
                  </Button>
                  <Button
                    onClick={() => router.push(`/participants/${hackathonId}`)}
                  >
                    View Participants
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-primary/50 shadow-xl">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">NFT Details</CardTitle>
              <CardDescription>
                Review your NFT details before minting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* NFT Preview */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-lg border-2 border-primary/30">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-48 bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg border-2 border-primary/50 flex items-center justify-center">
                    <Award className="h-24 w-24 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-1">
                      GLYTCH Hackathon #{hackathonId}
                    </h3>
                    <p className="text-muted-foreground">
                      {team.metadata?.name || `Team #${teamIdParam}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* NFT Attributes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Attributes</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Hackathon ID
                    </p>
                    <p className="font-semibold">#{hackathonId}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Team ID
                    </p>
                    <p className="font-semibold">#{teamIdParam}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      AI Score
                    </p>
                    <p className="font-semibold">
                      {registration.aiScore.toString()}/100
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Final Score
                    </p>
                    <p className="font-semibold">
                      {registration.finalScore.toString()}
                    </p>
                  </div>
                  {registration.ranking > BigInt(0) && (
                    <div className="bg-muted p-3 rounded-lg col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Ranking
                      </p>
                      <p className="font-semibold">
                        #{registration.ranking.toString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Status */}
              {!registration.scoreFinalized && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ Note: Scores are not yet finalized. You can still mint
                    your NFT, but the final scores and ranking may change.
                  </p>
                </div>
              )}

              {registration.scoreFinalized && (
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Scores have been finalized! Your NFT will reflect the
                    final results.
                  </p>
                </div>
              )}

              {/* Team Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Team Information</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Team Name</p>
                    <p className="font-semibold">
                      {team.metadata?.name || `Team #${teamIdParam}`}
                    </p>
                  </div>
                  {team.metadata?.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Description
                      </p>
                      <p className="text-sm">{team.metadata.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="font-semibold">
                      {team.members.length} members
                    </p>
                  </div>
                </div>
              </div>

              {/* Mint Button */}
              <Button
                onClick={handleMintNFT}
                disabled={uploadingToIPFS || isTransactionPending}
                className="w-full"
                size="lg"
              >
                {uploadingToIPFS || isTransactionPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {uploadingToIPFS
                      ? "Uploading NFT metadata..."
                      : "Minting NFT..."}
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-5 w-5" />
                    Mint Participation NFT
                  </>
                )}
              </Button>

              {/* Info */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Standard Image:
                  bafkreidzslse25yfgophsdyk54znibm3gnceyymedgpnyk7re66mysizvi
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
