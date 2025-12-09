import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* -------------------------------------------------------
   RECURSIVE GITHUB FILE SCANNER (no code content)
--------------------------------------------------------*/
async function fetchAllFiles(owner: string, repo: string, path = "") {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "repo-analyzer",
  };

  const res = await fetch(url, { headers });
  const items = await res.json();

  if (!Array.isArray(items)) return [];

  let files: any[] = [];

  for (const item of items) {
    if (item.type === "dir") {
      if (
        ["node_modules", ".next", "dist", "build", "__pycache__", "coverage"].includes(
          item.name.toLowerCase()
        )
      )
        continue;

      const deeper = await fetchAllFiles(owner, repo, item.path);
      files = files.concat(deeper);
    }

    if (item.type === "file") {
      files.push({
        name: item.name,
        path: item.path,
      });
    }
  }

  return files;
}

/* -------------------------------------------------------
   ROUTE HANDLER
--------------------------------------------------------*/
export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();
    if (!repoUrl)
      return NextResponse.json({ error: "Repo URL is required." }, { status: 400 });

    /* ---------------------------------------------
       Extract owner + repo
    --------------------------------------------- */
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match)
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });

    const owner = match[1];
    const repo = match[2];

    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "repo-analyzer",
    };

    /* ---------------------------------------------
       BASIC REPO DATA
    --------------------------------------------- */
    const repoData = await (
      await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    ).json();

    const readmeData = await (
      await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers })
    ).json();

    const readmeText = readmeData?.content
      ? Buffer.from(readmeData.content, "base64").toString("utf8")
      : "README not found.";

    const rootFiles = await (
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
        headers,
      })
    ).json();

    const commits = await (
      await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, { headers })
    ).json();

    /* ---------------------------------------------
       FULL RECURSIVE FILE SCAN
    --------------------------------------------- */
    const allFiles = await fetchAllFiles(owner, repo);
    const fileNames = allFiles.map((f) => f.path.toLowerCase());

    /* ---------------------------------------------
       DEPENDENCY EXTRACTION
    --------------------------------------------- */
    let packageJson = null;
    let requirementsTxt = "";

    try {
      const pkg = rootFiles.find((f) => f.name === "package.json");
      if (pkg) packageJson = await (await fetch(pkg.download_url)).json();

      const req = rootFiles.find((f) => f.name === "requirements.txt");
      if (req) requirementsTxt = await (await fetch(req.download_url)).text();
    } catch {}

    const deps = JSON.stringify(packageJson || {}).toLowerCase();
    const reqTxt = requirementsTxt.toLowerCase();

    /* ---------------------------------------------
       RULE-BASED TECH STACK DETECTION
    --------------------------------------------- */
    const readmeLower = readmeText.toLowerCase();
    const has = (k: string) => readmeLower.includes(k);

    const techMatches = {
      react: has("react"),
      nextjs: has("next"),
      node: has("node"),
      express: has("express"),
      django: has("django"),
      flask: has("flask"),
      mongodb: has("mongodb"),
      firebase: has("firebase"),
    };

    const codeTech = {
      react: fileNames.some((p) => p.includes("app.jsx") || p.includes("app.tsx")),
      nextjs: fileNames.some((p) => p.includes("next.config.js")),
      node: fileNames.some((p) => p.includes("package.json")),
      express: deps.includes("express"),
      django: fileNames.some((p) => p.includes("manage.py")),
      flask: reqTxt.includes("flask"),
      mongodb: deps.includes("mongoose"),
      firebase: deps.includes("firebase"),
    };

    /* ---------------------------------------------
       TECH SCORE (Rule-Only)
    --------------------------------------------- */
    const mentioned = Object.values(techMatches).filter(Boolean).length;

    const matched = Object.keys(techMatches).filter((t) => {
      return techMatches[t as keyof typeof techMatches] &&
             codeTech[t as keyof typeof codeTech];
    }).length;

    const TechScore = mentioned === 0 ? 0 : (matched / mentioned) * 20;

    /* ---------------------------------------------
       README SCORE (0–20)
    --------------------------------------------- */
    let ReadmeScore = 0;
    if (has("install")) ReadmeScore += 5;
    if (has("usage") || has("run")) ReadmeScore += 5;
    if (has("tech")) ReadmeScore += 5;
    if (has("feature")) ReadmeScore += 5;

    /* ---------------------------------------------
       STRUCTURE SCORE (0–20)
    --------------------------------------------- */
    const fc = allFiles.length;
    const StructureScore = fc >= 25 ? 20 : fc >= 10 ? 15 : fc >= 5 ? 10 : 3;

    /* ---------------------------------------------
       ACTIVITY SCORE (0–15)
    --------------------------------------------- */
    const lastPush = new Date(repoData.pushed_at).getTime();
    const daysSince = (Date.now() - lastPush) / 86400000;

    const ActivityScore =
      daysSince <= 7 ? 15 : daysSince <= 30 ? 10 : daysSince <= 90 ? 5 : 2;

    /* ---------------------------------------------
       COMMIT SCORE (0–15)
    --------------------------------------------- */
    const ci = commits.length;

    const CommitIntegrityScore =
      ci >= 15 ? 15 :
      ci >= 8 ? 12 :
      ci >= 4 ? 8 :
      ci >= 2 ? 5 : 1;

    /* ---------------------------------------------
       PENALTIES WITH REASONS
    --------------------------------------------- */
    let FraudPenalty = 0;
    let fraudReasons: string[] = [];

    if (ci === 1) {
      FraudPenalty += 10;
      fraudReasons.push("Only one commit — likely copied & pasted");
    }

    if (mentioned > matched) {
      FraudPenalty += 5;
      fraudReasons.push("README claims tech that is not found in repo");
    }

    if (fc <= 3) {
      FraudPenalty += 5;
      fraudReasons.push("Very few files — suspicious or incomplete repo");
    }

    const EmptyPenalty = fc < 3 ? 10 : fc < 5 ? 5 : 0;

    /* ---------------------------------------------
       FINAL SCORE (0–100)
    --------------------------------------------- */
    let FinalScore =
      TechScore +
      ReadmeScore +
      StructureScore +
      ActivityScore +
      CommitIntegrityScore -
      FraudPenalty -
      EmptyPenalty;

    FinalScore = Math.max(0, Math.min(100, FinalScore));

    /* ---------------------------------------------
       EXPLANATIONS (Now includes fraud REASONS)
    --------------------------------------------- */
    const explanations = {
      tech: `TechScore ${TechScore}/20 — ${matched}/${mentioned} tech matched.`,
      readme: `ReadmeScore ${ReadmeScore}/20`,
      structure: `StructureScore ${StructureScore}/20 — total files: ${fc}.`,
      activity: `ActivityScore ${ActivityScore}/15 — last push ${Math.round(daysSince)} days ago.`,
      commits: `CommitScore ${CommitIntegrityScore}/15 — ${ci} commits.`,
      fraud: fraudReasons.length
        ? `FraudPenalty -${FraudPenalty} — Reasons: ${fraudReasons.join("; ")}`
        : "FraudPenalty 0 — No suspicious patterns.",
      empty: `EmptyPenalty -${EmptyPenalty}`,
      final: `FinalScore ${FinalScore}/100`,
    };

    /* ---------------------------------------------
       AI SUMMARY (NO tech detection)
    --------------------------------------------- */
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const aiInput = `
Analyze this repository (MAX 200 words). Do NOT scan code.

Provide:
1. Top 3 features from README
2. Whether matching folders/files exist
3. Missing features
4. Suspicious patterns
5. AI trust score (0–100)
6. Final verdict
`;

    const aiResp = await model.generateContent(aiInput);
    const aiText = aiResp.response.text();

    /* ---------------------------------------------
       RETURN FINAL RESPONSE
    --------------------------------------------- */
    return NextResponse.json({
      success: true,
      owner,
      repo,
      trust_score: FinalScore,
      explanations,
      detected_tech_in_readme: techMatches,
      detected_tech_in_code: codeTech,
      commits_count: ci,
      file_count: fc,
      fraud_reasons: fraudReasons,
      ai_summary: aiText,
      repo_data: repoData,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
