require("dotenv").config();

const { contract } = require("./blockchain");

async function main() {

    const projectId = 2;

    console.log("\n=================================");
    console.log("BLOCKCHAIN PROJECT AUDIT");
    console.log("=================================");

    const project = await contract.getProject(projectId);

    console.log("Blockchain ID:", project.id.toString());
    console.log("Project ID:", project.projectId);
    console.log("Name:", project.name);
    console.log("Allocated:", project.allocatedAmount.toString());
    console.log("Released:", project.releasedAmount.toString());
    console.log("Spent:", project.spentAmount.toString());

    const count =
        await contract.getTransactionCount(projectId);

    console.log("\nTransaction Count:", count.toString());

    for (
        let i = 0;
        i < Number(count);
        i++
    ) {

        const tx =
            await contract.getTransaction(
                projectId,
                i
            );

        console.log("\nTransaction #" + i);

        console.log(
            "Type:",
            tx.transactionType
        );

        console.log(
            "Amount:",
            tx.amount.toString()
        );

        console.log(
            "Performed By:",
            tx.performedBy
        );

        console.log(
            "Timestamp:",
            new Date(
                Number(tx.timestamp) * 1000
            ).toLocaleString()
        );
    }
}

main().catch(console.error);