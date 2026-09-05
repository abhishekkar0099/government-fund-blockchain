require("dotenv").config();

const {
    createBlockchainProject
} = require("./services/blockchainService");

async function test() {

    try {

        console.log(
            "Testing backend → blockchain..."
        );

        const result =
            await createBlockchainProject(
                "PRJ008",
                "Village Drainage System"
            );

        console.log(
            "Blockchain connection successful!"
        );

        console.log(
            "Transaction Hash:",
            result.transactionHash
        );

        console.log(
            "Block Number:",
            result.blockNumber
        );

    } catch (error) {

        console.error(
            "Blockchain test failed:"
        );

        console.error(
            error.message
        );
    }
}

test();