const hre = require("hardhat");

async function main() {
  console.log(" Starting GLYTCH Platform deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("");

  // Deploy GitHubVerifier
  console.log(" Deploying GitHubVerifier...");
  const GitHubVerifier = await hre.ethers.getContractFactory("GitHubVerifier");
  const githubVerifier = await GitHubVerifier.deploy();
  await githubVerifier.waitForDeployment();
  const githubVerifierAddress = await githubVerifier.getAddress();
  console.log(" GitHubVerifier deployed to:", githubVerifierAddress);
  console.log("");

  // Deploy GLYTCHParticipationNFT
  console.log(" Deploying GLYTCHParticipationNFT...");
  const ParticipationNFT = await hre.ethers.getContractFactory("GLYTCHParticipationNFT");
  const participationNFT = await ParticipationNFT.deploy();
  await participationNFT.waitForDeployment();
  const participationNFTAddress = await participationNFT.getAddress();
  console.log(" GLYTCHParticipationNFT deployed to:", participationNFTAddress);
  console.log("");

  // Set platform treasury (you can change this to your desired address)
  const platformTreasury = deployer.address; // Using deployer as treasury for now
  console.log(" Platform Treasury:", platformTreasury);
  console.log("");

  // Deploy GLYTCHCore
  console.log(" Deploying GLYTCHCore...");
  const GLYTCHCore = await hre.ethers.getContractFactory("GLYTCHCore");
  const glytchCore = await GLYTCHCore.deploy(
    platformTreasury,
    githubVerifierAddress,
    participationNFTAddress
  );
  await glytchCore.waitForDeployment();
  const glytchCoreAddress = await glytchCore.getAddress();
  console.log("GLYTCHCore deployed to:", glytchCoreAddress);
  console.log("");

  // Set GLYTCHCore as NFT minter
  console.log(" Setting GLYTCHCore as NFT minter...");
  const tx = await participationNFT.setGLYTCHCore(glytchCoreAddress);
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
    platformTreasury: platformTreasury
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
