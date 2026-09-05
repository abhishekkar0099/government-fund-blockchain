import { network } from "hardhat";

async function main() {
    console.log("Deploying GovernmentFund...");

    const { ethers } = await network.connect();

    const GovernmentFund =
        await ethers.getContractFactory("GovernmentFund");

    const governmentFund =
        await GovernmentFund.deploy();

    await governmentFund.waitForDeployment();

    const address =
        await governmentFund.getAddress();

    console.log("GovernmentFund deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});