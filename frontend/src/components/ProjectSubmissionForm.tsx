"use client";
import React, { useState } from "react";
import { Github, Send, AlertCircle, CheckCircle2, Cpu } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SubmissionFormData {
  hackathonId: string;
  teamId: string;
  repoUrl: string;
}

interface AnalysisResult {
  repoHash: string;
  aiScore: number;
}

export const ProjectSubmissionForm: React.FC = () => {
  const [formData, setFormData] = useState<SubmissionFormData>({
    hackathonId: "",
    teamId: "",
    repoUrl: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SubmissionFormData, string>>
  >({});
  const [status, setStatus] = useState<
    "idle" | "analyzing" | "submitting" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.hackathonId)
      newErrors.hackathonId = "Hackathon ID is required";
    if (!formData.teamId) newErrors.teamId = "Team ID is required";
    if (!formData.repoUrl) {
      newErrors.repoUrl = "GitHub Repository URL is required";
    } else if (!formData.repoUrl.includes("github.com")) {
      newErrors.repoUrl = "Must be a valid GitHub URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("analyzing");

    // Simulate Backend Analysis (Repo Hash & AI Score)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResult = {
      repoHash:
        "0x" +
        Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(""),
      aiScore: Math.floor(Math.random() * (100 - 60) + 60), // Random score between 60-100
    };
    setResult(mockResult);

    setStatus("submitting");
    // Simulate Final Submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus("success");
  };

  const resetForm = () => {
    setFormData({ hackathonId: "", teamId: "", repoUrl: "" });
    setStatus("idle");
    setErrors({});
    setResult(null);
  };

  if (status === "success" && result) {
    return (
      <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm text-center max-w-lg mx-auto animate-fadeIn">
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Project Submitted!
        </h3>
        <p className="text-neutral-600 mb-6">
          Your project has been successfully analyzed and submitted to the
          blockchain.
        </p>

        <div className="bg-neutral-50 rounded-lg p-4 text-left space-y-3 mb-8 border border-neutral-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-500">
              AI Quality Score
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-info/20 text-info">
              {result.aiScore}/100
            </span>
          </div>
          <div className="border-t border-neutral-200 my-2"></div>
          <div>
            <span className="text-xs font-medium text-neutral-500 block mb-1">
              Repo Hash
            </span>
            <code className="text-xs bg-neutral-200 px-2 py-1 rounded block break-all text-neutral-700 font-mono">
              {result.repoHash}
            </code>
          </div>
        </div>

        <Button onClick={resetForm} className="w-full">
          Submit Another Project
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl border border-neutral-200 shadow-sm max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Submit Project</h2>
        <p className="text-neutral-500 mt-1">
          Submit your hackathon project for AI analysis and verification.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Hackathon ID
            </label>
            <Input
              type="number"
              placeholder="e.g. 1"
              value={formData.hackathonId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  hackathonId: e.target.value,
                }))
              }
            />
            {errors.hackathonId && (
              <p className="text-destructive text-sm mt-1">
                {errors.hackathonId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Team ID
            </label>
            <Input
              type="number"
              placeholder="e.g. 42"
              value={formData.teamId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, teamId: e.target.value }))
              }
            />
            {errors.teamId && (
              <p className="text-destructive text-sm mt-1">{errors.teamId}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-2">
            GitHub Repository URL
          </label>
          <div className="relative">
            <Input
              placeholder="https://github.com/username/repo"
              value={formData.repoUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, repoUrl: e.target.value }))
              }
              className="pl-10"
            />
            <Github className="w-5 h-5 text-neutral-400 absolute left-3 top-2.5" />
          </div>
          {errors.repoUrl && (
            <p className="text-destructive text-sm mt-1">{errors.repoUrl}</p>
          )}
          <p className="text-xs text-neutral-500 mt-2">
            Make sure your repository is public for the AI analysis tool to
            access it.
          </p>
        </div>

        {status === "analyzing" && (
          <div className="p-4 bg-info/20 border border-info/30 rounded-lg flex items-center gap-3 text-info animate-pulse">
            <Cpu className="w-5 h-5 flex-shrink-0 animate-spin" />
            <p>Running AI Analysis on your repository...</p>
          </div>
        )}

        {status === "error" && (
          <div className="p-4 bg-destructive/20 border border-destructive/30 rounded-lg flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Submission failed. Please check your inputs and try again.</p>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full h-12 text-lg gap-2"
            disabled={status === "analyzing" || status === "submitting"}
          >
            {status === "analyzing" ? (
              "Analyzing..."
            ) : status === "submitting" ? (
              "Submitting to Chain..."
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
