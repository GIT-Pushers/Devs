// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IGLYTCHStructs
 * @notice Shared data structures and interfaces for GLYTCH platform
 */
interface IGLYTCHStructs {
    
    struct Hackathon {
        uint256 id;
        address organizer;
        uint256 sponsorshipStart;
        uint256 sponsorshipEnd;
        uint256 hackStart;
        uint256 hackEnd;
        uint256 stakeAmount;
        uint32 minTeams;
        uint32 maxTeams;
        uint256 creationFee;
        bool creationFeeRefunded;
        address[] judges;
        string metadataURI; // IPFS hash
        uint256 totalSponsorshipAmount;
        uint256 minSponsorshipThreshold;
        bool finalized;
    }

    struct Team {
        uint256 id;
        address creator;
        string metadataURI; // IPFS: name, image, description
        address[] members;
        bytes32 joinCodeHash;
        bool exists;
    }

    struct TeamRegistration {
        bool registered;
        bool staked;
        address staker;
        bool tokensMinted;
        bool projectSubmitted;
        bytes32 repoHash;
        uint256 aiScore;
        uint256 judgeScore;
        uint256 participantScore;
        uint256 finalScore;
        uint256 ranking;
        bool scoreFinalized;
    }

    struct Sponsor {
        address sponsor;
        uint256 amount;
        string metadataURI; // IPFS: name, logo, description
    }

    struct GitHubBinding {
        string githubId;
        string githubUsername;
        uint256 timestamp;
        bool verified;
    }

    // Events
    event HackathonCreated(uint256 indexed id, address indexed organizer, uint256 creationFee);
    event SponsorshipReceived(uint256 indexed hackathonId, address indexed sponsor, uint256 amount);
    event TeamCreated(uint256 indexed teamId, address indexed creator);
    event TeamMemberAdded(uint256 indexed teamId, address indexed member);
    event TeamRegistered(uint256 indexed hackathonId, uint256 indexed teamId);
    event TeamStaked(uint256 indexed hackathonId, uint256 indexed teamId, address indexed staker, uint256 amount);
    event VotingTokensMinted(uint256 indexed hackathonId, uint256 indexed teamId, address[] members);
    event ProjectSubmitted(uint256 indexed hackathonId, uint256 indexed teamId, bytes32 repoHash, uint256 aiScore);
    event JudgeScoreSubmitted(uint256 indexed hackathonId, uint256 indexed teamId, address indexed judge, uint256 score);
    event ParticipantVoted(uint256 indexed hackathonId, uint256 indexed teamId, address indexed voter, uint256 amount);
    event FinalScoreCalculated(uint256 indexed hackathonId, uint256 indexed teamId, uint256 finalScore, uint256 ranking);
    event RewardsDistributed(uint256 indexed hackathonId, uint256[] teamIds, uint256[] amounts);
    event StakeRefunded(uint256 indexed hackathonId, uint256 indexed teamId, address indexed recipient, uint256 amount);
    event CreationFeeSettled(uint256 indexed hackathonId, uint256 refund, uint256 platformFee);
    event GitHubVerified(address indexed wallet, string githubId, string githubUsername);
    event ParticipationNFTMinted(uint256 indexed hackathonId, uint256 indexed teamId, address indexed participant, uint256 tokenId);
}
