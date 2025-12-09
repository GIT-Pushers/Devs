import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  basePath: "/api/auth",
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: ["user", "repo"], // Request access to user info and repositories
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Store additional account information if needed
      if (account?.provider === "github") {
        console.log("GitHub sign in with access token");
      }
      return true;
    },
  },
});
