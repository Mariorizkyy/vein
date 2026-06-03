const { ethers } = require("hardhat");
async function main() {
  const block = await ethers.provider.getBlock("latest");
  console.log("Network block timestamp:", block.timestamp);
  console.log("Local JS timestamp:", Math.floor(Date.now() / 1000));
}
main().catch(console.error);
