// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IGLYTCHStructs.sol";

/**
 * @title GLYTCHParticipationNFT
 * @notice NFT representing hackathon participation with final scores and rankings
 * @dev Minted after hackathon completion with full metadata
 */
contract GLYTCHParticipationNFT is ERC721URIStorage, Ownable, IGLYTCHStructs {
    
    // ============ State Variables ============
    
    uint256 private _tokenIdCounter;
    address public glytchCore;

    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public minted; // hackathonId => teamId => user => minted

    // ============ Constructor ============

    constructor() 
        ERC721("GLYTCH Participation", "GPART") 
        Ownable(msg.sender) 
    {}

    // ============ Admin Functions ============

    /**
     * @notice Set the GLYTCH Core contract address
     * @param _core Address of the core contract
     */
    function setGLYTCHCore(address _core) external onlyOwner {
        require(_core != address(0), "Invalid core address");
        glytchCore = _core;
    }

    // ============ External Functions ============

    /**
     * @notice Mint participation NFT for a hackathon participant
     * @param hackathonId The hackathon ID
     * @param teamId The team ID
     * @param participant The participant address
     * @param tokenURI The metadata URI (IPFS)
     * @return tokenId The minted token ID
     */
    function mintParticipationNFT(
        uint256 hackathonId,
        uint256 teamId,
        address participant,
        string calldata tokenURI
    ) external returns (uint256) {
        require(msg.sender == glytchCore, "Only GLYTCH Core");
        require(!minted[hackathonId][teamId][participant], "Already minted");

        uint256 tokenId = _tokenIdCounter++;
        
        _mint(participant, tokenId);
        _setTokenURI(tokenId, tokenURI);

        minted[hackathonId][teamId][participant] = true;

        emit ParticipationNFTMinted(hackathonId, teamId, participant, tokenId);

        return tokenId;
    }

    /**
     * @notice Check if a participant has minted their NFT
     * @param hackathonId The hackathon ID
     * @param teamId The team ID
     * @param participant The participant address
     * @return True if NFT has been minted
     */
    function hasMintedNFT(
        uint256 hackathonId,
        uint256 teamId,
        address participant
    ) external view returns (bool) {
        return minted[hackathonId][teamId][participant];
    }

    /**
     * @notice Get the total number of NFTs minted
     * @return The total count
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
