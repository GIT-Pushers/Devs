import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  basePath: "/api/auth",
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: ["user", "repo"], // Request access to user info and repositories
    },
  },
  // Store additional user data including access tokens
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  // Enable account linking to store OAuth tokens
  account: {
    accountLinking: {
      enabled: true,
    },
  },
});
