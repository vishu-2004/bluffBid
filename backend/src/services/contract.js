import { createPublicClient, createWalletClient, http, parseEther, encodePacked, keccak256 } from 'viem';
import { hardhat, monadTestnet } from 'viem/chains'; // monadTestnet needs custom definition if not in viem/chains, will use mainnet as placeholder or define custom
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Custom Chain Definition for Monad if not standard in viem
const monadChain = {
    id: 10143,
    name: 'Monad Testnet',
    network: 'monad-testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Monad',
        symbol: 'MON',
    },
    rpcUrls: {
        default: { http: [process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
        public: { http: [process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
    },
};

const chain = process.env.PROD === 'true' ? monadChain : hardhat;
const transport = http(process.env.PROD === 'true'
    ? (process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz')
    : (process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545'));

// Load ABI from artifacts
// Assuming backend is sibling to contracts
const artifactPath = '../../../contracts/artifacts/contracts/BluffBid.sol/BluffBid.json';
const artifact = JSON.parse(fs.readFileSync(new URL(artifactPath, import.meta.url)));

const contractAddress = process.env.CONTRACT_ADDRESS;

if (!contractAddress) {
    console.error("CONTRACT_ADDRESS not set in .env");
    // For local dev, we might need to deploy first.
}

// Clients
export const publicClient = createPublicClient({
    chain,
    transport
});

// Wallet Clients for Agent A and Agent B
// Hardhat Default Accounts:
// 0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
// 1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

const accountA = privateKeyToAccount(process.env.PRIVATE_KEY_A || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const accountB = privateKeyToAccount(process.env.PRIVATE_KEY_B || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');

export const walletClientA = createWalletClient({
    account: accountA,
    chain,
    transport
});

export const walletClientB = createWalletClient({
    account: accountB,
    chain,
    transport
});

export const contractConfig = {
    address: contractAddress,
    abi: artifact.abi
};

// Generic Write Helper
async function writeContract(client, functionName, args = [], value = 0n) {
    try {
        const hash = await client.writeContract({
            ...contractConfig,
            functionName,
            args,
            value
        });
        return hash;
    } catch (e) {
        console.error(`Error in ${functionName}:`, e);
        throw e;
    }
}

// Start Match (Always Agent A Init)
export async function createMatch() {
    return await writeContract(walletClientA, 'createMatch', [], parseEther('20'));
}

// Join Match (Always Agent B Join)
export async function joinMatch(matchId) {
    return await writeContract(walletClientB, 'joinMatch', [matchId], parseEther('20'));
}

// Commit Bid (Dynamic Client based on player)
export async function commitBid(client, matchId, bid, salt) {
    // Generate Hash: keccak256(abi.encodePacked(bid, salt))
    const commitment = keccak256(encodePacked(['uint256', 'bytes32'], [BigInt(bid), salt]));
    return await writeContract(client, 'commitBid', [matchId, commitment]);
}

// Reveal Bid
export async function revealBid(client, matchId, bid, salt) {
    return await writeContract(client, 'revealBid', [matchId, BigInt(bid), salt]);
}

// Get Match State
export async function getMatchState(matchId) {
    try {
        const data = await publicClient.readContract({
            ...contractConfig,
            functionName: 'matches',
            args: [matchId]
        });
        // Transform struct data to readable object if needed
        // data usually returns array/object based on ABI
        // Struct Match: [id, status, currentRound, lastActionTime, player1, player2]
        return {
            id: data[0],
            status: data[1],
            currentRound: data[2],
            lastActionTime: data[3],
            player1: data[4],
            player2: data[5]
        };
    } catch (e) {
        console.error("Error fetching match state:", e);
        throw e;
    }
}
