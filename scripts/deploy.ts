import { ethers } from "hardhat";

// ── Deploy VeinVault to Ritual Testnet ───────────────────────────────────────
//
// Before running:
// 1. cp .env.example .env
// 2. Fill PRIVATE_KEY in .env (wallet must have testnet RITUAL)
// 3. Get testnet tokens: https://faucet.ritualfoundation.org
// 4. npx hardhat run scripts/deploy.ts --network ritual

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("─".repeat(50));
  console.log("Deploying VeinVault");
  console.log("Network  : Ritual Testnet (chainId 1979)");
  console.log("Deployer :", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance  :", ethers.formatEther(balance), "RITUAL");

  if (balance === 0n) {
    console.error("\n❌ Deployer has no RITUAL. Get tokens at https://faucet.ritualfoundation.org");
    process.exit(1);
  }

  console.log("─".repeat(50));
  console.log("Deploying contract...");

  const VeinVault = await ethers.getContractFactory("VeinVault");
  const veinVault = await VeinVault.deploy();

  console.log("Waiting for deployment tx...");
  await veinVault.waitForDeployment();

  const address = await veinVault.getAddress();
  const deployTx = veinVault.deploymentTransaction();

  console.log("─".repeat(50));
  console.log("✅ VeinVault deployed!");
  console.log("Contract address :", address);
  console.log("Tx hash          :", deployTx?.hash);
  console.log("Explorer         :", `https://explorer.ritualfoundation.org/address/${address}`);
  console.log("─".repeat(50));

  // ── IMPORTANT: deposit fees for AI inference ─────────────────────────────
  // The LLM precompile (0x0802) checks the RitualWallet balance of the
  // transaction sender. Fund it before calling triggerUnlockAndEvaluate.
  console.log("\n⚠️  Next step: Fund RitualWallet for inference fees");
  console.log("   Call depositForFees() on the contract with ~0.05 RITUAL");
  console.log("   Or use the 'Deposit 0.01 RITUAL for fees' button on the Dashboard.");
  console.log("─".repeat(50));

  // Update app/config.ts automatically
  const fs = await import("fs");
  const configPath = "./app/config.ts";
  const configContent = `// Configuration constants\nexport const VEIN_VAULT_ADDRESS = "${address}" as \`0x\${string}\`;\n`;
  fs.writeFileSync(configPath, configContent);
  console.log(`\n✅ app/config.ts updated with new address: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
