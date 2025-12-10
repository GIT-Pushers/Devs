"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { readContract, prepareContractCall } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Upload,
  FileCode,
  Award,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainContract } from "@/constants/contracts";
import { toast } from "sonner";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  owner: {
    login: string;
  };
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

interface AnalysisReport {
  repository: string;
  aiScore: number;
  report: unknown;
}

export default function SubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.hackathonId as string;
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isTransactionPending } =
    useSendTransaction();

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [userTeams, setUserTeams] = useState<
    (Team & { metadata?: TeamMetadata })[]
  >([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(
    null
  );
  const [submissionHash, setSubmissionHash] = useState<string | null>(null);

  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch user's GitHub repositories
  useEffect(() => {
    const fetchRepos = async () => {
      if (!account?.address) return;

      try {
        setLoadingRepos(true);
        const response = await fetch("/api/github/repos");

        if (!response.ok) {
          toast.error(
            "Failed to fetch repositories. Please login with GitHub."
          );
          return;
        }

        const data = await response.json();
        setRepos(data);
      } catch (error) {
        console.error("Error fetching repos:", error);
        toast.error("Error loading repositories");
      } finally {
        setLoadingRepos(false);
      }
    };

    fetchRepos();
  }, [account?.address]);

  // Fetch user's teams and check registration status
  useEffect(() => {
    const fetchTeams = async () => {
      if (!account?.address) return;

      try {
        setLoadingTeams(true);

        const teamIds = (await readContract({
          contract: mainContract,
          method:
            "function getUserTeams(address user) view returns (uint256[])",
          params: [account.address],
        })) as bigint[];

        if (teamIds.length === 0) {
          setUserTeams([]);
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

              // Check if user is a member of this team
              const isMember = team.members.some(
                (member) =>
                  member.toLowerCase() === account.address?.toLowerCase()
              );
              if (!isMember) return null;

              const registration = (await readContract({
                contract: mainContract,
                method:
                  "function getTeamRegistration(uint256 hackathonId, uint256 teamId) view returns ((bool registered, bool staked, address staker, bool tokensMinted, bool projectSubmitted, bytes32 repoHash, uint256 aiScore, uint256 judgeScore, uint256 participantScore, uint256 finalScore, uint256 ranking, bool scoreFinalized))",
                params: [BigInt(hackathonId), teamId],
              })) as TeamRegistration;

              // Only include teams that are staked for this hackathon
              if (!registration.staked) return null;

              // Check if already submitted
              if (registration.projectSubmitted) {
                setIsSubmitted(true);
              }

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

              return { ...team, metadata };
            } catch (err) {
              console.error(`Error fetching team ${teamId}:`, err);
              return null;
            }
          })
        );

        const validTeams = teamsData.filter((t) => t !== null) as (Team & {
          metadata?: TeamMetadata;
        })[];
        setUserTeams(validTeams);
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast.error("Error loading teams");
      } finally {
        setLoadingTeams(false);
      }
    };

    if (hackathonId && account?.address) {
      fetchTeams();
    }
  }, [hackathonId, account?.address]);

  const handleAnalyzeRepo = async () => {
    if (!selectedRepo) return;

    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: selectedRepo.html_url,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze repository");
      }

      const data = await response.json();
      setAnalysisReport({
        repository: selectedRepo.full_name,
        aiScore: Math.round(data.trust_score * 100) / 100,
        report: data,
      });

      toast.success("Repository analyzed successfully!");
    } catch (error) {
      console.error("Error analyzing repository:", error);
      toast.error("Failed to analyze repository");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitProject = async () => {
    if (!selectedTeamId || !analysisReport || !selectedRepo) {
      toast.error("Please complete all steps first");
      return;
    }

    try {
      setUploadingToIPFS(true);

      // Create submission metadata
      const submissionData = {
        hackathonId,
        teamId: selectedTeamId,
        repository: {
          name: selectedRepo.name,
          fullName: selectedRepo.full_name,
          url: selectedRepo.html_url,
          description: selectedRepo.description,
          language: selectedRepo.language,
        },
        analysis: analysisReport.report,
        aiScore: analysisReport.aiScore,
        submittedAt: new Date().toISOString(),
      };

      // Upload to IPFS via Pinata
      const pinataResponse = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
          body: JSON.stringify({
            pinataContent: submissionData,
            pinataMetadata: {
              name: `submission-${hackathonId}-${selectedTeamId}.json`,
            },
          }),
        }
      );

      if (!pinataResponse.ok) {
        throw new Error("Failed to upload to IPFS");
      }

      const { IpfsHash } = await pinataResponse.json();
      const repoHashBytes32 = `0x${Buffer.from(IpfsHash)
        .toString("hex")
        .padEnd(64, "0")}` as `0x${string}`;

      setSubmissionHash(IpfsHash);
      setUploadingToIPFS(false);

      // Submit to blockchain
      const transaction = prepareContractCall({
        contract: mainContract,
        method:
          "function submitProject(uint256 hackathonId, uint256 teamId, bytes32 repoHash, uint256 aiScore)",
        params: [
          BigInt(hackathonId),
          BigInt(selectedTeamId),
          repoHashBytes32,
          BigInt(Math.floor(analysisReport.aiScore)),
        ],
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          toast.success("Project submitted successfully!");
          setIsSubmitted(true);
          // Redirect to NFT minting page after short delay
          setTimeout(() => {
            router.push(`/mint-nft/${hackathonId}?teamId=${selectedTeamId}`);
          }, 2000);
        },
        onError: (error) => {
          console.error("Submission error:", error);
          toast.error(`Failed to submit: ${error.message}`);
        },
      });
    } catch (error) {
      console.error("Error submitting project:", error);
      toast.error("Failed to submit project");
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
                Please connect your wallet to submit your project
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-6xl py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Hackathon
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Submit Project</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Submit your project for Hackathon #{hackathonId}
          </p>
        </div>

        {/* Success Banner */}
        {isSubmitted && (
          <Card className="border-2 border-success/50 bg-success/10 mb-6">
            <CardContent className="py-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div>
                    <h3 className="text-xl font-bold text-success">
                      Project Submitted!
                    </h3>
                    <p className="text-muted-foreground">
                      Your project has been successfully submitted to the
                      blockchain.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    router.push(
                      `/mint-nft/${hackathonId}?teamId=${selectedTeamId}`
                    )
                  }
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Award className="mr-2 h-5 w-5" />
                  Mint Participation NFT
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: Select Team */}
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                  1
                </div>
                Select Your Team
              </CardTitle>
              <CardDescription>
                Choose which team you&apos;re submitting for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeams ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="ml-2 text-muted-foreground">Loading teams...</p>
                </div>
              ) : userTeams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No eligible teams found. Make sure your team is registered and
                  staked.
                </p>
              ) : (
                <div className="space-y-2">
                  {userTeams.map((team) => (
                    <button
                      key={team.id.toString()}
                      onClick={() => setSelectedTeamId(team.id.toString())}
                      disabled={isSubmitted}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedTeamId === team.id.toString()
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      } ${
                        isSubmitted
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <h3 className="font-bold">
                        {team.metadata?.name || `Team #${team.id.toString()}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {team.members.length} member
                        {team.members.length !== 1 ? "s" : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Repository */}
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                  2
                </div>
                Select Repository
              </CardTitle>
              <CardDescription>
                Choose the GitHub repository to submit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRepos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="ml-2 text-muted-foreground">Loading repos...</p>
                </div>
              ) : repos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No repositories found. Please login with GitHub.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {repos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      disabled={isSubmitted}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedRepo?.id === repo.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      } ${
                        isSubmitted
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold">{repo.name}</h3>
                          {repo.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {repo.description}
                            </p>
                          )}
                          {repo.language && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                              {repo.language}
                            </span>
                          )}
                        </div>
                        <ExternalLink
                          className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(repo.html_url, "_blank");
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Analyze Repository */}
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                  3
                </div>
                Analyze Repository
              </CardTitle>
              <CardDescription>Generate AI analysis and score</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedRepo ? (
                <p className="text-center text-muted-foreground py-8">
                  Select a repository first
                </p>
              ) : !analysisReport ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">
                      Selected Repository:
                    </p>
                    <p className="font-mono text-sm">
                      {selectedRepo.full_name}
                    </p>
                  </div>
                  <Button
                    onClick={handleAnalyzeRepo}
                    disabled={analyzing || isSubmitted}
                    className="w-full"
                    size="lg"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileCode className="mr-2 h-5 w-5" />
                        Analyze Repository
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-success/10 border border-success/30 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">
                      Analysis Complete!
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Trust Score:</span>
                      <span className="text-3xl font-bold text-success">
                        {analysisReport.aiScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-sm font-semibold mb-2">
                      Analysis Report:
                    </p>
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(analysisReport.report.ai_summary, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 4: Submit to Blockchain */}
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                  4
                </div>
                Submit to Blockchain
              </CardTitle>
              <CardDescription>
                Upload to IPFS and submit transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTeamId || !selectedRepo || !analysisReport ? (
                <p className="text-center text-muted-foreground py-8">
                  Complete all previous steps first
                </p>
              ) : isSubmitted ? (
                <div className="space-y-4">
                  <div className="bg-success/10 border border-success/30 p-4 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success mb-2" />
                    <p className="font-semibold">Submission Complete!</p>
                    <p className="text-sm text-muted-foreground">
                      Your project has been submitted successfully.
                    </p>
                  </div>
                  {submissionHash && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-semibold mb-2">IPFS Hash:</p>
                      <p className="font-mono text-xs break-all">
                        {submissionHash}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">
                      Ready to Submit:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>
                        ✓ Team:{" "}
                        {userTeams.find(
                          (t) => t.id.toString() === selectedTeamId
                        )?.metadata?.name || `#${selectedTeamId}`}
                      </li>
                      <li>✓ Repository: {selectedRepo.name}</li>
                      <li>✓ AI Score: {analysisReport.aiScore}/100</li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleSubmitProject}
                    disabled={uploadingToIPFS || isTransactionPending}
                    className="w-full"
                    size="lg"
                  >
                    {uploadingToIPFS || isTransactionPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {uploadingToIPFS
                          ? "Uploading to IPFS..."
                          : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Submit Project
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
