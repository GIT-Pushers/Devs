"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, CheckCircle, ExternalLink } from "lucide-react";
import GithubLoginButton from "@/components/GithubLoginButton";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  private: boolean;
}

interface AnalysisResult {
  success: boolean;
  owner: string;
  repo: string;
  trust_score: number;
  explanations: {
    tech: string;
    readme: string;
    structure: string;
    activity: string;
    commits: string;
    fraud: string;
    empty: string;
    final: string;
  };
  detected_tech_in_readme: Record<string, boolean>;
  detected_tech_in_code: Record<string, boolean>;
  ai_detected_tech: {
    frontend: string[];
    backend: string[];
    database: string[];
    devops: string[];
    ai_ml: string[];
    mobile: string[];
    blockchain: string[];
    other: string[];
  };
  commits_count: number;
  file_count: number;
  fraud_reasons: string[];
  ai_summary: string;
  repo_data: Record<string, unknown>;
}

export default function SubmissionPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await authClient.getSession();
        setSession(sessionData);

        if (sessionData?.data?.session?.id) {
          await fetchRepositories();
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const fetchRepositories = async () => {
    try {
      const response = await fetch("/api/getRepo");
      const data = await response.json();

      if (data.success) {
        setRepositories(data.repositories);
      } else {
        setError("Failed to fetch repositories: " + data.error);
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
      setError("Failed to fetch repositories");
    }
  };

  const handleAnalyzeRepository = async (repo: Repository) => {
    setAnalyzing(true);
    setError("");
    setSelectedRepo(repo);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: repo.html_url,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result);
      } else {
        setError("Analysis failed: " + result.error);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setError("Failed to analyze repository");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.data?.session?.id) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
              <Github className="h-6 w-6" />
              GitHub Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300 text-center">
              Please sign in with GitHub to access your repositories and submit
              them for analysis.
            </p>
            <GithubLoginButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Repository Submission</h1>
          <p className="text-gray-300">
            Select a repository from your GitHub account to analyze
          </p>
        </div>

        {error && (
          <Card className="mb-6 bg-red-900/50 border-red-800">
            <CardContent className="p-4">
              <p className="text-red-200">{error}</p>
            </CardContent>
          </Card>
        )}

        {!analysisResult ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Your Repositories</h2>

            {repositories.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-8 text-center">
                  <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">No repositories found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {repositories.map((repo) => (
                  <Card
                    key={repo.id}
                    className="bg-gray-900 border-gray-800 hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-white flex items-start justify-between">
                        <span className="truncate">{repo.name}</span>
                        {repo.private && (
                          <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-black">
                            Private
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {repo.description || "No description available"}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{repo.language || "Unknown"}</span>
                        <span className="flex items-center gap-1">
                          ⭐ {repo.stargazers_count}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAnalyzeRepository(repo)}
                          disabled={analyzing}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          {analyzing && selectedRepo?.id === repo.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Analyzing...
                            </>
                          ) : (
                            "Analyze"
                          )}
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analysis Results */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Analysis Complete: {analysisResult.repo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trust Score */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {Math.round(analysisResult.trust_score * 100) / 100}/100
                  </div>
                  <p className="text-gray-300">Trust Score</p>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">
                      Score Breakdown
                    </h3>
                    {Object.entries(analysisResult.explanations).map(
                      ([key, explanation]) => (
                        <div key={key} className="text-sm">
                          <span className="text-gray-300 capitalize">
                            {key}:
                          </span>
                          <span className="text-gray-200 ml-2">
                            {explanation}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">
                      Repository Stats
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-300">Commits:</span>{" "}
                        <span className="text-gray-200 ml-2">
                          {analysisResult.commits_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-300">Files:</span>{" "}
                        <span className="text-gray-200 ml-2">
                          {analysisResult.file_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-300">Owner:</span>{" "}
                        <span className="text-gray-200 ml-2">
                          {analysisResult.owner}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technology Detection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">
                    Technology Detection
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-300 mb-2">
                        Found in README
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          analysisResult.detected_tech_in_readme
                        ).map(([tech, detected]) => (
                          <span
                            key={tech}
                            className={`px-2 py-1 text-xs rounded ${
                              detected
                                ? "bg-green-600 text-white"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-300 mb-2">
                        Found in Code
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          analysisResult.detected_tech_in_code
                        ).map(([tech, detected]) => (
                          <span
                            key={tech}
                            className={`px-2 py-1 text-xs rounded ${
                              detected
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI-Detected Technologies */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    AI-Detected Technologies
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(analysisResult.ai_detected_tech || {}).map(([category, technologies]) => (
                      technologies.length > 0 && (
                        <div key={category} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-300 capitalize">
                            {category.replace('_', ' & ')}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {technologies.map((tech: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs rounded bg-purple-600 text-white"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Fraud Detection */}
                {analysisResult.fraud_reasons.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-red-400">
                      Issues Detected
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                      {analysisResult.fraud_reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Summary */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">
                    AI Analysis Summary
                  </h3>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {analysisResult.ai_summary}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => {
                      setAnalysisResult(null);
                      setSelectedRepo(null);
                      setError("");
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Analyze Another Repository
                  </Button>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <a
                      href={selectedRepo?.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Repository <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
