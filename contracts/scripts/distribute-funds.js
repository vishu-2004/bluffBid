const hre = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Script to distribute Monad testnet tokens equally among the 3 agents:
 * AGGRESSIVE, CONSERVATIVE, ADAPTIVE
 * 
 * Logic:
 * 1. Fetch balances of all 3 agent wallets.
 * 2. Calculate the total balance.
 * 3. Distribute the total balance equally among the 3 accounts.
 */

async function main() {
    const provider = hre.ethers.provider;

    // Load keys from .env
    const privateKeys = {
        AGGRESSIVE: process.env.PRIVATE_KEY_AGGRESSIVE,
        CONSERVATIVE: process.env.PRIVATE_KEY_CONSERVATIVE,
        ADAPTIVE: process.env.PRIVATE_KEY_ADAPTIVE
    };

    if (!privateKeys.AGGRESSIVE || !privateKeys.CONSERVATIVE || !privateKeys.ADAPTIVE) {
        console.error("Error: Missing agent private keys in .env");
        process.exit(1);
    }

    // Initialize wallets
    const walletAggressive = new hre.ethers.Wallet(privateKeys.AGGRESSIVE, provider);
    const walletConservative = new hre.ethers.Wallet(privateKeys.CONSERVATIVE, provider);
    const walletAdaptive = new hre.ethers.Wallet(privateKeys.ADAPTIVE, provider);

    const wallets = [walletAggressive, walletConservative, walletAdaptive];
    const names = ["AGGRESSIVE", "CONSERVATIVE", "ADAPTIVE"];

    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

    console.log("--- Fetching Current Wallet Balances ---");

    let balances = [];
    let totalBalance = 0n; // Use BigInt literal for consistency

    for (let i = 0; i < wallets.length; i++) {
        const bal = await provider.getBalance(wallets[i].address);
        balances.push(bal);
        totalBalance += bal;
        console.log(`${names[i]} (${wallets[i].address}): ${hre.ethers.formatEther(bal)} MON`);
    }

    console.log(`\nTotal Pool in Wallets: ${hre.ethers.formatEther(totalBalance)} MON`);

    const targetBalance = totalBalance / 3n;
    console.log(`Target balance per account: ${hre.ethers.formatEther(targetBalance)} MON`);

    console.log("\n--- Distributing Funds ---");

    // We use AGGRESSIVE as the hub for redistribution
    // First, send funds from wallets that have more than target to AGGRESSIVE
    for (let i = 1; i < wallets.length; i++) { // Skip AGGRESSIVE (index 0)
        if (balances[i] > targetBalance) {
            const amountToSend = balances[i] - targetBalance;
            // Subtract small amount for gas
            const gasAdjustment = hre.ethers.parseEther("0.01");
            const finalAmount = amountToSend > gasAdjustment ? amountToSend - gasAdjustment : 0n;

            if (finalAmount > 0n) {
                console.log(`Sending ${hre.ethers.formatEther(finalAmount)} MON from ${names[i]} to AGGRESSIVE...`);
                const tx = await wallets[i].sendTransaction({
                    to: walletAggressive.address,
                    value: finalAmount
                });
                await tx.wait();
            }
        }
    }

    // Refresh AGGRESSIVE balance
    const updatedAggressiveBal = await provider.getBalance(walletAggressive.address);

    // Now send funds from AGGRESSIVE to those who have less than target
    for (let i = 1; i < wallets.length; i++) {
        const currentBal = await provider.getBalance(wallets[i].address);
        if (currentBal < targetBalance) {
            const amountNeeded = targetBalance - currentBal;
            console.log(`Sending ${hre.ethers.formatEther(amountNeeded)} MON from AGGRESSIVE to ${names[i]}...`);
            const tx = await walletAggressive.sendTransaction({
                to: wallets[i].address,
                value: amountNeeded
            });
            await tx.wait();
        }
    }

    console.log("\n--- Final Balances ---");
    for (let i = 0; i < wallets.length; i++) {
        const bal = await provider.getBalance(wallets[i].address);
        console.log(`${names[i]}: ${hre.ethers.formatEther(bal)} MON`);
    }

    console.log("\nDistribution complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
