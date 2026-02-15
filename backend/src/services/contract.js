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

// Check PROD mode - handle various formats (true, "true", TRUE, etc.)
const prodValue = process.env.PROD?.toLowerCase().trim();
const isProd = prodValue === 'true' || prodValue === '1';

console.log('═══════════════════════════════════════');
console.log('🔧 Contract Configuration:');
console.log(`   PROD env value: "${process.env.PROD}"`);
console.log(`   isProd: ${isProd}`);
console.log(`   Chain: ${isProd ? 'Monad Testnet' : 'Hardhat (Local)'}`);

const chain = isProd ? monadChain : hardhat;
const rpcUrl = isProd
    ? (process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz')
    : (process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545');

console.log(`   RPC URL: ${rpcUrl}`);
console.log(`   Contract Address: ${process.env.CONTRACT_ADDRESS || 'NOT SET'}`);
console.log('═══════════════════════════════════════');

if (isProd && !process.env.CONTRACT_ADDRESS) {
    console.error('❌ ERROR: CONTRACT_ADDRESS is required when PROD=true');
    throw new Error('CONTRACT_ADDRESS environment variable is required in production mode');
}

const transport = http(rpcUrl);

// Load ABI from artifacts
const artifactPath = '../../../contracts/artifacts/contracts/BluffBid.sol/BluffBid.json';
const artifact = JSON.parse(fs.readFileSync(new URL(artifactPath, import.meta.url)));

const contractAddress = process.env.CONTRACT_ADDRESS;

if (!contractAddress) {
    console.error("CONTRACT_ADDRESS not set in .env");
}

// Clients
export const publicClient = createPublicClient({
    chain,
    transport
});

// ═══════════════════════════════════════
//  STRATEGY-SPECIFIC WALLETS
// ═══════════════════════════════════════
const HARDHAT_KEYS = [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // 0
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // 1
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // 2
];

function makeWalletClient(envKey, defaultIndex) {
    let key;
    if (isProd) {
        key = process.env[envKey];
        if (!key) {
            const errorMsg = `Environment variable ${envKey} is REQUIRED in PROD mode. Please set it in your .env file.`;
            console.error(`❌ ${errorMsg}`);
            throw new Error(errorMsg);
        }
        console.log(`   ✓ ${envKey}: ${key.substring(0, 10)}...${key.substring(key.length - 8)}`);
    } else {
        key = HARDHAT_KEYS[defaultIndex];
        console.log(`   ✓ ${envKey}: Using Hardhat default key (Account ${defaultIndex})`);
    }

    if (key && !key.startsWith('0x')) key = `0x${key}`;
    const account = privateKeyToAccount(key);
    return createWalletClient({ account, chain, transport });
}

export const strategyWallets = {
    aggressive: makeWalletClient('PRIVATE_KEY_AGGRESSIVE', 0),
    conservative: makeWalletClient('PRIVATE_KEY_CONSERVATIVE', 1),
    adaptive: makeWalletClient('PRIVATE_KEY_ADAPTIVE', 2),
};

// Backward compatibility — default A/B aliases
export const walletClientA = strategyWallets.aggressive;
export const walletClientB = strategyWallets.conservative;

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

// Configuration constants (scaled by 10 internally)
export const MATCH_DEPOSIT_MON = 4.0; // 4.0 MON
export const MATCH_DEPOSIT_SCALED = 40; // 40 units (4.0 * 10)
export const MAX_BID_MON = 2.5; // 2.5 MON
export const MAX_BID_SCALED = 25; // 25 units (2.5 * 10)
export const STEP_SIZE_MON = 0.1; // 0.1 MON
export const STEP_SIZE_SCALED = 1; // 1 unit (0.1 * 10)

// Start Match (wallet param — strategy wallet of Agent A)
export async function createMatch(wallet = walletClientA) {
    return await writeContract(wallet, 'createMatch', [], parseEther('4'));
}

// Join Match (wallet param — strategy wallet of Agent B)
export async function joinMatch(wallet, matchId) {
    return await writeContract(wallet, 'joinMatch', [matchId], parseEther('4'));
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
