import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

export default defineConfig({
    plugins: [hardhatEthers],

    solidity: {
        version: "0.8.28"
    },

    networks: {
        localhost: {
            type: "http",
            url: "http://127.0.0.1:8545"
        },

        sepolia: {
            type: "http",
            url: process.env.SEPOLIA_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 11155111
        }
    }
});