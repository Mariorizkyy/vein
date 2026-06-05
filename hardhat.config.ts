import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // Ritual Chain uses Shanghai EVM — do NOT use Paris or later
      evmVersion: "shanghai",
    },
  },
  networks: {
    ritual: {
      // FIX: correct RPC URL from official Ritual docs
      url: process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org",
      chainId: 1979,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      // Ritual testnet can be slow — increase timeouts
      timeout: 120_000,
      gasPrice: "auto",
    },
  },
};

export default config;
