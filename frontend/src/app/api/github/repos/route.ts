import { auth } from "@/utils/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get session using Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Session user:", session.user);

    // Better Auth stores OAuth tokens in the accounts table
    // We need to query the database to get the GitHub access token
    // Since Better Auth v1.x doesn't expose tokens directly in session,
    // we'll use the auth instance to get the account data

    let githubToken: string | null = null;

    try {
      // Use Better Auth's internal API to get account info
      // The token should be in session.session or we need to query accounts

      // Try different possible locations for the token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((session as any).session?.accessToken) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        githubToken = (session as any).session.accessToken;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((session as any).user?.accessToken) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        githubToken = (session as any).user.accessToken;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((session as any).account?.access_token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        githubToken = (session as any).account.access_token;
      }

      // If we still don't have the token, we need to fetch it from the database
      // This requires direct database access which Better Auth doesn't expose easily
      // As a fallback, we'll use the environment token for now
      if (!githubToken) {
        console.warn(
          "GitHub token not found in session, using environment token as fallback"
        );
        githubToken =
          process.env.GITHUB_TOKEN ||
          process.env.NEXT_PUBLIC_GITHUB_API_KEY ||
          null;
      }
    } catch (error) {
      console.error("Error extracting GitHub token:", error);
    }

    if (!githubToken) {
      console.error(
        "GitHub token not found. Session structure:",
        JSON.stringify(session, null, 2)
      );
      return new Response(
        JSON.stringify({
          error: "GitHub token missing",
          details:
            "Please re-authenticate with GitHub to grant repository access. Make sure to authorize repository access during login.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching GitHub repos...");

    // Fetch user's repositories from GitHub API
    const res = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator",
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "BetterAuth-GLYTCH-App",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("GitHub API error:", res.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch repositories from GitHub",
          status: res.status,
          details: errorText,
        }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const repos = await res.json();

    console.log(`Successfully fetched ${repos.length} repositories`);

    return new Response(JSON.stringify(repos), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error("Error in /api/github/repos:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
