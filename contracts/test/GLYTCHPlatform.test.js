const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("GLYTCH Platform - Complete Test Suite", function () {
  let glytchCore;
  let githubVerifier;
  let participationNFT;
  let votingToken;
  
  let owner;
  let organizer;
  let treasury;
  let judge1, judge2, judge3, judge4, judge5;
  let sponsor1, sponsor2;
  let user1, user2, user3, user4, user5, user6;
  
  let CREATION_FEE;
  let STAKE_AMOUNT;
  let SPONSOR_AMOUNT;
  let MIN_SPONSOR_THRESHOLD;

  beforeEach(async function () {
    [owner, organizer, treasury, judge1, judge2, judge3, judge4, judge5, 
     sponsor1, sponsor2, user1, user2, user3, user4, user5, user6] = await ethers.getSigners();

    // Initialize constants
    CREATION_FEE = ethers.parseEther("0.02");
    STAKE_AMOUNT = ethers.parseEther("0.1");
    SPONSOR_AMOUNT = ethers.parseEther("1.0");
    MIN_SPONSOR_THRESHOLD = ethers.parseEther("0.5");

    // Deploy GitHubVerifier
    const GitHubVerifier = await ethers.getContractFactory("GitHubVerifier");
    githubVerifier = await GitHubVerifier.deploy();
    await githubVerifier.waitForDeployment();

    // Deploy ParticipationNFT
    const ParticipationNFT = await ethers.getContractFactory("GLYTCHParticipationNFT");
    participationNFT = await ParticipationNFT.deploy();
    await participationNFT.waitForDeployment();

    // Deploy GLYTCHCore
    const GLYTCHCore = await ethers.getContractFactory("GLYTCHCore");
    glytchCore = await GLYTCHCore.deploy(
      treasury.address,
      await githubVerifier.getAddress(),
      await participationNFT.getAddress()
    );
    await glytchCore.waitForDeployment();

    // Set GLYTCHCore as NFT minter
    await participationNFT.setGLYTCHCore(await glytchCore.getAddress());
  });

  describe("1. Deployment", function () {
    it("Should set the correct platform treasury", async function () {
      expect(await glytchCore.platformTreasury()).to.equal(treasury.address);
    });

    it("Should set the correct GitHubVerifier", async function () {
      expect(await glytchCore.githubVerifier()).to.equal(await githubVerifier.getAddress());
    });

    it("Should set the correct ParticipationNFT", async function () {
      expect(await glytchCore.participationNFT()).to.equal(await participationNFT.getAddress());
    });

    it("Should initialize hackathonCount to 0", async function () {
      expect(await glytchCore.hackathonCount()).to.equal(0);
    });
  });

  describe("2. GitHub Verification", function () {
    it("Should verify GitHub account with valid signature", async function () {
      const nonce = await githubVerifier.getNonce(user1.address);
      const timestamp = Math.floor(Date.now() / 1000);
      
      const domain = {
        name: "GLYTCH",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await githubVerifier.getAddress()
      };

      const types = {
        GitHubBinding: [
          { name: "githubId", type: "string" },
          { name: "githubUsername", type: "string" },
          { name: "walletAddress", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "timestamp", type: "uint256" }
        ]
      };

      const value = {
        githubId: "123456",
        githubUsername: "testuser1",
        walletAddress: user1.address,
        nonce: nonce,
        timestamp: timestamp
      };

      const signature = await user1.signTypedData(domain, types, value);

      await expect(
        githubVerifier.connect(user1).verifyGitHub(
          "123456",
          "testuser1",
          nonce,
          timestamp,
          signature
        )
      ).to.emit(githubVerifier, "GitHubVerified")
        .withArgs(user1.address, "123456", "testuser1");

      expect(await githubVerifier.isGitHubVerified(user1.address)).to.be.true;
    });

    it("Should reject expired signature", async function () {
      const nonce = await githubVerifier.getNonce(user1.address);
      const timestamp = Math.floor(Date.now() / 1000) - 700; // 11+ minutes ago
      
      const domain = {
        name: "GLYTCH",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await githubVerifier.getAddress()
      };

      const types = {
        GitHubBinding: [
          { name: "githubId", type: "string" },
          { name: "githubUsername", type: "string" },
          { name: "walletAddress", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "timestamp", type: "uint256" }
        ]
      };

      const value = {
        githubId: "123456",
        githubUsername: "testuser1",
        walletAddress: user1.address,
        nonce: nonce,
        timestamp: timestamp
      };

      const signature = await user1.signTypedData(domain, types, value);

      await expect(
        githubVerifier.connect(user1).verifyGitHub(
          "123456",
          "testuser1",
          nonce,
          timestamp,
          signature
        )
      ).to.be.revertedWith("Signature expired");
    });

    it("Should reject duplicate GitHub ID", async function () {
      // First verification
      const nonce1 = await githubVerifier.getNonce(user1.address);
      const timestamp1 = Math.floor(Date.now() / 1000);
      
      const domain = {
        name: "GLYTCH",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await githubVerifier.getAddress()
      };

      const types = {
        GitHubBinding: [
          { name: "githubId", type: "string" },
          { name: "githubUsername", type: "string" },
          { name: "walletAddress", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "timestamp", type: "uint256" }
        ]
      };

      const value1 = {
        githubId: "123456",
        githubUsername: "testuser1",
        walletAddress: user1.address,
        nonce: nonce1,
        timestamp: timestamp1
      };

      const signature1 = await user1.signTypedData(domain, types, value1);

      await githubVerifier.connect(user1).verifyGitHub(
        "123456",
        "testuser1",
        nonce1,
        timestamp1,
        signature1
      );

      // Try to link same GitHub to different wallet
      const nonce2 = await githubVerifier.getNonce(user2.address);
      const timestamp2 = Math.floor(Date.now() / 1000);

      const value2 = {
        githubId: "123456",
        githubUsername: "testuser2",
        walletAddress: user2.address,
        nonce: nonce2,
        timestamp: timestamp2
      };

      const signature2 = await user2.signTypedData(domain, types, value2);

      await expect(
        githubVerifier.connect(user2).verifyGitHub(
          "123456",
          "testuser2",
          nonce2,
          timestamp2,
          signature2
        )
      ).to.be.revertedWith("GitHub already linked");
    });
  });

  describe("3. Hackathon Creation", function () {
    let judges;
    let futureTime;

    beforeEach(async function () {
      judges = [judge1.address, judge2.address, judge3.address, judge4.address, judge5.address];
      futureTime = await time.latest();
    });

    it("Should create a hackathon with correct parameters", async function () {
      const sponsorshipEnd = futureTime + 7 * 24 * 60 * 60; // 7 days
      const hackStart = sponsorshipEnd + 24 * 60 * 60; // 1 day after
      const hackEnd = hackStart + 7 * 24 * 60 * 60; // 7 days after

      await expect(
        glytchCore.connect(organizer).createHackathon(
          "ipfs://metadata",
          judges,
          sponsorshipEnd,
          hackStart,
          hackEnd,
          STAKE_AMOUNT,
          1,
          100,
          MIN_SPONSOR_THRESHOLD,
          { value: CREATION_FEE }
        )
      ).to.emit(glytchCore, "HackathonCreated")
        .withArgs(0, organizer.address, CREATION_FEE);

      const hackathon = await glytchCore.getHackathon(0);
      expect(hackathon.organizer).to.equal(organizer.address);
      expect(hackathon.stakeAmount).to.equal(STAKE_AMOUNT);
      expect(hackathon.minTeams).to.equal(1);
      expect(hackathon.maxTeams).to.equal(100);
    });

    it("Should reject creation with insufficient fee", async function () {
      const sponsorshipEnd = futureTime + 7 * 24 * 60 * 60;
      const hackStart = sponsorshipEnd + 24 * 60 * 60;
      const hackEnd = hackStart + 7 * 24 * 60 * 60;

      await expect(
        glytchCore.connect(organizer).createHackathon(
          "ipfs://metadata",
          judges,
          sponsorshipEnd,
          hackStart,
          hackEnd,
          STAKE_AMOUNT,
          1,
          100,
          MIN_SPONSOR_THRESHOLD,
          { value: ethers.parseEther("0.01") }
        )
      ).to.be.revertedWith("Insufficient creation fee");
    });

    it("Should reject creation with less than 5 judges", async function () {
      const sponsorshipEnd = futureTime + 7 * 24 * 60 * 60;
      const hackStart = sponsorshipEnd + 24 * 60 * 60;
      const hackEnd = hackStart + 7 * 24 * 60 * 60;

      await expect(
        glytchCore.connect(organizer).createHackathon(
          "ipfs://metadata",
          [judge1.address, judge2.address],
          sponsorshipEnd,
          hackStart,
          hackEnd,
          STAKE_AMOUNT,
          1,
          100,
          MIN_SPONSOR_THRESHOLD,
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Minimum 5 judges required");
    });

    it("Should reject creation with invalid time ranges", async function () {
      const sponsorshipEnd = futureTime + 7 * 24 * 60 * 60;
      const hackStart = sponsorshipEnd - 24 * 60 * 60; // Before sponsorship end
      const hackEnd = hackStart + 7 * 24 * 60 * 60;

      await expect(
        glytchCore.connect(organizer).createHackathon(
          "ipfs://metadata",
          judges,
          sponsorshipEnd,
          hackStart,
          hackEnd,
          STAKE_AMOUNT,
          1,
          100,
          MIN_SPONSOR_THRESHOLD,
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Invalid sponsorship end");
    });

    it("Should create voting token for hackathon", async function () {
      const sponsorshipEnd = futureTime + 7 * 24 * 60 * 60;
      const hackStart = sponsorshipEnd + 24 * 60 * 60;
      const hackEnd = hackStart + 7 * 24 * 60 * 60;

      await glytchCore.connect(organizer).createHackathon(
        "ipfs://metadata",
        judges,
        sponsorshipEnd,
        hackStart,
        hackEnd,
        STAKE_AMOUNT,
        1,
        100,
        MIN_SPONSOR_THRESHOLD,
        { value: CREATION_FEE }
      );

      const tokenAddress = await glytchCore.getVotingToken(0);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("4. Sponsorship", function () {
    let hackathonId;
    let judges;
    let sponsorshipEnd, hackStart, hackEnd;

    beforeEach(async function () {
      judges = [judge1.address, judge2.address, judge3.address, judge4.address, judge5.address];
      const futureTime = await time.latest();
      sponsorshipEnd = futureTime + 7 * 24 * 60 * 60;
      hackStart = sponsorshipEnd + 24 * 60 * 60;
      hackEnd = hackStart + 7 * 24 * 60 * 60;

      await glytchCore.connect(organizer).createHackathon(
        "ipfs://metadata",
        judges,
        sponsorshipEnd,
        hackStart,
        hackEnd,
        STAKE_AMOUNT,
        1,
        100,
        MIN_SPONSOR_THRESHOLD,
        { value: CREATION_FEE }
      );
      hackathonId = 0;
    });

    it("Should accept sponsorship during sponsorship phase", async function () {
      await expect(
        glytchCore.connect(sponsor1).sponsorHackathon(
          hackathonId,
          "ipfs://sponsor1",
          { value: SPONSOR_AMOUNT }
        )
      ).to.emit(glytchCore, "SponsorshipReceived")
        .withArgs(hackathonId, sponsor1.address, SPONSOR_AMOUNT);

      const hackathon = await glytchCore.getHackathon(hackathonId);
      expect(hackathon.totalSponsorshipAmount).to.equal(SPONSOR_AMOUNT);
    });

    it("Should reject sponsorship below minimum threshold", async function () {
      await expect(
        glytchCore.connect(sponsor1).sponsorHackathon(
          hackathonId,
          "ipfs://sponsor1",
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWith("Below minimum threshold");
    });

    it("Should reject sponsorship after phase ends", async function () {
      await time.increaseTo(sponsorshipEnd + 1);

      await expect(
        glytchCore.connect(sponsor1).sponsorHackathon(
          hackathonId,
          "ipfs://sponsor1",
          { value: SPONSOR_AMOUNT }
        )
      ).to.be.revertedWith("Not in sponsorship phase");
    });

    it("Should track multiple sponsors", async function () {
      await glytchCore.connect(sponsor1).sponsorHackathon(
        hackathonId,
        "ipfs://sponsor1",
        { value: SPONSOR_AMOUNT }
      );

      await glytchCore.connect(sponsor2).sponsorHackathon(
        hackathonId,
        "ipfs://sponsor2",
        { value: SPONSOR_AMOUNT }
      );

      const sponsors = await glytchCore.getSponsors(hackathonId);
      expect(sponsors.length).to.equal(2);
      expect(sponsors[0].sponsor).to.equal(sponsor1.address);
      expect(sponsors[1].sponsor).to.equal(sponsor2.address);
    });
  });

  describe("5. Team Management", function () {
    async function verifyGitHub(user, githubId, username) {
      const nonce = await githubVerifier.getNonce(user.address);
      const timestamp = await time.latest();
      
      const domain = {
        name: "GLYTCH",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await githubVerifier.getAddress()
      };

      const types = {
        GitHubBinding: [
          { name: "githubId", type: "string" },
          { name: "githubUsername", type: "string" },
          { name: "walletAddress", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "timestamp", type: "uint256" }
        ]
      };

      const value = {
        githubId: githubId,
        githubUsername: username,
        walletAddress: user.address,
        nonce: nonce,
        timestamp: timestamp
      };

      const signature = await user.signTypedData(domain, types, value);

      await githubVerifier.connect(user).verifyGitHub(
        githubId,
        username,
        nonce,
        timestamp,
        signature
      );
    }

    beforeEach(async function () {
      await verifyGitHub(user1, "111", "user1");
      await verifyGitHub(user2, "222", "user2");
      await verifyGitHub(user3, "333", "user3");
    });

    it("Should create a team", async function () {
      await expect(
        glytchCore.connect(user1).createTeam(
          "ipfs://team1",
          "secretcode123"
        )
      ).to.emit(glytchCore, "TeamCreated")
        .withArgs(0, user1.address);

      const team = await glytchCore.getTeam(0);
      expect(team.creator).to.equal(user1.address);
      expect(team.members.length).to.equal(1);
      expect(team.members[0]).to.equal(user1.address);
    });

    it("Should reject team creation without GitHub verification", async function () {
      await expect(
        glytchCore.connect(user4).createTeam(
          "ipfs://team1",
          "secretcode123"
        )
      ).to.be.revertedWith("GitHub not verified");
    });

    it("Should reject team creation with short join code", async function () {
      await expect(
        glytchCore.connect(user1).createTeam(
          "ipfs://team1",
          "short"
        )
      ).to.be.revertedWith("Join code too short");
    });

    it("Should allow joining team with correct code", async function () {
      await glytchCore.connect(user1).createTeam(
        "ipfs://team1",
        "secretcode123"
      );

      await expect(
        glytchCore.connect(user2).joinTeam(0, "secretcode123")
      ).to.emit(glytchCore, "TeamMemberAdded")
        .withArgs(0, user2.address);

      const team = await glytchCore.getTeam(0);
      expect(team.members.length).to.equal(2);
    });

    it("Should reject joining team with wrong code", async function () {
      await glytchCore.connect(user1).createTeam(
        "ipfs://team1",
        "secretcode123"
      );

      await expect(
        glytchCore.connect(user2).joinTeam(0, "wrongcode")
      ).to.be.revertedWith("Invalid code");
    });

    it("Should reject duplicate team members", async function () {
      await glytchCore.connect(user1).createTeam(
        "ipfs://team1",
        "secretcode123"
      );

      await expect(
        glytchCore.connect(user1).joinTeam(0, "secretcode123")
      ).to.be.revertedWith("Already a member");
    });
  });

  describe("6. Team Registration & Staking", function () {
    let hackathonId;
    let teamId;
    let sponsorshipEnd, hackStart, hackEnd;

    async function verifyGitHub(user, githubId, username) {
      const nonce = await githubVerifier.getNonce(user.address);
      const timestamp = await time.latest();
      
      const domain = {
        name: "GLYTCH",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await githubVerifier.getAddress()
      };

      const types = {
        GitHubBinding: [
          { name: "githubId", type: "string" },
          { name: "githubUsername", type: "string" },
          { name: "walletAddress", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "timestamp", type: "uint256" }
        ]
      };

      const value = {
        githubId: githubId,
        githubUsername: username,
        walletAddress: user.address,
        nonce: nonce,
        timestamp: timestamp
      };

      const signature = await user.signTypedData(domain, types, value);

      await githubVerifier.connect(user).verifyGitHub(
        githubId,
        username,
        nonce,
        timestamp,
        signature
      );
    }

    beforeEach(async function () {
      // Verify users
      await verifyGitHub(user1, "111", "user1");
      await verifyGitHub(user2, "222", "user2");
      await verifyGitHub(user3, "333", "user3");

      // Create hackathon
      const judges = [judge1.address, judge2.address, judge3.address, judge4.address, judge5.address];
      const futureTime = await time.latest();
      sponsorshipEnd = futureTime + 7 * 24 * 60 * 60;
      hackStart = sponsorshipEnd + 24 * 60 * 60;
      hackEnd = hackStart + 7 * 24 * 60 * 60;

      await glytchCore.connect(organizer).createHackathon(
        "ipfs://metadata",
        judges,
        sponsorshipEnd,
        hackStart,
        hackEnd,
        STAKE_AMOUNT,
        1,
        100,
        MIN_SPONSOR_THRESHOLD,
        { value: CREATION_FEE }
      );
      hackathonId = 0;

      // Create team
      await glytchCore.connect(user1).createTeam("ipfs://team1", "secretcode123");
      await glytchCore.connect(user2).joinTeam(0, "secretcode123");
      teamId = 0;

      // Move past sponsorship phase
      await time.increaseTo(sponsorshipEnd + 1);
    });

    it("Should register team for hackathon", async function () {
      await expect(
        glytchCore.connect(user1).registerTeam(hackathonId, teamId)
      ).to.emit(glytchCore, "TeamRegistered")
        .withArgs(hackathonId, teamId);

      const registration = await glytchCore.getTeamRegistration(hackathonId, teamId);
      expect(registration.registered).to.be.true;
    });

    it("Should reject registration during sponsorship phase", async function () {
      // Create new hackathon
      const futureTime = await time.latest();
      const newSponsorshipEnd = futureTime + 7 * 24 * 60 * 60;
      const newHackStart = newSponsorshipEnd + 24 * 60 * 60;
      const newHackEnd = newHackStart + 7 * 24 * 60 * 60;

      const judges = [judge1.address, judge2.address, judge3.address, judge4.address, judge5.address];
      await glytchCore.connect(organizer).createHackathon(
        "ipfs://metadata2",
        judges,
        newSponsorshipEnd,
        newHackStart,
        newHackEnd,
        STAKE_AMOUNT,
        1,
        100,
        MIN_SPONSOR_THRESHOLD,
        { value: CREATION_FEE }
      );

      await expect(
        glytchCore.connect(user1).registerTeam(1, teamId)
      ).to.be.revertedWith("Sponsorship phase not ended");
    });

    it("Should stake for team", async function () {
      await glytchCore.connect(user1).registerTeam(hackathonId, teamId);

      await expect(
        glytchCore.connect(user1).stakeForTeam(hackathonId, teamId, { value: STAKE_AMOUNT })
      ).to.emit(glytchCore, "TeamStaked")
        .withArgs(hackathonId, teamId, user1.address, STAKE_AMOUNT);

      const registration = await glytchCore.getTeamRegistration(hackathonId, teamId);
      expect(registration.staked).to.be.true;
      expect(registration.staker).to.equal(user1.address);
    });

    it("Should mint voting tokens after staking", async function () {
      await glytchCore.connect(user1).registerTeam(hackathonId, teamId);
      await glytchCore.connect(user1).stakeForTeam(hackathonId, teamId, { value: STAKE_AMOUNT });

      const tokenAddress = await glytchCore.getVotingToken(hackathonId);
      const votingToken = await ethers.getContractAt("GLYTCHVotingToken", tokenAddress);

      const tokensPerParticipant = ethers.parseEther("100");
      expect(await votingToken.balanceOf(user1.address)).to.equal(tokensPerParticipant);
      expect(await votingToken.balanceOf(user2.address)).to.equal(tokensPerParticipant);
    });

    it("Should reject staking with incorrect amount", async function () {
      await glytchCore.connect(user1).registerTeam(hackathonId, teamId);

      await expect(
        glytchCore.connect(user1).stakeForTeam(hackathonId, teamId, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Incorrect stake amount");
    });
  });

  describe("7. Complete Workflow Test", function () {
    let hackathonId;
    let team1Id, team2Id;
    let sponsorshipEnd, hackStart, hackEnd;

    async function verifyGitHub(user, githubId, username) {
      const nonce = await githubVerifier.getNonce(user.address);
      const timestamp = await time.latest();
      
      const domain = {
        name: "GLYTCH",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await githubVerifier.getAddress()
      };

      const types = {
        GitHubBinding: [
          { name: "githubId", type: "string" },
          { name: "githubUsername", type: "string" },
          { name: "walletAddress", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "timestamp", type: "uint256" }
        ]
      };

      const value = {
        githubId,
        githubUsername: username,
        walletAddress: user.address,
        nonce,
        timestamp
      };

      const signature = await user.signTypedData(domain, types, value);

      await githubVerifier.connect(user).verifyGitHub(githubId, username, nonce, timestamp, signature);
    }

    beforeEach(async function () {
      // Verify all users
      await verifyGitHub(user1, "111", "user1");
      await verifyGitHub(user2, "222", "user2");
      await verifyGitHub(user3, "333", "user3");
      await verifyGitHub(user4, "444", "user4");
      await verifyGitHub(user5, "555", "user5");
      await verifyGitHub(user6, "666", "user6");

      // Create hackathon
      const judges = [judge1.address, judge2.address, judge3.address, judge4.address, judge5.address];
      const futureTime = await time.latest();
      sponsorshipEnd = futureTime + 7 * 24 * 60 * 60;
      hackStart = sponsorshipEnd + 24 * 60 * 60;
      hackEnd = hackStart + 7 * 24 * 60 * 60;

      await glytchCore.connect(organizer).createHackathon(
        "ipfs://metadata",
        judges,
        sponsorshipEnd,
        hackStart,
        hackEnd,
        STAKE_AMOUNT,
        1,
        100,
        MIN_SPONSOR_THRESHOLD,
        { value: CREATION_FEE }
      );
      hackathonId = 0;

      // Add sponsorship
      await glytchCore.connect(sponsor1).sponsorHackathon(hackathonId, "ipfs://sponsor1", { value: ethers.parseEther("10") });
      await glytchCore.connect(sponsor2).sponsorHackathon(hackathonId, "ipfs://sponsor2", { value: ethers.parseEther("5") });

      // Move past sponsorship
      await time.increaseTo(sponsorshipEnd + 1);

      // Create teams
      await glytchCore.connect(user1).createTeam("ipfs://team1", "secretcode1");
      team1Id = 0;
      await glytchCore.connect(user2).joinTeam(team1Id, "secretcode1");

      await glytchCore.connect(user3).createTeam("ipfs://team2", "secretcode2");
      team2Id = 1;
      await glytchCore.connect(user4).joinTeam(team2Id, "secretcode2");

      await glytchCore.connect(user5).createTeam("ipfs://team3", "secretcode3");
      team3Id = 2;
      await glytchCore.connect(user6).joinTeam(team3Id, "secretcode3");

      // Register teams
      await glytchCore.connect(user1).registerTeam(hackathonId, team1Id);
      await glytchCore.connect(user3).registerTeam(hackathonId, team2Id);
      await glytchCore.connect(user5).registerTeam(hackathonId, team3Id);

      // Stake
      await glytchCore.connect(user1).stakeForTeam(hackathonId, team1Id, { value: STAKE_AMOUNT });
      await glytchCore.connect(user3).stakeForTeam(hackathonId, team2Id, { value: STAKE_AMOUNT });
      await glytchCore.connect(user5).stakeForTeam(hackathonId, team3Id, { value: STAKE_AMOUNT });

      // Move to hackathon period
      await time.increaseTo(hackStart + 1);

      // Submit projects
      await glytchCore.connect(user1).submitProject(hackathonId, team1Id, ethers.id("repo1"), 85);
      await glytchCore.connect(user3).submitProject(hackathonId, team2Id, ethers.id("repo2"), 90);
      await glytchCore.connect(user5).submitProject(hackathonId, team3Id, ethers.id("repo3"), 75);

      // Move past hackathon end
      await time.increaseTo(hackEnd + 1);
    });

    it("Should complete full judging and scoring workflow", async function () {
      // Judges score
      await glytchCore.connect(judge1).submitJudgeScore(hackathonId, team1Id, 80);
      await glytchCore.connect(judge2).submitJudgeScore(hackathonId, team1Id, 85);
      await glytchCore.connect(judge1).submitJudgeScore(hackathonId, team2Id, 95);
      await glytchCore.connect(judge2).submitJudgeScore(hackathonId, team2Id, 90);
      await glytchCore.connect(judge1).submitJudgeScore(hackathonId, team3Id, 70);

      // Participants vote
      const tokenAddress = await glytchCore.getVotingToken(hackathonId);
      const votingToken = await ethers.getContractAt("GLYTCHVotingToken", tokenAddress);

      await glytchCore.connect(user1).voteForTeam(hackathonId, team2Id, ethers.parseEther("50"));
      await glytchCore.connect(user2).voteForTeam(hackathonId, team2Id, ethers.parseEther("50"));
      await glytchCore.connect(user3).voteForTeam(hackathonId, team1Id, ethers.parseEther("50"));

      // Calculate final scores
      await glytchCore.calculateFinalScores(hackathonId);

      const team1Reg = await glytchCore.getTeamRegistration(hackathonId, team1Id);
      const team2Reg = await glytchCore.getTeamRegistration(hackathonId, team2Id);

      expect(team1Reg.scoreFinalized).to.be.true;
      expect(team2Reg.scoreFinalized).to.be.true;
      expect(team2Reg.finalScore).to.be.greaterThan(team1Reg.finalScore);
    });

    it("Should distribute rewards correctly", async function () {
      // Judges score
      await glytchCore.connect(judge1).submitJudgeScore(hackathonId, team1Id, 80);
      await glytchCore.connect(judge1).submitJudgeScore(hackathonId, team2Id, 95);
      await glytchCore.connect(judge1).submitJudgeScore(hackathonId, team3Id, 70);

      // Calculate scores
      await glytchCore.calculateFinalScores(hackathonId);

      // Get initial balances
      const initialBalance1 = await ethers.provider.getBalance(user1.address);
      const initialBalance3 = await ethers.provider.getBalance(user3.address);

      // Distribute rewards
      await glytchCore.distributeRewards(hackathonId);

      // Check balances increased
      const finalBalance1 = await ethers.provider.getBalance(user1.address);
      const finalBalance3 = await ethers.provider.getBalance(user3.address);

      expect(finalBalance3).to.be.greaterThan(initialBalance3);
    });

    it("Should refund stakes", async function () {
      // Complete workflow
      await glytchCore.connect(judge1).submitJudgeScore(hackathonId, team1Id, 80);
      await glytchCore.calculateFinalScores(hackathonId);
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await glytchCore.connect(user1).refundStake(hackathonId, team1Id);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance + gasCost).to.be.closeTo(initialBalance + STAKE_AMOUNT, ethers.parseEther("0.001"));
    });
  });
});
