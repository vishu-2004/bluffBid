# BluffBid Arena Backend

This is the backend for the BluffBid Arena game, handling agent orchestration and game state management.

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   Copy `.env` if not exists (template provided).
   
   - **Local Development (Hardhat)**:
     ```env
     PROD=false
     HARDHAT_RPC_URL=http://127.0.0.1:8545
     PRIVATE_KEY_A=... (from npx hardhat node Account 0)
     PRIVATE_KEY_B=... (from npx hardhat node Account 1)
     CONTRACT_ADDRESS=... (from deploy script output)
     ```
   
   - **Monad Testnet**:
     ```env
     PROD=true
     MONAD_RPC_URL=https://testnet-rpc.monad.xyz
     PRIVATE_KEY_A=...
     PRIVATE_KEY_B=...
     CONTRACT_ADDRESS=...
     ```

## Running the Backend

```bash
npm run dev
```
This starts the server on port 3000 using `nodemon`.

## PROD Switch Logic

The application uses the `PROD` environment variable to determine which chain to connect to.

- In `src/services/contract.js`:
  ```javascript
  const chain = process.env.PROD === 'true' ? monadChain : hardhat;
  const transport = http(process.env.PROD === 'true' ? process.env.MONAD_RPC_URL : process.env.HARDHAT_RPC_URL);
  ```
- Simply changing `PROD=true` in `.env` switches the entire backend to target the Monad Testnet RPC.

## Monte Carlo Agent Explanation

The **Monte Carlo Agent** (`src/agents/monteCarlo.js`) uses a probabilistic simulation to decide the optimal bid.

1. **Opponent Modeling**: It tracks the opponent's previous bids to build a frequency profile (e.g., if opponent often bids 5, the model weights 5 higher).
2. **Simulation**:
   - For every possible bid (0-5) valid within balance:
   - It runs **100 simulations**.
   - In each simulation, it samples a likely opponent bid based on the profile.
   - It calculates a **Utility Score** for the outcome:
     - **Round Win**: +100 points
     - **Tie**: +50 points
     - **Resource Conservation**: +2 * Remaining Balance
     - **Winning Bonus**: +20 points
     - **Loss Penalty**: Subtracts the bid amount if lost.
3. **Decision**: It chooses the bid with the highest average expected utility across all simulations.

This approach allows the agent to make "smart" decisions that balance winning the current round against saving tokens for future rounds, dynamically adapting to the opponent's style.

## API Usage

**Start Match:**
```http
POST /api/match/start
Content-Type: application/json

{
  "agentA": "monteCarlo",
  "agentB": "aggressive"
}
```

**Get Match State:**
```http
GET /api/match/<MATCH_ID>
```
