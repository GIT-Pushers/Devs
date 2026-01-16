# HACKX - Decentralized Hackathon Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.20-363636.svg?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-000000.svg?logo=next.js)](https://nextjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19-FFF100.svg)](https://hardhat.org/)

**A fully decentralized platform for organizing, managing, and participating in blockchain-based hackathons**

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [Smart Contracts](#-smart-contracts) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Smart Contracts](#-smart-contracts)
- [Frontend](#-frontend)
- [Configuration](#-configuration)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Usage Guide](#-usage-guide)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**HACKX** is a revolutionary decentralized hackathon platform built on blockchain technology that brings transparency, fairness, and automation to the world of hackathons. It eliminates centralized control, ensures fair judging through a multi-faceted scoring system, and provides verifiable proof of participation through NFTs.

The platform combines:
- **Smart Contracts** for transparent hackathon management
- **GitHub Integration** for developer verification and project submissions
- **Multi-Layered Judging** combining judges, participant voting, and AI scoring
- **NFTs** for participation proof and achievements
- **Soulbound Voting Tokens** for democratic project evaluation
- **Automated Reward Distribution** based on performance

---

## ✨ Features

### 🎯 Core Features

- **🏆 Decentralized Hackathon Creation & Management**
  - Create hackathons with customizable parameters
  - Set judging panels, timelines, and team constraints
  - Automated lifecycle management (sponsorship → hacking → judging → rewards)
  - Refundable creation fees based on participation thresholds

- **👥 Team Formation & Management**
  - Create teams with metadata (name, description, image)
  - Secure join codes for team privacy
  - Support for teams of up to 6 members
  - Team registration and staking system

- **💰 Sponsorship System**
  - Open sponsorship periods for community funding
  - Minimum sponsorship thresholds
  - Transparent fund tracking
  - Automated distribution to winners and organizers

- **🔐 GitHub Verification (EIP-712)**
  - Cryptographic verification of GitHub accounts
  - One-to-one wallet-to-GitHub binding
  - Prevents Sybil attacks
  - Verifiable developer identity

- **📊 Multi-Faceted Scoring System**
  - **40% Judge Score**: Expert panel evaluation
  - **35% Participant Vote**: Democratic community voting
  - **25% AI Score**: Automated code quality analysis
  - Transparent, weighted final scores
  - Ranking system for prize distribution

- **🗳️ Soulbound Voting Tokens**
  - Non-transferable ERC20 tokens for voting
  - Equal voting power for all participants
  - Prevents vote buying/selling
  - Burned after voting completion

- **🎨 Participation NFTs**
  - ERC721 tokens with full metadata
  - Include final scores and rankings
  - Permanent proof of participation
  - Shareable achievements

- **💸 Automated Reward Distribution**
  - 80% to winners (proportional to scores)
  - 15% to organizers
  - 5% platform fee
  - Stake refunds for all participants

### 🎨 Frontend Features

- **Modern UI/UX** with Next.js 16 and React 19
- **Dark/Light Mode** support with theme-aware color system
- **Responsive Design** for all screen sizes
- **Real-time Updates** with optimistic UI patterns
- **Wallet Integration** via ThirdWeb
- **GitHub OAuth** for seamless verification
- **IPFS Integration** for decentralized metadata storage
- **AI-Powered Analysis** using Google Gemini

---

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity ^0.8.20** - Smart contract language
- **Hardhat 2.19** - Development environment
- **OpenZeppelin Contracts 5.4** - Secure contract libraries
- **EIP-712** - Typed structured data signing
- **zkSync Era** - Layer 2 scaling support

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **ThirdWeb SDK 5** - Web3 integration
- **Better Auth 1.4** - Authentication
- **Zustand 5** - State management
- **Framer Motion 12** - Animations
- **React Hook Form 7** - Form management
- **Zod 4** - Schema validation

### Backend & Services
- **IPFS/Pinata** - Decentralized file storage
- **Google Gemini AI** - Code analysis
- **Ethereum/Sepolia** - Blockchain networks
- **GitHub OAuth** - Developer authentication

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │   Pages      │  Components  │       Hooks & Utils      │ │
│  │  • Home      │  • Landing   │  • useGitHubVerification │ │
│  │  • Hackathon │  • Forms     │  • useTeamManagement     │ │
│  │  • Teams     │  • Modals    │  • Web3 Integration      │ │
│  │  • Profile   │  • UI        │  • IPFS Upload           │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└────────────┬────────────────────────────────────────────────┘
             │
             │ API Routes
             ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js)                      │
│  • /api/auth/[...all] - Authentication                       │
│  • /api/verify/* - GitHub verification                       │
│  • /api/teams/* - Team management                            │
│  • /api/analyze - AI code analysis                           │
│  • /api/github/* - GitHub integration                        │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Web3 Calls
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Smart Contracts (Solidity)                │
│  ┌────────────────┬─────────────────┬───────────────────┐   │
│  │  GLYTCHCore    │ GitHubVerifier  │ GLYTCHVotingToken │   │
│  │  • Hackathons  │ • EIP-712       │ • Soulbound       │   │
│  │  • Teams       │ • Verification  │ • Voting          │   │
│  │  • Submissions │ • Nonce         │ • Distribution    │   │
│  │  • Scoring     │                 │                   │   │
│  │  • Rewards     │                 │                   │   │
│  └────────────────┴─────────────────┴───────────────────┘   │
│  ┌────────────────────────────────────────────────────┐     │
│  │         GLYTCHParticipationNFT (ERC721)            │     │
│  │         • Minting with metadata                    │     │
│  │         • Scores and rankings                      │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Smart Contract Flow

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Organizer  │      │    Teams     │      │    Judges    │
│              │      │              │      │              │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ 1. Create           │                     │
       │    Hackathon        │                     │
       │                     │                     │
       │                     │ 2. Create Team      │
       │                     │    & Register       │
       │                     │                     │
       │                     │ 3. Stake ETH        │
       │                     │                     │
       │                     │ 4. Receive          │
       │                     │    Voting Tokens    │
       │                     │                     │
       │                     │ 5. Submit Project   │
       │                     │    (AI Score)       │
       │                     │                     │
       │                     │                     │ 6. Submit
       │                     │                     │    Judge Scores
       │                     │                     │
       │                     │ 7. Vote on Projects │
       │                     │    (Participant)    │
       │                     │                     │
       │                     │                     │
       │ 8. Calculate Final Scores & Rankings      │
       │                                           │
       │ 9. Distribute Rewards                     │
       │                                           │
       │                     │ 10. Mint NFTs       │
       │                     │                     │
       ▼                     ▼                     ▼
   Complete              Winners               Participation
                       Get Rewards               Proof NFT
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **Git**
- **MetaMask** or other Web3 wallet
- **Ethereum Testnet ETH** (Sepolia)

Optional:
- **Hardhat** knowledge for smart contract development
- **IPFS/Pinata** account for metadata storage
- **GitHub OAuth** app credentials
- **Google Gemini API** key for AI analysis

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/GIT-Pushers/Devs.git
cd Devs
```

### 2. Install Root Dependencies

```bash
npm install
# or
yarn install
```

### 3. Install Contract Dependencies

```bash
cd contracts
npm install
cd ..
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Set Up Environment Variables

#### Contracts Environment (contracts/.env)

```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env`:

```env
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key

# Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Frontend Environment (frontend/.env.local)

Create `frontend/.env.local`:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id

# Pinata (IPFS)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Better Auth
BETTER_AUTH_SECRET=generate_random_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Contract Addresses (after deployment)
NEXT_PUBLIC_GLYTCH_CORE_ADDRESS=deployed_core_address
NEXT_PUBLIC_GITHUB_VERIFIER_ADDRESS=deployed_verifier_address
NEXT_PUBLIC_PARTICIPATION_NFT_ADDRESS=deployed_nft_address

# Network
NEXT_PUBLIC_CHAIN_ID=11155111
```

---

## 📁 Project Structure

```
Devs/
├── contracts/                  # Smart contracts
│   ├── contracts/
│   │   ├── GLYTCHCore.sol         # Main hackathon management
│   │   ├── GitHubVerifier.sol     # GitHub verification with EIP-712
│   │   ├── GLYTCHVotingToken.sol  # Soulbound voting tokens
│   │   ├── GLYTCHParticipationNFT.sol  # Participation NFTs
│   │   └── interfaces/
│   │       └── IGLYTCHStructs.sol # Shared structs and events
│   ├── scripts/
│   │   └── deploy.js              # Deployment script
│   ├── test/
│   │   └── GLYTCHPlatform.test.js # Comprehensive tests
│   ├── hardhat.config.js          # Hardhat configuration
│   └── package.json
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/                   # App Router pages
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── home/                 # Hackathon listings
│   │   │   ├── Createhack/           # Create hackathon
│   │   │   ├── CreateTeam/           # Create team
│   │   │   ├── jointeam/             # Join team
│   │   │   ├── submission/           # Submit project
│   │   │   ├── sponsors/             # Sponsor hackathon
│   │   │   ├── mint-nft/             # Mint participation NFT
│   │   │   ├── profile/              # User profile
│   │   │   └── api/                  # API routes
│   │   │       ├── auth/             # Authentication
│   │   │       ├── verify/           # GitHub verification
│   │   │       ├── teams/            # Team management
│   │   │       ├── analyze/          # AI analysis
│   │   │       └── github/           # GitHub integration
│   │   ├── components/            # React components
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   └── landing/              # Landing page sections
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useGitHubVerification.ts
│   │   │   └── useTeamManagement.ts
│   │   ├── lib/                   # Utility libraries
│   │   ├── store/                 # Zustand stores
│   │   ├── types/                 # TypeScript types
│   │   └── utils/                 # Helper functions
│   ├── public/                    # Static assets
│   ├── COLOR_SYSTEM.md            # Theme documentation
│   ├── IMPLEMENTATION_GUIDE.md    # Feature implementation guide
│   ├── next.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json                # Root package.json
└── README.md                   # This file
```

---

## 📜 Smart Contracts

### Contract Overview

#### 1. **GLYTCHCore.sol** (Main Contract)

The core contract manages the entire hackathon lifecycle.

**Key Functions:**
- `createHackathon()` - Create a new hackathon
- `sponsorHackathon()` - Sponsor a hackathon
- `createTeam()` - Create a team
- `joinTeam()` - Join existing team
- `registerTeam()` - Register team for hackathon
- `stakeForTeam()` - Stake ETH to participate
- `mintVotingTokens()` - Receive voting tokens
- `submitProject()` - Submit project with GitHub repo
- `submitJudgeScore()` - Judges submit scores
- `voteForProject()` - Participants vote
- `calculateFinalScore()` - Calculate weighted final score
- `distributeRewards()` - Distribute prize pool
- `mintParticipationNFT()` - Mint achievement NFT

**Constants:**
```solidity
MIN_CREATION_FEE = 0.02 ether
TOKENS_PER_PARTICIPANT = 100 * 10^18
PARTICIPANT_THRESHOLD_FOR_REFUND = 100
MIN_JUDGES = 5
MAX_TEAM_MEMBERS = 6

// Score weights
JUDGE_WEIGHT = 40%
PARTICIPANT_WEIGHT = 35%
AI_WEIGHT = 25%

// Distribution
WINNERS_PERCENTAGE = 80%
ORGANIZER_PERCENTAGE = 15%
PLATFORM_PERCENTAGE = 5%
```

#### 2. **GitHubVerifier.sol**

Handles cryptographic verification of GitHub accounts using EIP-712.

**Key Functions:**
- `verifyGitHub()` - Verify GitHub with signature
- `getNonce()` - Get current nonce
- `isVerified()` - Check verification status

**EIP-712 Domain:**
```solidity
name: "GLYTCH"
version: "1"
```

#### 3. **GLYTCHVotingToken.sol**

Soulbound ERC20 token for participant voting.

**Features:**
- Non-transferable (soulbound)
- Can only be minted and burned
- Equal voting power
- Prevents vote manipulation

#### 4. **GLYTCHParticipationNFT.sol**

ERC721 NFT representing hackathon participation.

**Features:**
- Includes final scores and rankings
- IPFS metadata
- Unique for each participant per hackathon
- Permanent achievement proof

### Contract Addresses (Sepolia Testnet)

```
GLYTCHCore:           0x1e483933e7e95Fbe51A579060b0F648Cd3f6ABc2
GitHubVerifier:       (deployed address)
ParticipationNFT:     (deployed address)
```

---

## 🎨 Frontend

### Pages

- **`/`** - Landing page with features and how it works
- **`/home`** - Browse all hackathons
- **`/home/[id]`** - Hackathon details and dashboard
- **`/Createhack`** - Create new hackathon
- **`/CreateTeam`** - Create new team
- **`/jointeam`** - Join existing team
- **`/my-teams`** - View your teams
- **`/submission/[hackathonId]`** - Submit project
- **`/participants/[id]`** - View participants and vote
- **`/results/[hackathonId]`** - View results and rankings
- **`/sponsors`** - Browse sponsors
- **`/sponsor/[id]`** - Sponsor a hackathon
- **`/mint-nft/[hackathonId]`** - Mint participation NFT
- **`/profile`** - User profile and verification
- **`/login`** - Authentication

### Key Features

#### Theme System
The frontend uses a comprehensive semantic color system:
- **Success (Green)**: Completed actions, verified status
- **Warning (Yellow)**: Pending states, stake required
- **Info (Blue)**: Informational content, neutral states
- **Destructive (Red)**: Errors, failed states
- **Primary (Brand Blue)**: Main actions, CTAs

See [`frontend/COLOR_SYSTEM.md`](frontend/COLOR_SYSTEM.md) for details.

#### Hooks

**`useGitHubVerification`**
```typescript
const { initiateGitHubLogin, isVerified, isLoading } = useGitHubVerification();
```

**`useTeamManagement`**
```typescript
const { createTeam, joinTeam, isLoading } = useTeamManagement();
```

---

## ⚙️ Configuration

### GitHub OAuth Setup

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
3. Copy Client ID and Client Secret to `.env.local`

### Pinata IPFS Setup

1. Sign up at https://pinata.cloud
2. Generate JWT token
3. Add to `.env.local` as `NEXT_PUBLIC_PINATA_JWT`

### Google Gemini AI Setup

1. Get API key from https://ai.google.dev/
2. Add to `.env.local` as `NEXT_PUBLIC_GEMINI_API_KEY`

---

## 💻 Development

### Run Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

### Deploy Contracts (Local)

```bash
cd contracts
npx hardhat node  # Terminal 1

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy Contracts (Sepolia)

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

### Run Frontend Development Server

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build Frontend

```bash
cd frontend
npm run build
npm run start
```

### Lint Frontend

```bash
cd frontend
npm run lint
```

---

## 🧪 Testing

### Smart Contract Tests

The test suite covers:
- Contract deployment
- GitHub verification (EIP-712)
- Hackathon creation and lifecycle
- Team creation and management
- Sponsorship system
- Staking and token minting
- Project submission and AI scoring
- Judge scoring
- Participant voting
- Final score calculation and ranking
- Reward distribution
- NFT minting
- Edge cases and security

Run tests:
```bash
cd contracts
npx hardhat test
```

With gas reporting:
```bash
npx hardhat test --reporter gas
```

With coverage:
```bash
npx hardhat coverage
```

### Frontend Testing

```bash
cd frontend
npm run test  # If tests are configured
```

---

## 🚀 Deployment

### Smart Contracts

1. **Set up environment variables** in `contracts/.env`

2. **Deploy to Sepolia:**
```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

3. **Verify contracts:**
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

4. **Update frontend** with deployed addresses in `frontend/.env.local`

### Frontend

#### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

#### Manual Deployment

```bash
cd frontend
npm run build
npm run start
```

---

## 📖 Usage Guide

### For Organizers

1. **Create Hackathon**
   - Navigate to `/Createhack`
   - Fill in details (name, dates, judges, prizes)
   - Pay creation fee (0.02 ETH)
   - Set sponsorship threshold and team limits

2. **Manage Hackathon**
   - Monitor registrations
   - Track sponsorships
   - View submissions
   - Calculate final scores
   - Distribute rewards

3. **Settle Fees**
   - If 100+ participants, get full refund
   - Otherwise, fee goes to platform

### For Participants

1. **Verify GitHub Account**
   - Connect wallet
   - Sign in with GitHub
   - Sign EIP-712 message
   - Link GitHub to wallet

2. **Create or Join Team**
   - Create team with name, description, image
   - Share join code with members
   - Or join existing team with code

3. **Register for Hackathon**
   - Browse hackathons at `/home`
   - Register your team
   - Stake required ETH
   - Receive voting tokens

4. **Submit Project**
   - Go to `/submission/[hackathonId]`
   - Enter GitHub repo URL
   - AI analyzes and scores code
   - Submit project

5. **Vote on Projects**
   - View all projects at `/participants/[id]`
   - Use voting tokens to vote
   - Support best projects

6. **Claim Rewards & NFT**
   - After judging completes
   - Stake refunded automatically
   - Winners receive prize share
   - Mint participation NFT at `/mint-nft/[hackathonId]`

### For Judges

1. **Score Projects**
   - Access hackathon dashboard
   - Review all submissions
   - Submit scores (0-100)
   - Scores contribute 40% to final

### For Sponsors

1. **Sponsor Hackathon**
   - Navigate to `/sponsors`
   - Choose hackathon
   - Add sponsorship details (name, logo)
   - Send ETH to prize pool

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

### Development Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Code Style

- Follow existing code patterns
- Use TypeScript for frontend
- Add comments for complex logic
- Write tests for new features
- Run linters before committing

### Commit Messages

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenZeppelin** - Secure smart contract libraries
- **Hardhat** - Ethereum development environment
- **Next.js** - React framework
- **ThirdWeb** - Web3 SDK
- **shadcn/ui** - UI components
- **Vercel** - Deployment platform

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/GIT-Pushers/Devs/issues)
- **Discussions**: [Join the conversation](https://github.com/GIT-Pushers/Devs/discussions)

---

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Core hackathon management
- ✅ GitHub verification
- ✅ Multi-layered scoring
- ✅ NFT participation proof
- ✅ Reward distribution

### Future Enhancements
- 🔜 Multi-chain support (Polygon, Arbitrum, Optimism)
- 🔜 DAO governance for platform decisions
- 🔜 Advanced analytics dashboard
- 🔜 Mobile app (iOS/Android)
- 🔜 Integration with more Git providers (GitLab, Bitbucket)
- 🔜 Video submission support
- 🔜 Live streaming integration
- 🔜 Mentorship program
- 🔜 Skill-based matching for teams
- 🔜 Recurring hackathons
- 🔜 Custom prize tracks

---

## 📊 Statistics

- **Smart Contract Lines**: ~1,200+ lines of Solidity
- **Test Coverage**: Comprehensive test suite
- **Networks Supported**: Ethereum, Sepolia, zkSync Era
- **Max Team Size**: 6 members
- **Minimum Judges**: 5 judges
- **Score Distribution**: 40% Judges, 35% Participants, 25% AI

---

<div align="center">

**Built with ❤️ by the HackX Team**

[⬆ Back to Top](#glytch---decentralized-hackathon-platform)

</div>
