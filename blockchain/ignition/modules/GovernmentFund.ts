import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GovernmentFundModule = buildModule("GovernmentFundModule", (m) => {
    const governmentFund = m.contract("GovernmentFund");

    return {
        governmentFund,
    };
});

export default GovernmentFundModule;