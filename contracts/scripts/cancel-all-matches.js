const hre = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Script to iterate through all match IDs and perform cleanup:
 * 1. cancelMatch if state is WaitingForPlayer (0)
 * 2. claimTimeout if state is Active (1) and lastActionTime > 10 minutes ago
 * 
 * Logic:
 * - Iterates 1..matchIdCounter
 * - Tries operations from all 3 agents
 */

async function main() {
    const provider = hre.ethers.provider;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        console.error("Error: CONTRACT_ADDRESS not found in .env");
        process.exit(1);
    }

    const privateKeys = [
        { name: "AGGRESSIVE", key: process.env.PRIVATE_KEY_AGGRESSIVE },
        { name: "CONSERVATIVE", key: process.env.PRIVATE_KEY_CONSERVATIVE },
        { name: "ADAPTIVE", key: process.env.PRIVATE_KEY_ADAPTIVE }
    ].filter(p => p.key);

    const abi = [
        "function matchIdCounter() public view returns (uint256)",
        "function cancelMatch(uint256 _matchId) external",
        "function claimTimeout(uint256 _matchId) external",
        "function matches(uint256) public view returns (uint256 id, uint8 status, uint256 currentRound, uint256 lastActionTime, address player1Addr, uint256 player1Balance, uint256 player1Wins, bool player1Active, address player2Addr, uint256 player2Balance, uint256 player2Wins, bool player2Active)"
    ];

    const contractReadOnly = new hre.ethers.Contract(contractAddress, abi, provider);

    let maxId;
    try {
        maxId = await contractReadOnly.matchIdCounter();
        console.log(`Found total matches: ${maxId}`);
    } catch (error) {
        console.error("Error fetching matchIdCounter (is contract deployed at this address?):", error.message);
        return;
    }

    const wallets = privateKeys.map(p => ({
        name: p.name,
        wallet: new hre.ethers.Wallet(p.key, provider),
        contract: new hre.ethers.Contract(contractAddress, abi, new hre.ethers.Wallet(p.key, provider))
    }));

    const TIMEOUT_SECONDS = 600n; // 10 minutes

    for (let id = 1n; id <= maxId; id++) {
        console.log(`\n--- Processing Match ID: ${id} ---`);

        try {
            const m = await contractReadOnly.matches(id);
            const status = BigInt(m[1]); // Ensure BigInt for comparison
            const lastActionTime = BigInt(m[3]);
            const now = BigInt(Math.floor(Date.now() / 1000));

            // MatchStatus: 0 = WaitingForPlayer, 1 = Active, 2 = Completed
            if (status === 0n) {
                console.log(`Match ${id} is WaitingForPlayer. Attempting to cancel...`);
                for (const account of wallets) {
                    try {
                        process.stdout.write(`  Trying cancelMatch from ${account.name}... `);
                        const tx = await account.contract.cancelMatch(id);
                        await tx.wait();
                        console.log("SUCCESS");
                        break;
                    } catch (e) {
                        console.log(`FAILED (${e.reason || "Error"})`);
                    }
                }
            } else if (status === 1n) {
                const elapsed = now - lastActionTime;
                console.log(`Match ${id} is Active. Elapsed: ${elapsed}s / ${TIMEOUT_SECONDS}s`);

                if (elapsed > TIMEOUT_SECONDS) {
                    console.log(`Timeout reached. Attempting to claim...`);
                    for (const account of wallets) {
                        try {
                            process.stdout.write(`  Trying claimTimeout from ${account.name}... `);
                            const tx = await account.contract.claimTimeout(id);
                            await tx.wait();
                            console.log("SUCCESS");
                            break;
                        } catch (e) {
                            console.log(`FAILED (${e.reason || "Error"})`);
                        }
                    }
                } else {
                    console.log("Still active, no timeout yet.");
                }
            } else {
                console.log(`Match ${id} is already Completed.`);
            }
        } catch (error) {
            console.error(`Error processing match ${id}:`, error.message);
        }
    }

    console.log("\nCleanup finished.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
