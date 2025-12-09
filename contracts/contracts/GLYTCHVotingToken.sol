// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GLYTCHVotingToken
 * @notice Non-transferable ERC20 token for hackathon voting
 * @dev Soulbound token - can only be minted and burned, not transferred
 */
contract GLYTCHVotingToken is ERC20, Ownable {
    
    // ============ Constructor ============
    
    constructor(string memory name, string memory symbol) 
        ERC20(name, symbol) 
        Ownable(msg.sender) 
    {}

    // ============ External Functions ============

    /**
     * @notice Mint tokens to an address
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from an address
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    // ============ Internal Functions ============

    /**
     * @dev Override to make token non-transferable (soulbound)
     * Only allows minting (from zero address) and burning (to zero address)
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Transfer disabled: soulbound token");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Transfer disabled: soulbound token");
    }
}
