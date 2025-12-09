// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GitHubVerifier.sol";
import "./GLYTCHVotingToken.sol";
import "./GLYTCHParticipationNFT.sol";
import "./interfaces/IGLYTCHStructs.sol";

/**
 * @title GLYTCHCore
 * @notice Main contract for decentralized hackathon platform
 * @dev Manages hackathon lifecycle, teams, submissions, judging, and rewards
 */
contract GLYTCHCore is Ownable, ReentrancyGuard, IGLYTCHStructs {

    // ============ Constants ============

    uint256 public constant MIN_CREATION_FEE = 0.02 ether;
    uint256 public constant TOKENS_PER_PARTICIPANT = 100 * 10**18;
    uint256 public constant PARTICIPANT_THRESHOLD_FOR_REFUND = 100;
    uint256 public constant MIN_JUDGES = 5;
    uint256 public constant MAX_TEAM_MEMBERS = 6;
    
    // Score weights (out of 100)
    uint256 public constant JUDGE_WEIGHT = 40;
    uint256 public constant PARTICIPANT_WEIGHT = 35;
    uint256 public constant AI_WEIGHT = 25;

    // Distribution percentages
    uint256 public constant WINNERS_PERCENTAGE = 80;
    uint256 public constant ORGANIZER_PERCENTAGE = 15;
    uint256 public constant PLATFORM_PERCENTAGE = 5;

    // ============ State Variables ============

    address public platformTreasury;
    GitHubVerifier public githubVerifier;
    GLYTCHParticipationNFT public participationNFT;
    
    uint256 public hackathonCount;
    uint256 public nextTeamId;

    // Mappings
    mapping(uint256 => Hackathon) public hackathons;
    mapping(uint256 => Sponsor[]) public hackathonSponsors;
    mapping(uint256 => mapping(uint256 => TeamRegistration)) public registrations; // hackathonId => teamId => registration
    mapping(uint256 => Team) public teams;
    mapping(address => uint256[]) public userTeams;
    mapping(uint256 => uint256[]) public hackathonTeams; // hackathonId => teamIds[]
    
    // Voting tokens per hackathon
    mapping(uint256 => GLYTCHVotingToken) public hackathonVotingToken;
    
    // Judge scores
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public judgeScores; // hid => tid => judge => score
    mapping(uint256 => mapping(uint256 => uint256)) public judgeScoreCount; // hid => tid => count
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasJudgeScored; // hid => tid => judge => scored

    // Participant voting
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public participantVotes; // hid => voter => teamId => amount

    // ============ Constructor ============

    constructor(
        address _platformTreasury,
        address _githubVerifier,
        address _participationNFT
    ) Ownable(msg.sender) {
        require(_platformTreasury != address(0), "Invalid treasury");
        require(_githubVerifier != address(0), "Invalid verifier");
        require(_participationNFT != address(0), "Invalid NFT");
        
        platformTreasury = _platformTreasury;
        githubVerifier = GitHubVerifier(_githubVerifier);
        participationNFT = GLYTCHParticipationNFT(_participationNFT);
    }

    // ============ Hackathon Management ============

    /**
     * @notice Creates a new hackathon
     * @param metadataURI IPFS URI containing hackathon details
     * @param judges Array of judge addresses (minimum 5)
     * @param sponsorshipEnd Timestamp when sponsorship phase ends
     * @param hackStart Timestamp when hackathon starts
     * @param hackEnd Timestamp when hackathon ends
     * @param stakeAmount ETH amount teams must stake
     * @param minTeams Minimum number of teams
     * @param maxTeams Maximum number of teams
     * @param minSponsorshipThreshold Minimum amount for sponsorship
     */
    function createHackathon(
        string calldata metadataURI,
        address[] calldata judges,
        uint256 sponsorshipEnd,
        uint256 hackStart,
        uint256 hackEnd,
        uint256 stakeAmount,
        uint32 minTeams,
        uint32 maxTeams,
        uint256 minSponsorshipThreshold
    ) external payable returns (uint256 id) {
        require(msg.value >= MIN_CREATION_FEE, "Insufficient creation fee");
        require(judges.length >= MIN_JUDGES, "Minimum 5 judges required");
        require(minTeams > 0 && minTeams < maxTeams, "Invalid team limits");
        require(block.timestamp < sponsorshipEnd, "Sponsorship end must be future");
        require(sponsorshipEnd < hackStart, "Invalid sponsorship end");
        require(hackStart < hackEnd, "Invalid hackathon duration");
        require(stakeAmount > 0, "Stake must be positive");

        // Validate judges are unique
        for (uint256 i = 0; i < judges.length; i++) {
            require(judges[i] != address(0), "Invalid judge address");
            for (uint256 j = i + 1; j < judges.length; j++) {
                require(judges[i] != judges[j], "Duplicate judge");
            }
        }

        id = hackathonCount++;

        Hackathon storage h = hackathons[id];
        h.id = id;
        h.organizer = msg.sender;
        h.sponsorshipStart = block.timestamp;
        h.sponsorshipEnd = sponsorshipEnd;
        h.hackStart = hackStart;
        h.hackEnd = hackEnd;
        h.stakeAmount = stakeAmount;
        h.minTeams = minTeams;
        h.maxTeams = maxTeams;
        h.creationFee = msg.value;
        h.judges = judges;
        h.metadataURI = metadataURI;
        h.minSponsorshipThreshold = minSponsorshipThreshold;
        h.finalized = false;

        // Create voting token for this hackathon
        string memory tokenName = string(abi.encodePacked("GLYTCH Vote #", _toString(id)));
        string memory tokenSymbol = string(abi.encodePacked("GVOTE", _toString(id)));
        hackathonVotingToken[id] = new GLYTCHVotingToken(tokenName, tokenSymbol);

        emit HackathonCreated(id, msg.sender, msg.value);
    }

    /**
     * @notice Sponsor a hackathon during sponsorship phase
     * @param hackathonId ID of the hackathon
     * @param metadataURI IPFS URI with sponsor details
     */
    function sponsorHackathon(
        uint256 hackathonId,
        string calldata metadataURI
    ) external payable {
        Hackathon storage h = hackathons[hackathonId];
        require(h.id == hackathonId, "Hackathon does not exist");
        require(block.timestamp >= h.sponsorshipStart && block.timestamp <= h.sponsorshipEnd, "Not in sponsorship phase");
        require(msg.value >= h.minSponsorshipThreshold, "Below minimum threshold");

        hackathonSponsors[hackathonId].push(Sponsor({
            sponsor: msg.sender,
            amount: msg.value,
            metadataURI: metadataURI
        }));

        h.totalSponsorshipAmount += msg.value;

        emit SponsorshipReceived(hackathonId, msg.sender, msg.value);
    }

    // ============ Team Management ============

    /**
     * @notice Create a new team
     * @param metadataURI IPFS URI with team details
     * @param joinCode Secret code for teammates to join
     */
    function createTeam(
        string calldata metadataURI,
        string calldata joinCode
    ) external returns (uint256 teamId) {
        require(githubVerifier.isGitHubVerified(msg.sender), "GitHub not verified");
        require(bytes(joinCode).length >= 8, "Join code too short");

        teamId = nextTeamId++;
        bytes32 codeHash = keccak256(abi.encodePacked(joinCode));

        Team storage team = teams[teamId];
        team.id = teamId;
        team.creator = msg.sender;
        team.metadataURI = metadataURI;
        team.joinCodeHash = codeHash;
        team.exists = true;
        team.members.push(msg.sender);

        userTeams[msg.sender].push(teamId);

        emit TeamCreated(teamId, msg.sender);
        emit TeamMemberAdded(teamId, msg.sender);
    }

    /**
     * @notice Join an existing team using join code
     * @param teamId ID of the team
     * @param joinCode Secret join code
     */
    function joinTeam(uint256 teamId, string calldata joinCode) external {
        require(githubVerifier.isGitHubVerified(msg.sender), "GitHub not verified");
        Team storage team = teams[teamId];
        require(team.exists, "Team does not exist");
        require(team.members.length < MAX_TEAM_MEMBERS, "Team full");
        require(keccak256(abi.encodePacked(joinCode)) == team.joinCodeHash, "Invalid code");

        // Check if already member
        for (uint256 i = 0; i < team.members.length; i++) {
            require(team.members[i] != msg.sender, "Already a member");
        }

        team.members.push(msg.sender);
        userTeams[msg.sender].push(teamId);

        emit TeamMemberAdded(teamId, msg.sender);
    }

    // ============ Hackathon Registration & Staking ============

    /**
     * @notice Register team for a hackathon
     * @param hackathonId The hackathon ID
     * @param teamId The team ID
     */
    function registerTeam(uint256 hackathonId, uint256 teamId) external {
        Hackathon storage h = hackathons[hackathonId];
        Team storage team = teams[teamId];
        
        require(h.id == hackathonId, "Hackathon does not exist");
        require(team.exists, "Team does not exist");
        require(block.timestamp > h.sponsorshipEnd, "Sponsorship phase not ended");
        require(block.timestamp < h.hackStart, "Registration closed");
        require(hackathonTeams[hackathonId].length < h.maxTeams, "Max teams reached");
        
        // Check if caller is team member
        bool isMember = false;
        for (uint256 i = 0; i < team.members.length; i++) {
            if (team.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a team member");
        
        TeamRegistration storage reg = registrations[hackathonId][teamId];
        require(!reg.registered, "Already registered");

        reg.registered = true;
        hackathonTeams[hackathonId].push(teamId);

        emit TeamRegistered(hackathonId, teamId);
    }

    /**
     * @notice Stake ETH for team participation
     * @param hackathonId The hackathon ID
     * @param teamId The team ID
     */
    function stakeForTeam(uint256 hackathonId, uint256 teamId) external payable nonReentrant {
        Hackathon storage h = hackathons[hackathonId];
        Team storage team = teams[teamId];
        TeamRegistration storage reg = registrations[hackathonId][teamId];
        
        require(h.id == hackathonId, "Hackathon does not exist");
        require(team.exists, "Team does not exist");
        require(reg.registered, "Team not registered");
        require(!reg.staked, "Already staked");
        require(msg.value == h.stakeAmount, "Incorrect stake amount");
        require(block.timestamp < h.hackStart, "Hackathon already started");
        
        // Check if caller is team member
        bool isMember = false;
        for (uint256 i = 0; i < team.members.length; i++) {
            if (team.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a team member");

        reg.staked = true;
        reg.staker = msg.sender;

        emit TeamStaked(hackathonId, teamId, msg.sender, msg.value);

        // Mint voting tokens to all team members
        _mintVotingTokens(hackathonId, teamId);
    }

    /**
     * @dev Internal function to mint voting tokens
     */
    function _mintVotingTokens(uint256 hackathonId, uint256 teamId) internal {
        TeamRegistration storage reg = registrations[hackathonId][teamId];
        require(!reg.tokensMinted, "Tokens already minted");

        Team storage team = teams[teamId];
        GLYTCHVotingToken token = hackathonVotingToken[hackathonId];

        for (uint256 i = 0; i < team.members.length; i++) {
            token.mint(team.members[i], TOKENS_PER_PARTICIPANT);
        }

        reg.tokensMinted = true;

        emit VotingTokensMinted(hackathonId, teamId, team.members);
    }

    // ============ Project Submission ============

    /**
     * @notice Submit project (called by backend after AI analysis)
     * @param hackathonId The hackathon ID
     * @param teamId The team ID
     * @param repoHash Hash of the repository
     * @param aiScore AI-generated score (0-100)
     */
    function submitProject(
        uint256 hackathonId,
        uint256 teamId,
        bytes32 repoHash,
        uint256 aiScore
    ) external {
        Hackathon storage h = hackathons[hackathonId];
        Team storage team = teams[teamId];
        TeamRegistration storage reg = registrations[hackathonId][teamId];
        
        require(h.id == hackathonId, "Hackathon does not exist");
        require(team.exists, "Team does not exist");
        require(reg.staked, "Team not staked");
        require(!reg.projectSubmitted, "Already submitted");
        require(block.timestamp >= h.hackStart && block.timestamp <= h.hackEnd, "Not in submission period");
        require(aiScore <= 100, "Invalid AI score");
        
        // Check if caller is team member
        bool isMember = false;
        for (uint256 i = 0; i < team.members.length; i++) {
            if (team.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a team member");

        reg.projectSubmitted = true;
        reg.repoHash = repoHash;
        reg.aiScore = aiScore;

        emit ProjectSubmitted(hackathonId, teamId, repoHash, aiScore);
    }

    // ============ Judging System ============

    /**
     * @notice Judge submits score for a team
     * @param hackathonId The hackathon ID
     * @param teamId The team ID
     * @param score Score out of 100
     */
    function submitJudgeScore(
        uint256 hackathonId,
        uint256 teamId,
        uint256 score
    ) external {
        Hackathon storage h = hackathons[hackathonId];
        TeamRegistration storage reg = registrations[hackathonId][teamId];
        
        require(h.id == hackathonId, "Hackathon does not exist");
        require(reg.projectSubmitted, "Project not submitted");
        require(block.timestamp > h.hackEnd, "Hackathon not ended");
        require(score <= 100, "Score must be <= 100");
        require(_isJudge(hackathonId, msg.sender), "Not a judge");
        require(!hasJudgeScored[hackathonId][teamId][msg.sender], "Already scored");

        judgeScores[hackathonId][teamId][msg.sender] = score;
        hasJudgeScored[hackathonId][teamId][msg.sender] = true;
        judgeScoreCount[hackathonId][teamId]++;

        emit JudgeScoreSubmitted(hackathonId, teamId, msg.sender, score);
    }

    /**
     * @notice Participant votes for a team
     * @param hackathonId The hackathon ID
     * @param teamId The team ID to vote for
     * @param amount Amount of voting tokens to use
     */
    function voteForTeam(
        uint256 hackathonId,
        uint256 teamId,
        uint256 amount
    ) external {
        Hackathon storage h = hackathons[hackathonId];
        TeamRegistration storage reg = registrations[hackathonId][teamId];
        
        require(h.id == hackathonId, "Hackathon does not exist");
        require(reg.projectSubmitted, "Project not submitted");
        require(block.timestamp > h.hackEnd, "Hackathon not ended");
        require(amount > 0, "Amount must be positive");
        
        // Check voter is not voting for their own team
        Team storage votedTeam = teams[teamId];
        for (uint256 i = 0; i < votedTeam.members.length; i++) {
            require(votedTeam.members[i] != msg.sender, "Cannot vote for own team");
        }

        GLYTCHVotingToken token = hackathonVotingToken[hackathonId];
        require(token.balanceOf(msg.sender) >= amount, "Insufficient tokens");

        token.burnFrom(msg.sender, amount);
        participantVotes[hackathonId][msg.sender][teamId] += amount;
        reg.participantScore += amount;

        emit ParticipantVoted(hackathonId, teamId, msg.sender, amount);
    }

    /**
     * @notice Calculate final scores for all teams (called after judging period)
     * @param hackathonId The hackathon ID
     */
    function calculateFinalScores(uint256 hackathonId) external {
        Hackathon storage h = hackathons[hackathonId];
        require(h.id == hackathonId, "Hackathon does not exist");
        require(block.timestamp > h.hackEnd, "Hackathon not ended");
        require(!h.finalized, "Already finalized");

        uint256[] memory teamIds = hackathonTeams[hackathonId];
        require(teamIds.length > 0, "No teams registered");

        uint256[] memory scores = new uint256[](teamIds.length);
        uint256 maxParticipantScore = 0;

        // First pass: find max participant score for normalization
        for (uint256 i = 0; i < teamIds.length; i++) {
            TeamRegistration storage reg = registrations[hackathonId][teamIds[i]];
            if (reg.projectSubmitted && reg.participantScore > maxParticipantScore) {
                maxParticipantScore = reg.participantScore;
            }
        }

        // Second pass: calculate weighted scores
        for (uint256 i = 0; i < teamIds.length; i++) {
            uint256 teamId = teamIds[i];
            TeamRegistration storage reg = registrations[hackathonId][teamId];
            
            if (!reg.projectSubmitted) {
                scores[i] = 0;
                reg.finalScore = 0;
                continue;
            }

            // Calculate average judge score (default 100 if judge didn't score)
            uint256 judgeScore = _calculateJudgeScore(hackathonId, teamId);
            
            // Normalize participant score to 0-100
            uint256 normalizedParticipantScore = maxParticipantScore > 0 
                ? (reg.participantScore * 100) / maxParticipantScore 
                : 0;

            // Calculate weighted final score
            uint256 finalScore = (
                (judgeScore * JUDGE_WEIGHT) +
                (normalizedParticipantScore * PARTICIPANT_WEIGHT) +
                (reg.aiScore * AI_WEIGHT)
            ) / 100;

            reg.judgeScore = judgeScore;
            reg.finalScore = finalScore;
            reg.scoreFinalized = true;
            scores[i] = finalScore;

            emit FinalScoreCalculated(hackathonId, teamId, finalScore, 0);
        }

        _assignRankings(hackathonId, teamIds, scores);
        h.finalized = true;
    }

    /**
     * @dev Internal function to calculate judge score
     */
    function _calculateJudgeScore(uint256 hackathonId, uint256 teamId) internal view returns (uint256) {
        Hackathon storage h = hackathons[hackathonId];
        uint256 totalScore = 0;
        uint256 scoredCount = judgeScoreCount[hackathonId][teamId];

        if (scoredCount == 0) {
            // No judges scored, return default 100
            return 100;
        }

        // Sum up all judge scores
        for (uint256 i = 0; i < h.judges.length; i++) {
            address judge = h.judges[i];
            if (hasJudgeScored[hackathonId][teamId][judge]) {
                totalScore += judgeScores[hackathonId][teamId][judge];
            } else {
                // Judge didn't score, add default 100
                totalScore += 100;
            }
        }

        return totalScore / h.judges.length;
    }

    /**
     * @dev Internal function to assign rankings
     */
    function _assignRankings(
        uint256 hackathonId,
        uint256[] memory teamIds,
        uint256[] memory scores
    ) internal {
        // Bubble sort for simplicity (optimize for production with better algorithm)
        uint256 n = teamIds.length;
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (scores[j] < scores[j + 1]) {
                    // Swap scores
                    (scores[j], scores[j + 1]) = (scores[j + 1], scores[j]);
                    // Swap team IDs
                    (teamIds[j], teamIds[j + 1]) = (teamIds[j + 1], teamIds[j]);
                }
            }
        }

        // Assign rankings
        for (uint256 i = 0; i < teamIds.length; i++) {
            registrations[hackathonId][teamIds[i]].ranking = i + 1;
        }
    }

    // ============ Reward Distribution ============

    /**
     * @notice Distribute rewards to winners
     * @param hackathonId The hackathon ID
     */
    function distributeRewards(uint256 hackathonId) external nonReentrant {
        Hackathon storage h = hackathons[hackathonId];
        require(h.id == hackathonId, "Hackathon does not exist");
        require(h.finalized, "Scores not finalized");
        require(h.totalSponsorshipAmount > 0, "No sponsorship funds");

        uint256 totalFunds = h.totalSponsorshipAmount;
        uint256 winnersPool = (totalFunds * WINNERS_PERCENTAGE) / 100;
        uint256 organizerFee = (totalFunds * ORGANIZER_PERCENTAGE) / 100;
        uint256 platformFee = (totalFunds * PLATFORM_PERCENTAGE) / 100;

        // Transfer organizer fee
        (bool successOrg, ) = payable(h.organizer).call{value: organizerFee}("");
        require(successOrg, "Organizer transfer failed");

        // Transfer platform fee
        (bool successPlatform, ) = payable(platformTreasury).call{value: platformFee}("");
        require(successPlatform, "Platform transfer failed");

        // Distribute winners pool
        _distributeWinnersPool(hackathonId, winnersPool);

        // Mark sponsorship as distributed
        h.totalSponsorshipAmount = 0;
    }

    /**
     * @dev Internal function to distribute winners pool
     */
    function _distributeWinnersPool(uint256 hackathonId, uint256 winnersPool) internal {
        uint256[] memory teamIds = hackathonTeams[hackathonId];
        
        // Prize distribution: 50% for 1st, 30% for 2nd, 20% for 3rd
        uint256 firstPrize = (winnersPool * 50) / 100;
        uint256 secondPrize = (winnersPool * 30) / 100;
        uint256 thirdPrize = (winnersPool * 20) / 100;

        uint256[] memory prizes = new uint256[](3);
        prizes[0] = firstPrize;
        prizes[1] = secondPrize;
        prizes[2] = thirdPrize;

        uint256[] memory winnerTeamIds = new uint256[](3);

        for (uint256 rank = 1; rank <= 3 && rank <= teamIds.length; rank++) {
            uint256 teamId = _getTeamByRanking(hackathonId, rank);
            winnerTeamIds[rank - 1] = teamId;
            
            if (teamId > 0) {
                _transferToTeam(hackathonId, teamId, prizes[rank - 1]);
            }
        }

        emit RewardsDistributed(hackathonId, winnerTeamIds, prizes);
    }

    /**
     * @dev Internal function to get team by ranking
     */
    function _getTeamByRanking(uint256 hackathonId, uint256 ranking) internal view returns (uint256) {
        uint256[] memory teamIds = hackathonTeams[hackathonId];
        for (uint256 i = 0; i < teamIds.length; i++) {
            if (registrations[hackathonId][teamIds[i]].ranking == ranking) {
                return teamIds[i];
            }
        }
        return 0;
    }

    /**
     * @dev Internal function to transfer funds to team
     */
    function _transferToTeam(uint256 /* hackathonId */, uint256 teamId, uint256 amount) internal {
        Team storage team = teams[teamId];
        uint256 amountPerMember = amount / team.members.length;
        
        for (uint256 i = 0; i < team.members.length; i++) {
            (bool success, ) = payable(team.members[i]).call{value: amountPerMember}("");
            require(success, "Transfer to team member failed");
        }
    }

    // ============ Stake Refund ============

    /**
     * @notice Refund stake to team after hackathon
     * @param hackathonId The hackathon ID
     * @param teamId The team ID
     */
    function refundStake(uint256 hackathonId, uint256 teamId) external nonReentrant {
        Hackathon storage h = hackathons[hackathonId];
        TeamRegistration storage reg = registrations[hackathonId][teamId];
        
        require(h.id == hackathonId, "Hackathon does not exist");
        require(h.finalized, "Hackathon not finalized");
        require(reg.staked, "Not staked");
        require(msg.sender == reg.staker, "Only staker can refund");

        uint256 stakeAmount = h.stakeAmount;
        reg.staked = false;

        (bool success, ) = payable(reg.staker).call{value: stakeAmount}("");
        require(success, "Stake refund failed");

        emit StakeRefunded(hackathonId, teamId, reg.staker, stakeAmount);
    }

    // ============ Creation Fee Settlement ============

    /**
     * @notice Settle creation fee after hackathon
     * @param hackathonId The hackathon ID
     */
    function settleCreationFee(uint256 hackathonId) external nonReentrant {
        Hackathon storage h = hackathons[hackathonId];
        
        require(h.id == hackathonId, "Hackathon does not exist");
        require(msg.sender == h.organizer, "Only organizer");
        require(h.finalized, "Hackathon not finalized");
        require(!h.creationFeeRefunded, "Already refunded");

        uint256 participantCount = _getParticipantCount(hackathonId);
        uint256 refund = 0;
        uint256 platformFee = 0;

        if (participantCount >= PARTICIPANT_THRESHOLD_FOR_REFUND) {
            refund = (h.creationFee * 80) / 100;
            platformFee = h.creationFee - refund;
        } else {
            platformFee = h.creationFee;
        }

        h.creationFeeRefunded = true;

        if (refund > 0) {
            (bool successRefund, ) = payable(h.organizer).call{value: refund}("");
            require(successRefund, "Refund transfer failed");
        }

        (bool successPlatform, ) = payable(platformTreasury).call{value: platformFee}("");
        require(successPlatform, "Platform fee transfer failed");

        emit CreationFeeSettled(hackathonId, refund, platformFee);
    }

    /**
     * @dev Internal function to get participant count
     */
    function _getParticipantCount(uint256 hackathonId) internal view returns (uint256) {
        uint256[] memory teamIds = hackathonTeams[hackathonId];
        uint256 count = 0;
        
        for (uint256 i = 0; i < teamIds.length; i++) {
            Team storage team = teams[teamIds[i]];
            count += team.members.length;
        }
        
        return count;
    }

    // ============ NFT Minting ============

    /**
     * @notice Mint participation NFT after hackathon completion
     * @param hackathonId The hackathon ID
     * @param teamId The team ID
     * @param metadataURI The NFT metadata URI
     */
    function mintParticipationNFT(
        uint256 hackathonId,
        uint256 teamId,
        string calldata metadataURI
    ) external {
        Hackathon storage h = hackathons[hackathonId];
        Team storage team = teams[teamId];
        TeamRegistration storage reg = registrations[hackathonId][teamId];
        
        require(h.id == hackathonId, "Hackathon does not exist");
        require(h.finalized, "Hackathon not finalized");
        require(team.exists, "Team does not exist");
        require(reg.scoreFinalized, "Score not finalized");
        
        // Check if caller is team member
        bool isMember = false;
        for (uint256 i = 0; i < team.members.length; i++) {
            if (team.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a team member");

        participationNFT.mintParticipationNFT(hackathonId, teamId, msg.sender, metadataURI);
    }

    // ============ View Functions ============

    function getHackathon(uint256 id) external view returns (Hackathon memory) {
        return hackathons[id];
    }

    function getTeam(uint256 id) external view returns (Team memory) {
        return teams[id];
    }

    function getTeamRegistration(uint256 hackathonId, uint256 teamId) 
        external view returns (TeamRegistration memory) {
        return registrations[hackathonId][teamId];
    }

    function getHackathonTeams(uint256 hackathonId) external view returns (uint256[] memory) {
        return hackathonTeams[hackathonId];
    }

    function getSponsors(uint256 hackathonId) external view returns (Sponsor[] memory) {
        return hackathonSponsors[hackathonId];
    }

    function getUserTeams(address user) external view returns (uint256[] memory) {
        return userTeams[user];
    }

    function _isJudge(uint256 hackathonId, address judge) internal view returns (bool) {
        Hackathon storage h = hackathons[hackathonId];
        for (uint256 i = 0; i < h.judges.length; i++) {
            if (h.judges[i] == judge) {
                return true;
            }
        }
        return false;
    }

    function isJudge(uint256 hackathonId, address judge) external view returns (bool) {
        return _isJudge(hackathonId, judge);
    }

    function getParticipantCount(uint256 hackathonId) external view returns (uint256) {
        return _getParticipantCount(hackathonId);
    }

    function getVotingToken(uint256 hackathonId) external view returns (address) {
        return address(hackathonVotingToken[hackathonId]);
    }

    // ============ Admin Functions ============

    function updatePlatformTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        platformTreasury = newTreasury;
    }

    function updateGitHubVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid address");
        githubVerifier = GitHubVerifier(newVerifier);
    }

    function updateParticipationNFT(address newNFT) external onlyOwner {
        require(newNFT != address(0), "Invalid address");
        participationNFT = GLYTCHParticipationNFT(newNFT);
    }

    // ============ Utility Functions ============

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ============ Emergency Functions ============

    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdraw failed");
    }

    receive() external payable {}
}
