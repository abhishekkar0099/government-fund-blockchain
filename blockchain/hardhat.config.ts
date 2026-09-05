import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatIgnition from "@nomicfoundation/hardhat-ignition";

export default defineConfig({
  plugins: [
    hardhatEthers,
    hardhatIgnition,
  ],

  solidity: {
    version: "0.8.28",
  },
});