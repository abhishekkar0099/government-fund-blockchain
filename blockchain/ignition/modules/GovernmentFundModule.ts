import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GovernmentFundModule = buildModule("GovernmentFundModule", (m) => {
  const governmentFund = m.contract(
    "contracts/GovernmentFund_v1.sol:GovernmentFund"
  );

  return { governmentFund };
});

export default GovernmentFundModule;