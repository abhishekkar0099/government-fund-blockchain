import { network } from "hardhat";

async function main() {

    const { ethers } = await network.connect();

    const contractAddress =
        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    const contract =
        await ethers.getContractAt(
            "GovernmentFund",
            contractAddress
        );

    console.log("Contract:", contractAddress);

    // Check project 1
    try {

        const project1 =
            await contract.getProject(1);

        console.log("\nPROJECT 1:");
        console.log("ID:", project1.id.toString());
        console.log("Project ID:", project1.projectId);
        console.log("Name:", project1.name);

    } catch (error) {

        console.log(
            "\nPROJECT 1: DOES NOT EXIST"
        );

    }


    // Check project 5
    try {

        const project5 =
            await contract.getProject(5);

        console.log("\nPROJECT 5:");
        console.log("ID:", project5.id.toString());
        console.log("Project ID:", project5.projectId);
        console.log("Name:", project5.name);

    } catch (error) {

        console.log(
            "\nPROJECT 5: DOES NOT EXIST"
        );

    }


    // Check transaction count for project 5
    try {

        const count =
            await contract.getTransactionCount(5);

        console.log(
            "\nPROJECT 5 TRANSACTION COUNT:",
            count.toString()
        );

    } catch (error) {

        console.log(
            "\nPROJECT 5 TRANSACTION CHECK FAILED:",
            error.message
        );

    }

}

main().catch((error) => {

    console.error(error);

    process.exitCode = 1;

});