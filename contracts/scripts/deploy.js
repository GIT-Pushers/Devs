const hre = require("hardhat");

async function main() {
  console.log(" Starting Hackathon Platform deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    (await hre.ethers.provider.getBalance(deployer.address)).toString()
  );
  console.log("");

  // Deploy GitHubVerifier
  console.log(" Deploying GitHubVerifier...");
  const GitHubVerifier = await hre.ethers.getContractFactory("GitHubVerifier");
  const githubVerifier = await GitHubVerifier.deploy();
  await githubVerifier.waitForDeployment();
  const githubVerifierAddress = await githubVerifier.getAddress();
  console.log(" GitHubVerifier deployed to:", githubVerifierAddress);
  console.log("");

  // Deploy HackathonParticipationNFT
  console.log(" Deploying HackathonParticipationNFT...");
  const ParticipationNFT = await hre.ethers.getContractFactory(
    "HackathonParticipationNFT"
  );
  const participationNFT = await ParticipationNFT.deploy();
  await participationNFT.waitForDeployment();
  const participationNFTAddress = await participationNFT.getAddress();
  console.log(
    " HackathonParticipationNFT deployed to:",
    participationNFTAddress
  );
  console.log("");

  // Set platform treasury (you can change this to your desired address)
  const platformTreasury = deployer.address; // Using deployer as treasury for now
  console.log(" Platform Treasury:", platformTreasury);
  console.log("");

  // Deploy HackathonPlatformCore
  console.log(" Deploying HackathonPlatformCore...");
  const HackathonPlatformCore = await hre.ethers.getContractFactory(
    "HackathonPlatformCore"
  );
  const hackathonPlatformCore = await HackathonPlatformCore.deploy(
    platformTreasury,
    githubVerifierAddress,
    participationNFTAddress
  );
  await hackathonPlatformCore.waitForDeployment();
  const hackathonPlatformCoreAddress = await hackathonPlatformCore.getAddress();
  console.log(
    "HackathonPlatformCore deployed to:",
    hackathonPlatformCoreAddress
  );
  console.log("");

  // Set HackathonPlatformCore as NFT minter
  console.log(" Setting HackathonPlatformCore as NFT minter...");
  const tx = await participationNFT.setHackathonPlatformCore(
    hackathonPlatformCoreAddress
  );
  await tx.wait();
  console.log(" NFT minter configured");
  console.log("");

  // Summary
  console.log("====================================");
  console.log(" DEPLOYMENT SUMMARY");
  console.log("====================================");
  console.log("GitHubVerifier:", githubVerifierAddress);
  console.log("ParticipationNFT:", participationNFTAddress);
  console.log("GLYTCHCore:", glytchCoreAddress);
  console.log("Platform Treasury:", platformTreasury);
  console.log("====================================");
  console.log("");
  console.log(" All contracts deployed successfully!");
  console.log("");
  console.log("Next steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Update frontend with contract addresses");
  console.log("3. Test the platform with a test hackathon");
  console.log("");

  return {
    githubVerifier: githubVerifierAddress,
    participationNFT: participationNFTAddress,
    glytchCore: glytchCoreAddress,
    platformTreasury: platformTreasury,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
