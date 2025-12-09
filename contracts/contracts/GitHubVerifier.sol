// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./interfaces/IGLYTCHStructs.sol";

/**
 * @title GitHubVerifier
 * @notice Handles GitHub account verification and linking to wallet addresses using EIP-712
 * @dev Uses EIP-712 typed structured data hashing and signing
 */
contract GitHubVerifier is EIP712, IGLYTCHStructs {
    using ECDSA for bytes32;

    // ============ Constants ============
    
    bytes32 public constant GITHUB_BINDING_TYPEHASH = 
        keccak256("GitHubBinding(string githubId,string githubUsername,address walletAddress,uint256 nonce,uint256 timestamp)");
    
    uint256 public constant SIGNATURE_EXPIRY = 600; // 10 minutes

    // ============ State Variables ============

    mapping(address => GitHubBinding) public githubBindings;
    mapping(string => address) public githubIdToAddress;
    mapping(address => uint256) public nonces;

    // ============ Constructor ============

    constructor() EIP712("GLYTCH", "1") {}

    // ============ External Functions ============

    /**
     * @notice Verify and link GitHub account to wallet using EIP-712 signature
     * @param githubId GitHub user ID
     * @param githubUsername GitHub username
     * @param nonce Unique nonce for this verification
     * @param timestamp Verification timestamp
     * @param signature EIP-712 signature
     */
    function verifyGitHub(
        string calldata githubId,
        string calldata githubUsername,
        uint256 nonce,
        uint256 timestamp,
        bytes calldata signature
    ) external {
        require(nonce == nonces[msg.sender], "Invalid nonce");
        require(block.timestamp - timestamp < SIGNATURE_EXPIRY, "Signature expired");
        require(!githubBindings[msg.sender].verified, "Already verified");
        require(githubIdToAddress[githubId] == address(0), "GitHub already linked");

        bytes32 structHash = keccak256(abi.encode(
            GITHUB_BINDING_TYPEHASH,
            keccak256(bytes(githubId)),
            keccak256(bytes(githubUsername)),
            msg.sender,
            nonce,
            timestamp
        ));

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        
        require(signer == msg.sender, "Invalid signature");

        githubBindings[msg.sender] = GitHubBinding({
            githubId: githubId,
            githubUsername: githubUsername,
            timestamp: block.timestamp,
            verified: true
        });

        githubIdToAddress[githubId] = msg.sender;
        nonces[msg.sender]++;

        emit GitHubVerified(msg.sender, githubId, githubUsername);
    }

    /**
     * @notice Get the current nonce for an address
     * @param user The address to check
     * @return The current nonce
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /**
     * @notice Check if an address has verified their GitHub
     * @param user The address to check
     * @return True if verified
     */
    function isGitHubVerified(address user) external view returns (bool) {
        return githubBindings[user].verified;
    }

    /**
     * @notice Get GitHub binding for an address
     * @param user The address to check
     * @return The GitHub binding
     */
    function getGitHubBinding(address user) external view returns (GitHubBinding memory) {
        return githubBindings[user];
    }

    /**
     * @notice Get wallet address for a GitHub ID
     * @param githubId The GitHub ID
     * @return The linked wallet address
     */
    function getWalletByGitHubId(string calldata githubId) external view returns (address) {
        return githubIdToAddress[githubId];
    }
}
