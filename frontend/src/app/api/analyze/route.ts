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
        [
          "node_modules",
          ".next",
          "dist",
          "build",
          "__pycache__",
          "coverage",
        ].includes(item.name.toLowerCase())
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
   Helper: simple rule-based dependency -> category map
   Returns a mapping of dependencyName -> category (string)
--------------------------------------------------------*/
function ruleBasedDepCategory(depName: string) {
  const n = depName.toLowerCase();

  // Frontend
  const frontend = [
    "react",
    "vue",
    "angular",
    "svelte",
    "ember",
    "preact",
    "next",
    "nuxt",
    "gatsby",
  ];
  if (frontend.some((k) => n.includes(k))) return "frontend";

  // Backend / frameworks
  const backend = [
    "express",
    "koa",
    "hapi",
    "fastify",
    "nestjs",
    "spring",
    "django",
    "flask",
    "fastapi",
    "vertx",
  ];
  if (backend.some((k) => n.includes(k))) return "backend";

  // Databases / ORMs
  const db = [
    "mongoose",
    "pg",
    "postgres",
    "sequelize",
    "prisma",
    "mysql",
    "redis",
    "mongodb",
    "sqlalchemy",
    "psycopg2",
    "sqlite",
  ];
  if (db.some((k) => n.includes(k))) return "database";

  // Devops / infra
  const devops = ["docker", "kubernetes", "helm", "terraform", "ansible"];
  if (devops.some((k) => n.includes(k))) return "devops";

  // AI / ML libs
  const aiml = [
    "tensorflow",
    "torch",
    "scikit",
    "transformers",
    "accelerate",
    "keras",
    "sklearn",
    "pytorch",
  ];
  if (aiml.some((k) => n.includes(k))) return "ai_ml";

  // Mobile
  const mobile = ["react-native", "flutter", "cordova", "ionic"];
  if (mobile.some((k) => n.includes(k))) return "mobile";

  // Blockchain
  const blockchain = [
    "solidity",
    "ethers",
    "web3",
    "hardhat",
    "truffle",
    "brownie",
    "thirdweb",
  ];
  if (blockchain.some((k) => n.includes(k))) return "blockchain";

  // CSS / UI
  const ui = [
    "tailwind",
    "material-ui",
    "bootstrap",
    "chakra",
    "styled-components",
  ];
  if (ui.some((k) => n.includes(k))) return "other";

  // Utilities that say little
  const other = ["lodash", "axios", "request", "moment", "dayjs"];
  if (other.some((k) => n.includes(k))) return "other";

  return null; // unknown
}

/* -------------------------------------------------------
   AI-powered dependency classifier
   - Accepts dependencies array (strings)
   - Runs rule-based mapping first
   - For unknowns, asks Gemini to classify into categories
   - Returns object with arrays for each category
--------------------------------------------------------*/
async function detectTechFromDeps(
  packageJson: any,
  requirementsTxt: string,
  genAIModel: any // model instance from GoogleGenerativeAI.getGenerativeModel()
) {
  // 1) Extract dependency names
  let depsList: string[] = [];

  try {
    if (packageJson) {
      const depFields = [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
      ];
      for (const f of depFields) {
        if (packageJson[f] && typeof packageJson[f] === "object") {
          depsList.push(...Object.keys(packageJson[f]));
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // parse requirements.txt
  if (requirementsTxt) {
    const lines = requirementsTxt
      .split(/\r?\n/)
      .map((l) => l.replace(/[#].*$/, "").trim()) // remove comments
      .filter(Boolean)
      .map((l) => {
        // format: package==1.2.3 or package>=1.2 or git+https...
        const parts = l.split(/[<=>~!@#\s]/).filter(Boolean);
        return parts[0] || l;
      });
    depsList.push(...lines);
  }

  // normalize and dedupe
  depsList = Array.from(
    new Set(depsList.map((d) => (d || "").toLowerCase()))
  ).filter(Boolean);

  // 2) Rule-based classification
  const result: Record<string, Set<string>> = {
    frontend: new Set(),
    backend: new Set(),
    database: new Set(),
    devops: new Set(),
    ai_ml: new Set(),
    mobile: new Set(),
    blockchain: new Set(),
    other: new Set(),
  };

  const unknowns: string[] = [];

  for (const d of depsList) {
    const cat = ruleBasedDepCategory(d);
    if (cat) {
      result[cat].add(d);
    } else {
      unknowns.push(d);
    }
  }

  // 3) If there are unknowns, ask Gemini to classify them (small prompt)
  if (unknowns.length > 0 && genAIModel) {
    // build compact prompt
    const prompt = `
You are an assistant that classifies software package names into one of the categories:
frontend, backend, database, devops, ai_ml, mobile, blockchain, other.
Return ONLY JSON mapping each package to a single category.

Packages:
${JSON.stringify(unknowns.slice(0, 60))}

Output example:
{"package1":"frontend","package2":"ai_ml"}

If uncertain, choose "other".
`;

    try {
      const resp = await genAIModel.generateContent(prompt);
      const text = resp.response.text().trim();

      // Try to parse JSON from response (be forgiving)
      let parsed: Record<string, string> = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        // attempt to extract JSON substring
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            parsed = JSON.parse(m[0]);
          } catch {
            parsed = {};
          }
        }
      }

      for (const [pkg, cat] of Object.entries(parsed)) {
        const c = (cat || "other").toLowerCase();
        if (c in result) result[c].add(pkg.toLowerCase());
        else result.other.add(pkg.toLowerCase());
      }
    } catch {
      // if AI fails, put unknowns into "other"
      for (const u of unknowns) result.other.add(u);
    }
  } else {
    // no model available or no unknowns: add unknowns to other
    for (const u of unknowns) result.other.add(u);
  }

  // convert Set -> Array
  const final: Record<string, string[]> = {};
  for (const k of Object.keys(result)) {
    final[k] = Array.from(result[k]).sort();
  }

  return final;
}

/* -------------------------------------------------------
   ROUTE HANDLER
--------------------------------------------------------*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl, owner, repo } = body;

    let finalOwner: string;
    let finalRepo: string;

    // Support both formats: repoUrl or owner/repo
    if (repoUrl) {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match)
        return NextResponse.json(
          { error: "Invalid GitHub URL" },
          { status: 400 }
        );
      finalOwner = match[1];
      finalRepo = match[2];
    } else if (owner && repo) {
      finalOwner = owner;
      finalRepo = repo;
    } else {
      return NextResponse.json(
        { error: "Either repoUrl or owner/repo is required." },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "repo-analyzer",
    };

    /* Basic repo data */
    const repoData = await (
      await fetch(`https://api.github.com/repos/${finalOwner}/${finalRepo}`, {
        headers,
      })
    ).json();
    const readmeData = await (
      await fetch(
        `https://api.github.com/repos/${finalOwner}/${finalRepo}/readme`,
        { headers }
      )
    ).json();
    const readmeText = readmeData?.content
      ? Buffer.from(readmeData.content, "base64").toString("utf8")
      : "README not found.";
    const rootFiles = await (
      await fetch(
        `https://api.github.com/repos/${finalOwner}/${finalRepo}/contents`,
        { headers }
      )
    ).json();
    const commits = await (
      await fetch(
        `https://api.github.com/repos/${finalOwner}/${finalRepo}/commits`,
        { headers }
      )
    ).json();

    /* Full recursive file list */
    const allFiles = await fetchAllFiles(finalOwner, finalRepo);
    const fileNames = allFiles.map((f) => f.path.toLowerCase());

    /* Dependency extraction */
    let packageJson: any = null;
    let requirementsTxt = "";
    try {
      const pkg = rootFiles.find((f: any) => f.name === "package.json");
      if (pkg) packageJson = await (await fetch(pkg.download_url)).json();

      const req = rootFiles.find((f: any) => f.name === "requirements.txt");
      if (req) requirementsTxt = await (await fetch(req.download_url)).text();
    } catch {}

    const deps = JSON.stringify(packageJson || {}).toLowerCase();
    const reqTxt = requirementsTxt.toLowerCase();

    /* Prepare Gemini model for optional AI classification */
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    /* New: AI-powered dependency classifier (rule-based + AI) */
    const aiDetectedTech = await detectTechFromDeps(
      packageJson,
      requirementsTxt,
      model
    );

    /* Rule-based README and file detection (as before) */
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
      react: fileNames.some(
        (p: string) => p.includes("app.jsx") || p.includes("app.tsx")
      ),
      nextjs: fileNames.some((p: string) => p.includes("next.config.js")),
      node: fileNames.some((p: string) => p.includes("package.json")),
      express: deps.includes("express"),
      django: fileNames.some((p: string) => p.includes("manage.py")),
      flask: reqTxt.includes("flask"),
      mongodb: deps.includes("mongoose"),
      firebase: deps.includes("firebase"),
    };

    /* TECH SCORE: merge README claims + aiDetectedTech (from deps) */
    const aiFlat = Object.values(aiDetectedTech)
      .flat()
      .map((t: any) => (t || "").toLowerCase());
    const claimedSet = new Set([
      ...Object.keys(techMatches).filter((k) => techMatches[k]),
      ...aiFlat,
    ]);
    const mentioned = claimedSet.size;

    const matched = [...claimedSet].filter((tech) => {
      return (
        fileNames.some((p) => p.includes(tech)) ||
        deps.includes(tech) ||
        reqTxt.includes(tech)
      );
    }).length;

    const TechScore = mentioned === 0 ? 0 : (matched / mentioned) * 20;

    /* README score */
    let ReadmeScore = 0;
    if (has("install")) ReadmeScore += 5;
    if (has("usage") || has("run")) ReadmeScore += 5;
    if (has("tech")) ReadmeScore += 5;
    if (has("feature")) ReadmeScore += 5;

    /* Structure */
    const fc = allFiles.length;
    const StructureScore = fc >= 25 ? 20 : fc >= 10 ? 15 : fc >= 5 ? 10 : 3;

    /* Activity */
    const lastPush = new Date(repoData.pushed_at).getTime();
    const daysSince = (Date.now() - lastPush) / 86400000;
    const ActivityScore =
      daysSince <= 7 ? 15 : daysSince <= 30 ? 10 : daysSince <= 90 ? 5 : 2;

    /* Commits */
    const ci = commits.length;
    const CommitIntegrityScore =
      ci >= 15 ? 15 : ci >= 8 ? 12 : ci >= 4 ? 8 : ci >= 2 ? 5 : 1;

    /* Penalties + reasons */
    let FraudPenalty = 0;
    const fraudReasons: string[] = [];
    if (ci === 1) {
      FraudPenalty += 10;
      fraudReasons.push("Only one commit — likely pasted upload.");
    }
    if (mentioned > matched) {
      FraudPenalty += 5;
      fraudReasons.push(
        "README/deps claim tech that isn't found in file names/deps."
      );
    }
    if (fc <= 3) {
      FraudPenalty += 5;
      fraudReasons.push("Very few files — possibly placeholder or incomplete.");
    }

    const EmptyPenalty = fc < 3 ? 10 : fc < 5 ? 5 : 0;

    /* Final score */
    let FinalScore =
      TechScore +
      ReadmeScore +
      StructureScore +
      ActivityScore +
      CommitIntegrityScore -
      FraudPenalty -
      EmptyPenalty;
    FinalScore = Math.max(0, Math.min(100, FinalScore));

    /* Explanations (include fraud reasons) */
    const explanations = {
      tech: `TechScore ${TechScore.toFixed(
        1
      )}/20 — matched ${matched}/${mentioned}.`,
      readme: `ReadmeScore ${ReadmeScore}/20`,
      structure: `StructureScore ${StructureScore}/20 — ${fc} files scanned.`,
      activity: `ActivityScore ${ActivityScore}/15 — last push ${Math.round(
        daysSince
      )} days ago.`,
      commits: `CommitScore ${CommitIntegrityScore}/15 — ${ci} commits.`,
      fraud: fraudReasons.length
        ? `FraudPenalty -${FraudPenalty} — ${fraudReasons.join("; ")}`
        : `FraudPenalty 0 — No major red flags.`,
      empty: `EmptyPenalty -${EmptyPenalty}`,
      final: `FinalScore ${FinalScore.toFixed(1)}/100`,
    };

    /* AI summary (no code scan) */
    const aiInput = `
Analyze this repository (<=200 words). Use only README, file paths, commit messages, and detected dependencies.
Do NOT read or analyze code content.

README:
${readmeText.slice(0, 1200)}

Files (first 80):
${fileNames.slice(0, 80).join(", ")}

Detected dependencies (sample):
${Object.entries(aiDetectedTech)
  .slice(0, 20)
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

Tasks:
1) Extract top 3 features from README.
2) For each, check if matching files/folders exist.
3) List missing features.
4) Flag suspicious patterns.
5) Give AI trust score (0–100).
6) Final one-line verdict.
dont return markdown just plain text
`;

    let aiText = "";
    try {
      const aiResp = await model.generateContent(aiInput);
      aiText = aiResp.response.text();
    } catch (e) {
      aiText = "AI summary failed: " + String(e?.message || e);
    }

    /* Return */
    return NextResponse.json({
      success: true,
      owner,
      repo,
      trust_score: FinalScore,
      explanations,
      fraud_reasons: fraudReasons,
      ai_summary: aiText,
      ai_detected_tech: aiDetectedTech,
      detected_tech_in_readme: techMatches,
      detected_tech_in_code: codeTech,
      commits_count: ci,
      file_count: fc,
      repo_data: repoData,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
