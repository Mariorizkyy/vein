import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying VeinVault with the account:", deployer.address);

  const VeinVault = await ethers.getContractFactory("VeinVault");
  const veinVault = await VeinVault.deploy();

  await veinVault.waitForDeployment();
  const address = await veinVault.getAddress();
  
  console.log("VeinVault deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
