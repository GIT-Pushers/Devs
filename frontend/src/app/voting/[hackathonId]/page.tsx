"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { readContract, prepareContractCall, getContract } from "thirdweb";
import { useActiveAccount, useSendTransaction, TransactionButton } from "thirdweb/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Trophy, Users, Coins, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mainContract } from "@/constants/contracts";
import { toast } from "sonner";
import client from "@/utils/client";
import { sepolia } from "thirdweb/chains";
import { AddTokenToWallet } from "@/components/AddTokenToWallet";

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
  judges: string[];
  metadataURI: string;
  totalSponsorshipAmount: bigint;
  minSponsorshipThreshold: bigint;
  finalized: boolean;
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

export default function VotingPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.hackathonId as string;
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isTransactionPending } =
    useSendTransaction();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [submittedTeams, setSubmittedTeams] = useState<
    (Team & { metadata?: TeamMetadata; registration: TeamRegistration })[]
  >([]);
  const [votingTokenAddress, setVotingTokenAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [voteAmounts, setVoteAmounts] = useState<Map<string, string>>(new Map());
  const [userTeamId, setUserTeamId] = useState<bigint | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch hackathon details
  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        setLoading(true);
        const hackathonData = (await readContract({
          contract: mainContract,
          method:
            "function getHackathon(uint256 id) view returns ((uint256 id, address organizer, uint256 sponsorshipStart, uint256 sponsorshipEnd, uint256 hackStart, uint256 hackEnd, uint256 stakeAmount, uint32 minTeams, uint32 maxTeams, uint256 creationFee, bool creationFeeRefunded, address[] judges, string metadataURI, uint256 totalSponsorshipAmount, uint256 minSponsorshipThreshold, bool finalized))",
          params: [BigInt(hackathonId)],
        })) as Hackathon;

        setHackathon(hackathonData);

        // Get voting token address
        const tokenAddr = (await readContract({
          contract: mainContract,
          method: "function getVotingToken(uint256 hackathonId) view returns (address)",
          params: [BigInt(hackathonId)],
        })) as string;

        setVotingTokenAddress(tokenAddr);
      } catch (error: any) {
        console.error("Error fetching hackathon:", error);
        toast.error(error?.message || "Failed to load hackathon details");
      } finally {
        setLoading(false);
      }
    };

    fetchHackathon();
  }, [hackathonId]);

  // Fetch voting token balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!account?.address || !votingTokenAddress) return;

      try {
        setLoadingBalance(true);
        const votingToken = getContract({
          chain: sepolia,
          client: client,
          address: votingTokenAddress,
        });

        const balance = (await readContract({
          contract: votingToken,
          method: "function balanceOf(address account) view returns (uint256)",
          params: [account.address],
        })) as bigint;

        setTokenBalance(balance);
      } catch (error: any) {
        console.error("Error fetching token balance:", error);
        // Don't show error toast for balance fetch, just log it
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [account?.address, votingTokenAddress]);

  // Fetch user's team to prevent voting for own team
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!account?.address) return;

      try {
        const teamIds = (await readContract({
          contract: mainContract,
          method: "function getUserTeams(address user) view returns (uint256[])",
          params: [account.address],
        })) as bigint[];

        // Check which team is registered and staked for this hackathon
        for (const teamId of teamIds) {
          const registration = (await readContract({
            contract: mainContract,
            method:
              "function getTeamRegistration(uint256 hackathonId, uint256 teamId) view returns ((bool registered, bool staked, address staker, bool tokensMinted, bool projectSubmitted, bytes32 repoHash, uint256 aiScore, uint256 judgeScore, uint256 participantScore, uint256 finalScore, uint256 ranking, bool scoreFinalized))",
            params: [BigInt(hackathonId), teamId],
          })) as TeamRegistration;

          if (registration.staked && registration.projectSubmitted) {
            setUserTeamId(teamId);
            break;
          }
        }
      } catch (error: any) {
        console.error("Error fetching user team:", error);
        // Don't show error for this, it's optional
      }
    };

    fetchUserTeam();
  }, [account?.address, hackathonId]);

  // Fetch submitted teams
  useEffect(() => {
    const fetchSubmittedTeams = async () => {
      if (!hackathon) return;

      try {
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
      } catch (error: any) {
        console.error("Error fetching submitted teams:", error);
        // Don't show error toast, page will show "no submissions" message
      }
    };

    fetchSubmittedTeams();
  }, [hackathon, hackathonId]);

  const formatEther = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(2);
  };

  const formatTokens = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(0);
  };

  const handleVoteAmountChange = (teamId: string, amount: string) => {
    const newAmounts = new Map(voteAmounts);
    newAmounts.set(teamId, amount);
    setVoteAmounts(newAmounts);
  };

  const canVote = hackathon && hackathon.hackEnd < BigInt(Math.floor(Date.now() / 1000));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading voting page...</p>
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
                  Community Voting
                </span>
              </div>
              <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                Vote for Projects
              </h1>
              <p className="text-2xl text-muted-foreground mb-8">
                Use your voting tokens to support the best projects
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Voting Info Banner */}
        {!canVote && (
          <Card className="mb-6 bg-gradient-to-br from-warning/20 to-warning/10 border-2 border-warning/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/30 rounded-lg">
                  <Loader2 className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Voting Not Started
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Voting will be available after the hackathon ends. Hackathon ends on{" "}
                    {hackathon && new Date(Number(hackathon.hackEnd) * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Token Balance Card */}
        <Card className="mb-6 bg-gradient-to-br from-card to-card/50 border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              Your Voting Tokens
            </CardTitle>
            <CardDescription>
              {account?.address
                ? "Available tokens to cast votes"
                : "Connect wallet to see your balance"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {!account?.address ? (
              <p className="text-center text-muted-foreground py-4">
                Please connect your wallet to view your voting tokens
              </p>
            ) : loadingBalance ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                <p className="text-muted-foreground">Loading balance...</p>
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <p className="text-5xl font-extrabold text-primary mb-2">
                    {formatTokens(tokenBalance)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    GVOTE{hackathonId} Tokens
                  </p>
                  {tokenBalance === BigInt(0) && (
                    <p className="mt-4 text-sm text-warning">
                      You don&apos;t have any voting tokens. Only participants who staked for teams receive voting tokens.
                    </p>
                  )}
                </div>

                {/* Add to MetaMask Button */}
                {votingTokenAddress && (
                  <div className="pt-4 border-t-2 border-primary/20">
                    <AddTokenToWallet
                      tokenAddress={votingTokenAddress}
                      tokenSymbol={`GVOTE${hackathonId}`}
                      tokenDecimals={18}
                      hackathonId={hackathonId}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submitted Projects */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            Submitted Projects
          </h2>

          {submittedTeams.length === 0 ? (
            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20">
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  No projects submitted yet for this hackathon
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {submittedTeams.map((team) => {
                const isOwnTeam = userTeamId && team.id === userTeamId;
                const voteAmount = voteAmounts.get(team.id.toString()) || "";

                return (
                  <Card
                    key={team.id.toString()}
                    className={`bg-gradient-to-br from-card to-card/50 border-2 ${
                      isOwnTeam
                        ? "border-warning/40 opacity-60"
                        : "border-primary/20 hover:border-primary/40"
                    } transition-all`}
                  >
                    <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-2xl text-white mb-2">
                            {team.metadata?.name || `Team #${team.id.toString()}`}
                            {isOwnTeam && (
                              <span className="ml-3 px-3 py-1 bg-warning/20 text-warning text-sm font-semibold rounded-full border border-warning/30">
                                Your Team
                              </span>
                            )}
                          </CardTitle>
                          {team.metadata?.description && (
                            <CardDescription className="text-base">
                              {team.metadata.description}
                            </CardDescription>
                          )}
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-4">
                          <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">
                            AI Score
                          </p>
                          <p className="text-3xl font-bold text-primary">
                            {team.registration.aiScore.toString()}/100
                          </p>
                        </div>
                        <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-4">
                          <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">
                            Team Members
                          </p>
                          <p className="text-3xl font-bold text-white">
                            {team.members.length}
                          </p>
                        </div>
                        <div className="bg-black/40 border-2 border-primary/20 rounded-xl p-4">
                          <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">
                            Current Votes
                          </p>
                          <p className="text-3xl font-bold text-success">
                            {formatTokens(team.registration.participantScore)}
                          </p>
                        </div>
                      </div>

                      {isOwnTeam ? (
                        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-center">
                          <p className="text-warning font-semibold">
                            You cannot vote for your own team
                          </p>
                        </div>
                      ) : !canVote ? (
                        <div className="bg-muted/10 border border-border rounded-lg p-4 text-center">
                          <p className="text-muted-foreground">
                            Voting will be available after hackathon ends
                          </p>
                        </div>
                      ) : !account?.address ? (
                        <div className="bg-muted/10 border border-border rounded-lg p-4 text-center">
                          <p className="text-muted-foreground">
                            Connect wallet to vote
                          </p>
                        </div>
                      ) : tokenBalance === BigInt(0) ? (
                        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-center">
                          <p className="text-warning">
                            You don&apos;t have any voting tokens
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`vote-${team.id}`} className="text-white mb-2 block">
                              Enter amount of tokens to vote (Max: {formatTokens(tokenBalance)})
                            </Label>
                            <Input
                              id={`vote-${team.id}`}
                              type="number"
                              min="1"
                              max={formatTokens(tokenBalance)}
                              value={voteAmount}
                              onChange={(e) =>
                                handleVoteAmountChange(team.id.toString(), e.target.value)
                              }
                              placeholder="Enter token amount"
                              className="bg-black/40 border-2 border-primary/20 text-white"
                            />
                          </div>
                          <TransactionButton
                            transaction={() => {
                              const amount = voteAmount.trim();
                              if (!amount || Number(amount) <= 0) {
                                throw new Error("Please enter a valid amount");
                              }
                              const tokenAmount = BigInt(Math.floor(Number(amount) * 1e18));
                              if (tokenAmount > tokenBalance) {
                                throw new Error("Insufficient token balance");
                              }

                              return prepareContractCall({
                                contract: mainContract,
                                method:
                                  "function voteForTeam(uint256 hackathonId, uint256 teamId, uint256 amount)",
                                params: [BigInt(hackathonId), team.id, tokenAmount],
                              });
                            }}
                            onTransactionConfirmed={() => {
                              toast.success(`Successfully voted for ${team.metadata?.name || `Team #${team.id}`}!`);
                              setVoteAmounts(new Map(voteAmounts.set(team.id.toString(), "")));
                              // Refresh the page
                              window.location.reload();
                            }}
                            onError={(error) => {
                              console.error("Voting error:", error);
                              toast.error(`Voting failed: ${error.message}`);
                            }}
                            disabled={!voteAmount || Number(voteAmount) <= 0}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6"
                          >
                            <Vote className="mr-2 h-5 w-5" />
                            Cast Vote
                          </TransactionButton>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
