// GitHub OAuth and verification types
export interface GitHubUser {
  id: string;
  login: string;
  email?: string;
  avatar_url?: string;
  name?: string;
}

export interface VerificationSession {
  githubUser: GitHubUser;
  walletAddress: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

export interface VerificationData {
  githubUser: GitHubUser;
  nonce: string;
  timestamp: number;
  chainId: number;
}

export interface VerificationResult {
  success: boolean;
  data: {
    githubId: string;
    githubUsername: string;
    walletAddress: string;
    nonce: string;
    timestamp: number;
    signature: string;
  };
}

// Team types
export interface TeamMetadata {
  name: string;
  description: string;
  image?: string;
  members?: string[];
  createdAt: string;
}

export interface TeamData {
  teamName: string;
  teamDescription: string;
  teamImage?: File;
  joinCode: string;
  members?: string[];
}
