# GitHub Verification & Team Management Implementation

## 🎯 Overview

This implementation adds GitHub OAuth verification with EIP-712 signatures and team management to your Hackathon Platform.

## 📁 Files Created

### API Routes
- `src/app/api/auth/github/callback/route.ts` - GitHub OAuth callback handler
- `src/app/api/verify/prepare/route.ts` - Prepare EIP-712 verification data
- `src/app/api/verify/complete/route.ts` - Complete signature verification
- `src/app/api/teams/metadata/route.ts` - Upload team metadata to IPFS

### Hooks
- `src/hooks/useGitHubVerification.ts` - GitHub verification logic
- `src/hooks/useTeamManagement.ts` - Team creation/join logic

### Pages
- `src/app/verify-wallet/page.tsx` - Wallet verification UI
- `src/app/teams/create/page.tsx` - Create team UI
- `src/app/teams/join/page.tsx` - Join team UI

### Components
- `src/components/GitHubVerifyButton.tsx` - GitHub verification button

### Types & Config
- `src/types/verification.ts` - TypeScript types
- `src/app/constants/contracts.ts` - Updated with all contract addresses

## 🚀 Usage

### 1. GitHub Verification Flow

```typescript
import GitHubVerifyButton from '@/components/GitHubVerifyButton';

// In your component
<GitHubVerifyButton />
```

Or manually trigger:
```typescript
import { useGitHubVerification } from '@/hooks/useGitHubVerification';

const { initiateGitHubLogin } = useGitHubVerification();
// Call initiateGitHubLogin() when ready
```

**Flow:**
1. User clicks "Verify with GitHub"
2. Redirects to GitHub OAuth
3. Returns to `/verify-wallet` page
4. User signs EIP-712 message
5. Transaction submitted to blockchain
6. User verified ✓

### 2. Create Team

```typescript
import { useTeamManagement } from '@/hooks/useTeamManagement';

const { createTeam, isLoading } = useTeamManagement();

await createTeam({
  teamName: "My Team",
  teamDescription: "Team description",
  joinCode: "secretcode123", // min 8 chars
  teamImage: imageFile, // optional
});
```

Navigate users to: `/teams/create`

### 3. Join Team

```typescript
import { useTeamManagement } from '@/hooks/useTeamManagement';

const { joinTeam, isLoading } = useTeamManagement();

await joinTeam(teamId, "secretcode123");
```

Navigate users to: `/teams/join`

## 🔑 Environment Variables

Already configured in your `.env`:
```bash
GITHUB_CLIENT_ID=Ov23liCkXZseCFrUikRp
GITHUB_CLIENT_SECRET=46288476442c13e109b8d17c03fa15f5bff7c995
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liCkXZseCFrUikRp
```

## 📋 Contract Addresses (Sepolia)

```typescript
HACKATHON_PLATFORM_CORE: "0x1e483933e7e95Fbe51A579060b0F648Cd3f6ABc2"
GITHUB_VERIFIER: "0x62F7448dd19DF9059B55F4fE670c41021D002fEf"
PARTICIPATION_NFT: "0x7ef4c37f227195d121CB5D4e8972D003052A49aD"
```

## 🎨 Integration Examples

### In your existing pages:

```typescript
// Check if user is verified
import { readContract } from 'thirdweb';
import { githubVerifierContract } from '@/app/constants/contracts';

const isVerified = await readContract({
  contract: githubVerifierContract,
  method: 'function isGitHubVerified(address user) view returns (bool)',
  params: [userAddress],
});

if (!isVerified) {
  // Redirect to /verify-wallet
  router.push('/verify-wallet');
}
```

### Add navigation links:

```typescript
// In your nav/menu
<Link href="/teams/create">Create Team</Link>
<Link href="/teams/join">Join Team</Link>
<Link href="/verify-wallet">Verify GitHub</Link>
```

## ✅ Features

- ✅ GitHub OAuth integration
- ✅ EIP-712 signature verification
- ✅ On-chain verification storage
- ✅ Team creation with IPFS metadata
- ✅ Secure join code system (hashed on-chain)
- ✅ Solo participation support (create team with just yourself)
- ✅ Image upload to IPFS via Pinata
- ✅ Full TypeScript support
- ✅ Error handling & loading states
- ✅ Thirdweb integration

## 🔒 Security

- Join codes hashed with keccak256 (not stored in plaintext)
- EIP-712 signatures prevent replay attacks
- Nonce-based verification (10 min expiry)
- Session cookies (httpOnly, secure)
- GitHub OAuth with official flow

## 🧪 Testing

1. **Test GitHub verification:**
   - Go to `/verify-wallet` (or trigger GitHubVerifyButton)
   - Complete OAuth flow
   - Sign message
   - Check transaction on Sepolia Etherscan

2. **Test team creation:**
   - Go to `/teams/create`
   - Fill form with join code (8+ chars)
   - Submit and check transaction

3. **Test joining:**
   - Go to `/teams/join`
   - Enter team ID and join code
   - Verify on-chain

## 🎯 Next Steps

1. Add team creation/join buttons to your dashboard
2. Display user's verification status
3. Show user's teams
4. Add team management features (view members, leave team, etc.)
5. Integrate with hackathon registration flow

## 📝 Notes

- All existing functionality is preserved
- Uses your existing UI components
- Compatible with your current thirdweb setup
- No breaking changes to existing code
- Can coexist with your current auth system (better-auth)
