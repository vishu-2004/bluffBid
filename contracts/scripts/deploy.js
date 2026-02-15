const hre = require("hardhat");

async function main() {
    console.log("Deploying BluffBid contract...");

    // Get the contract factory
    const BluffBid = await hre.ethers.getContractFactory("BluffBid");

    // Deploy the contract
    const bluffBid = await BluffBid.deploy();

    await bluffBid.waitForDeployment();

    const address = await bluffBid.getAddress();

    console.log("✅ BluffBid deployed to:", address);
    console.log("\n📋 Contract Details:");
    console.log("   - Match Deposit:", await bluffBid.MATCH_DEPOSIT(), "wei (4 MON)");
    console.log("   - Total Rounds:", await bluffBid.TOTAL_ROUNDS());
    console.log("   - Max Bid:", await bluffBid.MAX_BID());
    console.log("   - Move Timeout:", await bluffBid.MOVE_TIMEOUT(), "seconds");

    console.log("\n💾 Save this address for frontend/backend integration!");

    return address;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
