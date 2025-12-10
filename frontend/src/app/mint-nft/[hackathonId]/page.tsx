"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { prepareContractCall, readContract } from "thirdweb";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { mainContract } from "@/app/constants/contracts";
import { Loader2, Award, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const hackathonId = params.hackathonId as string;
  const account = useActiveAccount();

  const [team, setTeam] = useState<(Team & { metadata?: TeamMetadata }) | null>(
    null
  );
  const [registration, setRegistration] = useState<TeamRegistration | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [nftMetadataURI, setNftMetadataURI] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [userTeams, setUserTeams] = useState<bigint[]>([]);

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!account?.address) return;

      try {
        setLoading(true);
        // Get user's teams
        const teams = (await readContract({
          contract: mainContract,
          method:
            "function getUserTeams(address user) view returns (uint256[])",
          params: [account.address],
        })) as bigint[];

        setUserTeams(teams);
        if (teams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(teams[0].toString());
        }
      } catch (error) {
        console.error("Error fetching user teams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTeams();
  }, [account?.address, selectedTeamId]);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!account?.address || !selectedTeamId || !hackathonId) return;

      try {
        setLoading(true);

        // Fetch team details
        const teamData = (await readContract({
          contract: mainContract,
          method:
            "function getTeam(uint256 id) view returns ((uint256 id, address creator, string metadataURI, address[] members, bytes32 joinCodeHash, bool exists))",
          params: [BigInt(selectedTeamId)],
        })) as Team;

        // Fetch registration details
        const regData = (await readContract({
          contract: mainContract,
          method:
            "function getTeamRegistration(uint256 hackathonId, uint256 teamId) view returns ((bool registered, bool staked, address staker, bool tokensMinted, bool projectSubmitted, bytes32 repoHash, uint256 aiScore, uint256 judgeScore, uint256 participantScore, uint256 finalScore, uint256 ranking, bool scoreFinalized))",
          params: [BigInt(hackathonId), BigInt(selectedTeamId)],
        })) as TeamRegistration;

        // Fetch team metadata from IPFS
        let metadata: TeamMetadata | undefined;
        if (teamData.metadataURI) {
          try {
            const ipfsUrl = teamData.metadataURI.replace(
              "ipfs://",
              "https://tomato-main-magpie-286.mypinata.cloud/ipfs/"
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
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [account?.address, selectedTeamId, hackathonId]);

  const handleGenerateMetadata = async () => {
    if (!team || !registration || !selectedTeamId || !account?.address) {
      alert("Missing required data");
      return;
    }

    if (!registration.projectSubmitted) {
      alert("Project not submitted yet!");
      return;
    }

    try {
      setUploadingToIPFS(true);

      // Create NFT metadata JSON
      const nftMetadata: NFTMetadata = {
        name: `GLYTCH Hackathon #${hackathonId} - ${
          team.metadata?.name || `Team #${selectedTeamId}`
        }`,
        description: `Participation NFT for ${
          team.metadata?.name || `Team #${selectedTeamId}`
        } in Hackathon #${hackathonId}. This NFT represents completion and participation in the hackathon with verifiable on-chain scores.`,
        image:
          team.metadata?.image ||
          "https://tomato-main-magpie-286.mypinata.cloud/ipfs/bafkreidzslse25yfgophsdyk54znibm3gnceyymedgpnyk7re66mysizvi",
        attributes: [
          {
            trait_type: "Hackathon ID",
            value: hackathonId,
          },
          {
            trait_type: "Team ID",
            value: selectedTeamId,
          },
          {
            trait_type: "Team Name",
            value: team.metadata?.name || `Team #${selectedTeamId}`,
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
            value: Number(registration.ranking) || "Not Ranked",
          },
          {
            trait_type: "Project Submitted",
            value: registration.projectSubmitted ? "Yes" : "No",
          },
        ],
      };

      // Upload to Pinata
      const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
      if (!pinataJWT) {
        throw new Error("Pinata JWT not configured");
      }

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pinataJWT}`,
          },
          body: JSON.stringify({
            pinataContent: nftMetadata,
            pinataMetadata: {
              name: `nft-metadata-h${hackathonId}-t${selectedTeamId}.json`,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to upload to Pinata: ${errorData}`);
      }

      const { IpfsHash } = await response.json();
      const metadataURI = `ipfs://${IpfsHash}`;
      setNftMetadataURI(metadataURI);

      alert(`Metadata uploaded successfully! URI: ${metadataURI}`);
    } catch (error) {
      console.error("Error generating metadata:", error);
      alert(
        `Failed to generate metadata: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploadingToIPFS(false);
    }
  };

  if (!account?.address) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md bg-card rounded-lg shadow-xl p-8 text-center border border-border">
          <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground">
            Please connect your wallet to mint your participation NFT
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-card rounded-lg shadow-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Mint Participation NFT
            </h1>
          </div>

          {/* Hackathon ID Display */}
          <div className="mb-6 p-4 bg-accent rounded-lg">
            <p className="text-sm text-muted-foreground">Hackathon ID</p>
            <p className="text-2xl font-bold text-foreground">{hackathonId}</p>
          </div>

          {/* Team Selection */}
          <div className="mb-6">
            <Label
              htmlFor="team-select"
              className="text-sm font-medium text-foreground mb-2"
            >
              Select Your Team
            </Label>
            <Select
              value={selectedTeamId}
              onValueChange={(value) => setSelectedTeamId(value)}
            >
              <SelectTrigger id="team-select" className="w-full">
                <SelectValue placeholder="Select a team..." />
              </SelectTrigger>
              <SelectContent>
                {userTeams.map((teamId) => (
                  <SelectItem key={teamId.toString()} value={teamId.toString()}>
                    Team #{teamId.toString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Info */}
          {team && registration && (
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">
                  {team.metadata?.name || `Team #${selectedTeamId}`}
                </h3>
                {team.metadata?.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {team.metadata.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">AI Score:</span>
                    <span className="ml-2 font-bold text-primary">
                      {registration.aiScore.toString()}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Judge Score:</span>
                    <span className="ml-2 font-bold text-info">
                      {registration.judgeScore.toString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Participant Score:
                    </span>
                    <span className="ml-2 font-bold text-success">
                      {registration.participantScore.toString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Final Score:</span>
                    <span className="ml-2 font-bold text-warning">
                      {registration.finalScore.toString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {registration.projectSubmitted ? (
                    <span className="flex items-center gap-1 text-success text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Project Submitted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Project Not Submitted
                    </span>
                  )}
                  {registration.tokensMinted && (
                    <span className="flex items-center gap-1 text-primary text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      NFT Already Minted
                    </span>
                  )}
                </div>
              </div>

              {/* Generate Metadata Button */}
              {!nftMetadataURI && registration.projectSubmitted && (
                <button
                  onClick={handleGenerateMetadata}
                  disabled={uploadingToIPFS || registration.tokensMinted}
                  className="w-full py-3 px-4 bg-success hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground text-success-foreground font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {uploadingToIPFS ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading to IPFS...
                    </>
                  ) : (
                    "Generate NFT Metadata"
                  )}
                </button>
              )}

              {/* Metadata URI Display */}
              {nftMetadataURI && (
                <div className="p-4 bg-accent rounded-lg border border-success">
                  <p className="text-sm text-muted-foreground mb-1">
                    Metadata URI
                  </p>
                  <p className="text-xs font-mono text-foreground break-all">
                    {nftMetadataURI}
                  </p>
                </div>
              )}

              {/* Mint NFT Button */}
              {nftMetadataURI && !registration.tokensMinted && (
                <TransactionButton
                  transaction={() => {
                    return prepareContractCall({
                      contract: mainContract,
                      method:
                        "function mintParticipationNFT(uint256 hackathonId, uint256 teamId, string metadataURI)",
                      params: [
                        BigInt(hackathonId),
                        BigInt(selectedTeamId),
                        nftMetadataURI,
                      ],
                    });
                  }}
                  onTransactionSent={(result) => {
                    console.log(
                      "Transaction submitted",
                      result.transactionHash
                    );
                  }}
                  onTransactionConfirmed={(receipt) => {
                    console.log(
                      "Transaction confirmed",
                      receipt.transactionHash
                    );
                    alert("NFT Minted Successfully! 🎉");
                    router.push(`/home/${hackathonId}`);
                  }}
                  onError={(error) => {
                    console.error("Transaction error", error);
                    alert(`Error: ${error.message}`);
                  }}
                  className="w-full"
                >
                  Mint Participation NFT
                </TransactionButton>
              )}
            </div>
          )}

          {!selectedTeamId && (
            <div className="text-center py-8 text-muted-foreground">
              Please select a team to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
