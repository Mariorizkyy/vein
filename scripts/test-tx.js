const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const VeinVault = await ethers.getContractAt("VeinVault", "0x180f28CE1E02c34438b1B01311E4aA39499Ac460");
  
  console.log("Testing createCapsule...");
  const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const tx = await VeinVault.createCapsule("Test", unlockTime, "test-content");
  console.log("Tx sent:", tx.hash);
  await tx.wait();
  console.log("Tx confirmed!");
}
main().catch(console.error);
