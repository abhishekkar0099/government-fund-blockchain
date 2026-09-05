import { ethers } from "ethers";
import fs from "fs";
import "dotenv/config";

async function main() {

    console.log("=================================");
    console.log("GOVERNMENT FUND BLOCKCHAIN TEST");
    console.log("=================================");

    // -----------------------------------------
    // Environment variables
    // -----------------------------------------

    const rpcUrl = process.env.RPC_URL;

    const adminPrivateKey =
        process.env.ADMIN_PRIVATE_KEY;

    const officerPrivateKey =
        process.env.OFFICER_PRIVATE_KEY;

    const contractAddress =
        process.env.CONTRACT_ADDRESS;

    if (
        !rpcUrl ||
        !adminPrivateKey ||
        !officerPrivateKey ||
        !contractAddress
    ) {
        throw new Error(
            "Missing blockchain environment variables"
        );
    }

    // -----------------------------------------
    // Connect to local blockchain
    // -----------------------------------------

    const provider =
        new ethers.JsonRpcProvider(rpcUrl);

    // -----------------------------------------
    // Create wallets
    // -----------------------------------------

    const adminWallet =
    new ethers.Wallet(
        adminPrivateKey,
        provider
    );

    const officerWallet =
    new ethers.Wallet(
        officerPrivateKey,
        provider
    );

    const admin =
    new ethers.NonceManager(
        adminWallet
    );

    const officer =
    new ethers.NonceManager(
        officerWallet
    );
    console.log(
        "\nAdmin:",
        adminWallet.address
    );

    console.log(
        "Officer:",
        officerWallet.address
    );

    // -----------------------------------------
    // Load contract ABI
    // -----------------------------------------

    const artifactPath =
        "./artifacts/contracts/GovernmentFund.sol/GovernmentFund.json";

    if (!fs.existsSync(artifactPath)) {
        throw new Error(
            "GovernmentFund artifact not found. Run: npx hardhat compile"
        );
    }

    const artifact =
        JSON.parse(
            fs.readFileSync(
                artifactPath,
                "utf8"
            )
        );

    // -----------------------------------------
    // Connect contract using admin
    // -----------------------------------------

    const governmentFund =
        new ethers.Contract(
            contractAddress,
            artifact.abi,
            admin
        );

    console.log(
        "\nConnected to GovernmentFund"
    );

    console.log(
        "Contract:",
        contractAddress
    );

    // -----------------------------------------
    // 1. Add officer
    // -----------------------------------------

    console.log(
        "\n1. Adding officer..."
    );

    const addOfficerTx =
        await governmentFund.addOfficer(
            officerWallet.address
        );

    console.log(
        "Transaction:",
        addOfficerTx.hash
    );

    await addOfficerTx.wait();

    console.log(
        "Officer added successfully!"
    );

    // -----------------------------------------
    // 2. Create project
    // -----------------------------------------

    console.log(
        "\n2. Creating project..."
    );

    const createTx =
        await governmentFund.createProject(
            "PRJ007",
            "Village Road Development"
        );

    console.log(
        "Transaction:",
        createTx.hash
    );

    await createTx.wait();

    console.log(
        "Project created successfully!"
    );

    // -----------------------------------------
    // 3. Allocate funds
    // -----------------------------------------

    console.log(
        "\n3. Allocating ₹10,00,000..."
    );

    const allocationTx =
        await governmentFund.allocateFund(
            1,
            1000000
        );

    console.log(
        "Transaction:",
        allocationTx.hash
    );

    await allocationTx.wait();

    console.log(
        "₹10,00,000 allocated successfully!"
    );

    // -----------------------------------------
    // 4. Release funds
    // -----------------------------------------

    console.log(
        "\n4. Releasing ₹5,00,000..."
    );

    const releaseTx =
        await governmentFund.releaseFund(
            1,
            500000
        );

    console.log(
        "Transaction:",
        releaseTx.hash
    );

    await releaseTx.wait();

    console.log(
        "₹5,00,000 released successfully!"
    );

    // -----------------------------------------
    // 5. Officer records expense
    // -----------------------------------------

    console.log(
        "\n5. Officer recording ₹2,00,000 expense..."
    );

    const officerContract =
        governmentFund.connect(officerWallet    );

    const expenseTx =
        await officerContract.recordExpense(
            1,
            200000
        );

    console.log(
        "Transaction:",
        expenseTx.hash
    );

    await expenseTx.wait();

    console.log(
        "₹2,00,000 expense recorded successfully!"
    );

    // -----------------------------------------
    // 6. Read project
    // -----------------------------------------

    const project =
        await governmentFund.getProject(1);

    console.log(
        "\n================================="
    );

    console.log(
        "FINAL BLOCKCHAIN PROJECT"
    );

    console.log(
        "================================="
    );

    console.log(
        "Project ID:",
        project.projectId
    );

    console.log(
        "Name:",
        project.name
    );

    console.log(
        "Allocated: ₹",
        project.allocatedAmount.toString()
    );

    console.log(
        "Released: ₹",
        project.releasedAmount.toString()
    );

    console.log(
        "Spent: ₹",
        project.spentAmount.toString()
    );

    console.log(
        "Status:",
        project.status.toString()
    );

    console.log(
        "Active:",
        project.active
    );

    console.log(
        "\nBlockchain test completed successfully!"
    );
}

main().catch((error) => {

    console.error(
        "\n❌ ERROR:"
    );

    console.error(
        error.message || error
    );

    process.exitCode = 1;
});