// MCP Smoke Test
// Validates all MCP primitives work correctly in isolation.
// Run: node backend/src/mcp/testMcp.js

import { createServer } from './server.js';
import { mcpAgent } from '../agents/mcpAgent.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
    if (condition) {
        console.log(`  ✅ ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ ${testName}${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

// Mock game state
const mockState = {
    roundNumber: 3,
    myBalance: 12,
    opponentBalance: 8,
    myWins: 1,
    opponentWins: 1,
    opponentPreviousBids: [3, 5]
};

console.log('\n🔧 MCP Smoke Test\n');

// --- Test 1: Server Creation ---
console.log('1. Server Creation');
const server = createServer(mockState);
assert(server !== null, 'Server created successfully');

// --- Test 2: List Tools ---
console.log('\n2. Tools');
const tools = server.listTools();
assert(tools.length === 1, 'One tool registered');
assert(tools[0].name === 'place_bid', 'Tool name is place_bid');

// --- Test 3: Call Tool — valid bid ---
console.log('\n3. Tool: place_bid (valid)');
const validResult = server.callTool('place_bid', { amount: 3 });
assert(validResult.success === true, 'Valid bid accepted');
assert(validResult.bid === 3, 'Bid amount correct');

// --- Test 4: Call Tool — bid exceeds balance ---
console.log('\n4. Tool: place_bid (exceeds balance)');
const overResult = server.callTool('place_bid', { amount: 5 });
// myBalance is 12, so 5 is valid
assert(overResult.success === true, 'Bid within balance accepted');

// --- Test 5: Call Tool — invalid bid ---
console.log('\n5. Tool: place_bid (invalid)');
const invalidResult = server.callTool('place_bid', { amount: 7 });
assert(invalidResult.success === false, 'Invalid bid rejected');

// --- Test 6: List Resources ---
console.log('\n6. Resources');
const resources = server.listResources();
assert(resources.length === 1, 'One resource registered');
assert(resources[0].uri === 'match://status', 'Resource URI is match://status');

// --- Test 7: Read Resource ---
console.log('\n7. Resource: match://status');
const status = server.readResource('match://status');
assert(status.roundNumber === 3, 'Round number correct');
assert(status.myBalance === 12, 'Balance correct');
assert(status.opponentBidHistory.length === 2, 'Bid history length correct');
assert(Array.isArray(status.opponentFrequencyProfile), 'Frequency profile is array');
assert(status.opponentFrequencyProfile.length === 6, 'Frequency profile has 6 entries');
const profileSum = status.opponentFrequencyProfile.reduce((a, b) => a + b, 0);
assert(Math.abs(profileSum - 1.0) < 0.001, 'Frequency profile sums to 1.0');

// --- Test 8: List Prompts ---
console.log('\n8. Prompts');
const prompts = server.listPrompts();
assert(prompts.length === 1, 'One prompt registered');
assert(prompts[0].name === 'bid_aggressively', 'Prompt name correct');

// --- Test 9: Get Prompt Messages ---
console.log('\n9. Prompt: bid_aggressively messages');
const messages = server.getPrompt('bid_aggressively');
assert(messages.length > 0, 'Prompt returns messages');
assert(messages[0].role === 'system', 'First message is system role');
assert(messages[0].content.includes('Monte Carlo'), 'Message mentions Monte Carlo');

// --- Test 10: Execute Prompt Strategy ---
console.log('\n10. Prompt: bid_aggressively execution');
const strategyResult = server.executePrompt('bid_aggressively', status);
assert(typeof strategyResult.bestBid === 'number', 'Strategy returns bestBid');
assert(strategyResult.bestBid >= 0 && strategyResult.bestBid <= 5, 'bestBid in valid range');
assert(typeof strategyResult.expectedUtility === 'number', 'Strategy returns expectedUtility');
assert(typeof strategyResult.allUtilities === 'object', 'Strategy returns allUtilities map');

// --- Test 11: Full Agent decide() ---
console.log('\n11. mcpAgent.decide()');
const decision = mcpAgent.decide(mockState);
assert(typeof decision.bid === 'number', 'Agent returns bid');
assert(decision.bid >= 0 && decision.bid <= 5, 'Agent bid in valid range');
assert(typeof decision.reason === 'string', 'Agent returns reason string');
assert(decision.reason.includes('MCP'), 'Reason mentions MCP');
console.log(`   → Bid: ${decision.bid}, Reason: ${decision.reason}`);

// --- Summary ---
console.log(`\n${'─'.repeat(40)}`);
if (failed === 0) {
    console.log(`✅ All ${passed} MCP tests passed!\n`);
} else {
    console.log(`❌ ${failed} of ${passed + failed} tests failed.\n`);
    process.exit(1);
}
