import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl)
      return NextResponse.json(
        { error: "Repo URL is required." },
        { status: 400 }
      );

    // --------------------------
    // Extract owner + repo
    // --------------------------
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match)
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 }
      );

    const owner = match[1];
    const repo = match[2];

    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "repo-analyzer",
      Accept: "application/vnd.github+json",
    };

    // -----------------------------
    // Fetch Repo Metadata
    // -----------------------------
    const repoRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );
    const repoData = await repoRes.json();

    // -----------------------------
    // Fetch README
    // -----------------------------
    const readmeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers }
    );
    const readmeData = await readmeRes.json();

    const readmeText = readmeData?.content
      ? Buffer.from(readmeData.content, "base64").toString("utf8")
      : "README not found.";

    // -----------------------------
    // Fetch languages
    // -----------------------------
    const langRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      { headers }
    );
    const languages = await langRes.json();

    // -----------------------------
    // Fetch file structure
    // -----------------------------
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      { headers }
    );
    const fileTree = await treeRes.json();

    // -----------------------------
    // Fetch commits
    // -----------------------------
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      { headers }
    );
    const commits = await commitRes.json();

    // ============================================
    // RULE-BASED ANALYSIS (Consistency + Activity)
    // ============================================

    const readmeLower = readmeText.toLowerCase();

    const techMatches = {
      react: readmeLower.includes("react"),
      nextjs: readmeLower.includes("next"),
      node: readmeLower.includes("node"),
      express: readmeLower.includes("express"),
      python: readmeLower.includes("python"),
      django: readmeLower.includes("django"),
      flask: readmeLower.includes("flask"),
      mongodb: readmeLower.includes("mongo"),
      firebase: readmeLower.includes("firebase"),
    };

    const fileNames = fileTree?.map((f) => f.name.toLowerCase()) || [];

    const codeTech = {
      react: fileNames.includes("app.jsx") || fileNames.includes("app.tsx"),
      nextjs:
        fileNames.includes("next.config.js") ||
        fileNames.includes("next.config.mjs") ||
        fileNames.includes("app") ||
        fileNames.includes("pages"),
      node: fileNames.includes("package.json"),
      python: fileNames.some((f) => f.endsWith(".py")),
      django: fileNames.includes("manage.py"),
      flask: fileNames.includes("app.py"),
      mongodb:
        readmeLower.includes("mongoose") || readmeLower.includes("mongodb"),
      firebase: readmeLower.includes("firebase"),
    };

    let consistencyScore = 0;
    Object.keys(techMatches).forEach((tech) => {
      if (techMatches[tech] && codeTech[tech]) consistencyScore += 5;
    });

    const isActive =
      commits.length > 5 &&
      new Date(repoData.pushed_at).getTime() >
        Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days

    const activityScore = isActive ? 20 : 5;
    const structureScore =
      fileTree.length > 5 ? 20 : fileTree.length > 2 ? 10 : 0;

    const ruleBasedTrust = consistencyScore + activityScore + structureScore;

    // ============================================
    // GEMINI AI ANALYSIS
    // ============================================
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const aiPrompt = `
You are an AI system that analyzes GitHub repositories for a hackathon.
Evaluate the project for authenticity, completeness, and README truthfulness.

### README:
${readmeText}

### File Tree:
${fileTree.map((f) => f.name).join(", ")}

### Languages:
${JSON.stringify(languages, null, 2)}

### Top 5 Commit Messages:
${commits
  .slice(0, 5)
  .map((c) => c.commit.message)
  .join("\n")}

### Repo Metadata:
${JSON.stringify(repoData, null, 2)}

---
TASKS:
1. Does the README truthfully describe the codebase?
2. What tech stack is actually used?
3. Which features are missing or exaggerated?
4. Are there signs of copy-paste or template usage?
5. Is the commit history suspicious?
6. Is the repo structure valid for a real project?
7. Provide an AI-based trust score (0–100).
8. Provide a detailed explanation.
---
Return your answer in clean text.
`;

    const aiResponse = await model.generateContent(aiPrompt);
    const aiText = aiResponse.response.text();

    // ============================================
    // RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,
      owner,
      repo,

      rule_based_score: ruleBasedTrust,
      scores: {
        consistency: consistencyScore,
        activity: activityScore,
        structure: structureScore,
      },

      ai_analysis: aiText,

      readme_detected_tech: techMatches,
      code_detected_tech: codeTech,

      repo_data: repoData,
      languages,
      commits_count: commits.length,
      file_count: fileTree.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
