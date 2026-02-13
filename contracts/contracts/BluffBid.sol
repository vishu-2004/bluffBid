// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BluffBid Arena
 * @dev A token-wagered competitive game where two agents compete in a 5-round sealed-bid duel.
 *      Uses a commit-reveal scheme to prevent cheating and ensure fairness without on-chain randomness.
 */
contract BluffBid {
    // --- State Variables & Structs ---

    uint256 public constant MATCH_DEPOSIT = 20 ether; // 20 MON (assuming 18 decimals)
    uint256 public constant TOTAL_ROUNDS = 5;
    uint256 public constant MAX_BID = 5;

    enum MatchStatus {
        WaitingForPlayer,
        Active,
        Completed
    }

    struct Round {
        bool p1Committed;
        bool p2Committed;
        bool p1Revealed;
        bool p2Revealed;
        bytes32 p1CommitHash;
        bytes32 p2CommitHash;
        uint256 p1Bid;
        uint256 p2Bid;
    }

    struct PlayerState {
        address addr;
        uint256 balance;
        uint256 wins;
        bool isActive; // To check if player slot is filled
    }

    struct Match {
        uint256 id;
        MatchStatus status;
        uint256 currentRound;
        uint256 lastActionTime; // Track for timeouts
        PlayerState player1; // Address of Creator
        PlayerState player2; // Address of Joiner
        mapping(uint256 => Round) rounds; // roundId (1-5) => Round Data
    }

    uint256 public matchIdCounter;
    mapping(uint256 => Match) public matches;
    
    // To prevent re-entrancy
    bool private locked;

    // --- Events ---

    event MatchCreated(uint256 indexed matchId, address indexed creator);
    event PlayerJoined(uint256 indexed matchId, address indexed joiner);
    event BidCommitted(uint256 indexed matchId, uint256 round, address indexed player);
    event BidRevealed(uint256 indexed matchId, uint256 round, address indexed player, uint256 bid);
    event RoundResolved(uint256 indexed matchId, uint256 round, address winner, uint256 p1Bid, uint256 p2Bid);
    event MatchEnded(uint256 indexed matchId, address winner, uint256 payout);
    event MatchTied(uint256 indexed matchId, uint256 payoutEach);

    // --- Modifiers ---

    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyPlayer(uint256 _matchId) {
        require(
            msg.sender == matches[_matchId].player1.addr || msg.sender == matches[_matchId].player2.addr,
            "Not a player in this match"
        );
        _;
    }

    modifier inState(uint256 _matchId, MatchStatus _status) {
        require(matches[_matchId].status == _status, "Invalid match state");
        _;
    }

    // --- Core Gameplay Functions ---

    /**
     * @notice Create a new match. Caller must deposit the required wager.
     * @return matchId The ID of the newly created match.
     */
    function createMatch() external payable returns (uint256 matchId) {
        require(msg.value == MATCH_DEPOSIT, "Incorrect deposit amount");

        matchIdCounter++;
        matchId = matchIdCounter;

        Match storage newMatch = matches[matchId];
        newMatch.id = matchId;
        newMatch.status = MatchStatus.WaitingForPlayer;
        newMatch.currentRound = 1;
        newMatch.lastActionTime = block.timestamp;

        newMatch.player1 = PlayerState({
            addr: msg.sender,
            balance: MATCH_DEPOSIT, // Initialize with deposit
            wins: 0,
            isActive: true
        });

        emit MatchCreated(matchId, msg.sender);
    }

    /**
     * @notice Join an existing match. Caller must deposit the required wager.
     * @param _matchId The ID of the match to join.
     */
    function joinMatch(uint256 _matchId) external payable inState(_matchId, MatchStatus.WaitingForPlayer) {
        require(msg.value == MATCH_DEPOSIT, "Incorrect deposit amount");
        Match storage m = matches[_matchId];
        require(msg.sender != m.player1.addr, "Cannot play against yourself");

        m.player2 = PlayerState({
            addr: msg.sender,
            balance: MATCH_DEPOSIT,
            wins: 0,
            isActive: true
        });

        m.status = MatchStatus.Active;
        m.lastActionTime = block.timestamp;
        emit PlayerJoined(_matchId, msg.sender);
    }

    /**
     * @notice Commit a hashed bid for the current round.
     * @dev The hash should be keccak256(abi.encodePacked(bid, salt)).
     * @param _matchId The match ID.
     * @param _commitment The hash of the bid and salt.
     */
    function commitBid(uint256 _matchId, bytes32 _commitment) external onlyPlayer(_matchId) inState(_matchId, MatchStatus.Active) {
        Match storage m = matches[_matchId];
        uint256 r = m.currentRound;
        Round storage round = m.rounds[r];

        if (msg.sender == m.player1.addr) {
            require(!round.p1Committed, "Player 1 already committed");
            round.p1CommitHash = _commitment;
            round.p1Committed = true;
        } else {
            require(!round.p2Committed, "Player 2 already committed");
            round.p2CommitHash = _commitment;
            round.p2Committed = true;
        }

        m.lastActionTime = block.timestamp;
        emit BidCommitted(_matchId, r, msg.sender);
    }

    /**
     * @notice Reveal the bid for the current round.
     * @dev Verifies the bid against the committed hash and resolves the round if both revealed.
     * @param _matchId The match ID.
     * @param _bid The numerical bid (0-5).
     * @param _salt The salt used in the commitment hash.
     */
    function revealBid(uint256 _matchId, uint256 _bid, bytes32 _salt) external onlyPlayer(_matchId) inState(_matchId, MatchStatus.Active) nonReentrant {
        Match storage m = matches[_matchId];
        uint256 r = m.currentRound;
        Round storage round = m.rounds[r];

        // Ensure both have committed before allowing any reveal (Standard Commit-Reveal practice to prevent info leakage)
        // Although specifically here, if I reveal first, you know my bid, but you can't change yours because you already committed.
        // So strict ordering (Commit->Reveal) is enforced by `pXCommitted` checks implicitly, but checking both committed is safer logic wise.
        require(round.p1Committed && round.p2Committed, "Wait for opponent to commit");

        if (msg.sender == m.player1.addr) {
            require(!round.p1Revealed, "Player 1 already revealed");
            require(keccak256(abi.encodePacked(_bid, _salt)) == round.p1CommitHash, "Invalid hash/salt");
            require(_bid <= MAX_BID, "Bid exceeds max limit");
            require(_bid <= m.player1.balance, "Bid exceeds balance"); // Important: Check balance

            round.p1Bid = _bid;
            round.p1Revealed = true;
        } else {
            require(!round.p2Revealed, "Player 2 already revealed");
            require(keccak256(abi.encodePacked(_bid, _salt)) == round.p2CommitHash, "Invalid hash/salt");
            require(_bid <= MAX_BID, "Bid exceeds max limit");
            require(_bid <= m.player2.balance, "Bid exceeds balance");

            round.p2Bid = _bid;
            round.p2Revealed = true;
        }

        m.lastActionTime = block.timestamp;
        emit BidRevealed(_matchId, r, msg.sender, _bid);

        // Check if round can be resolved
        if (round.p1Revealed && round.p2Revealed) {
            _resolveRound(_matchId, r);
        }
    }

    // --- Internal Logic ---

    function _resolveRound(uint256 _matchId, uint256 _roundId) internal {
        Match storage m = matches[_matchId];
        Round storage round = m.rounds[_roundId];

        // Deduct balances immediately (Pay-to-Play mechanic)
        m.player1.balance -= round.p1Bid;
        m.player2.balance -= round.p2Bid;

        address roundWinner = address(0);

        if (round.p1Bid > round.p2Bid) {
            m.player1.wins++;
            roundWinner = m.player1.addr;
        } else if (round.p2Bid > round.p1Bid) {
            m.player2.wins++;
            roundWinner = m.player2.addr;
        } 
        // Else tie, no wins incremented

        emit RoundResolved(_matchId, _roundId, roundWinner, round.p1Bid, round.p2Bid);

        if (m.currentRound < TOTAL_ROUNDS) {
            m.currentRound++;
        } else {
            _endMatch(_matchId);
        }
    }

    function _endMatch(uint256 _matchId) internal {
        Match storage m = matches[_matchId];
        m.status = MatchStatus.Completed;

        uint256 totalPot = MATCH_DEPOSIT * 2; // Fixed pot 40 MON implies we don't burn bids, we just deduct from internal ledger to track winners.
        // Wait, requirements say: "Both bids are deducted from their balances."
        // And "Player with more round wins receives the full pot."
        // This implies the 'balance' tracking is just virtual points for the game logic, OR the pot decreases?
        // Re-reading: "Both bids are deducted from their balances." -> "Player with more round wins receives the full pot."
        // Usually "full pot" means the initial wager. If bids were burned, the pot would shrink.
        // The requirement "Player with more round wins receives the full pot" strongly suggests the winner takes the original 40 MON.
        // Re-reading: "Player with more round wins receives the full pot" strongly suggests the winner takes the original 40 MON.
        // The "balance" is likely just a gameplay constraint (you can't bid what you don't have), not a financial deduction from the prize.
        // CHECK: "Tie results in no round win." "Both bids are deducted from their balances."
        // Intepretation: Strategy constraint. You start with 20 chips. You bid chips. Chips are gone explicitly to limit future moves.
        // The PRIZE is the 40 MON locked in the contract.
        
        m.lastActionTime = block.timestamp;
        
        address winner = address(0);
        uint256 payout = totalPot;

        if (m.player1.wins > m.player2.wins) {
            winner = m.player1.addr;
            (bool sent, ) = payable(winner).call{value: payout}("");
            require(sent, "Failed to send payout");
            emit MatchEnded(_matchId, winner, payout);
        } else if (m.player2.wins > m.player1.wins) {
            winner = m.player2.addr;
            (bool sent, ) = payable(winner).call{value: payout}("");
            require(sent, "Failed to send payout");
            emit MatchEnded(_matchId, winner, payout);
        } else {
            // Tie - Split Pot
            uint256 split = totalPot / 2;
            (bool sent1, ) = payable(m.player1.addr).call{value: split}("");
            require(sent1, "Failed to send split 1");
            (bool sent2, ) = payable(m.player2.addr).call{value: split}("");
            require(sent2, "Failed to send split 2");
            emit MatchTied(_matchId, split);

    // --- Timeout / Anti-Stall Mechanism ---

    uint256 public constant MOVE_TIMEOUT = 24 hours;

    /**
     * @notice Claim a win by timeout if opponent is unresponsive.
     * @dev Simplistic check: If timeout passed, the other player wins the pot. 
     *      In a real prod environment, more granular checks (who's turn was it?) would be needed. 
     *      Here we assume if you can call this and time has passed, the game is stuck.
     *      To prevent abuse, we check state.
     */
    function claimTimeout(uint256 _matchId) external nonReentrant inState(_matchId, MatchStatus.Active) {
        Match storage m = matches[_matchId];
        require(block.timestamp > m.lastActionTime + MOVE_TIMEOUT, "Timeout not reached");

        // Determine who stalled. 
        // Logic:
        // Round starts. 
        // 1. Need Commits: If I committed and you didn't -> You stalled.
        // 2. Need Reveals: If I revealed and you didn't -> You stalled.
        
        uint256 r = m.currentRound;
        Round storage round = m.rounds[r];
        
        address winner = address(0);

        // Case 1: Waiting for Commits
        if (!round.p1Committed && !round.p2Committed) {
            // Both idle? Refund both? Or just whoever calls strictly allows?
            // To keep it simple: refund both.
            _refundMatch(_matchId);
            return;
        }
        
        if (round.p1Committed && !round.p2Committed) {
             // P2 stalled
             winner = m.player1.addr;
        } else if (!round.p1Committed && round.p2Committed) {
             // P1 stalled
             winner = m.player2.addr;
        }
        // Case 2: Waiting for Reveals (Both committed)
        else if (round.p1Committed && round.p2Committed) {
            if (round.p1Revealed && !round.p2Revealed) {
                winner = m.player1.addr;
            } else if (!round.p1Revealed && round.p2Revealed) {
                 winner = m.player2.addr;
            } else {
                 // Both committed but neither revealed? 
                 // If I am calling this, I should have revealed? 
                 // Or if I call this, I claim I am active.
                 // Simplification for Hackathon: Caller wins if they are a player? 
                 // Better: Refund if ambiguous.
                 _refundMatch(_matchId);
                 return;
            }
        }

        require(winner != address(0), "Cannot determine winner");

        m.status = MatchStatus.Completed;
        // Winner takes all in timeout scenario
        uint256 payout = MATCH_DEPOSIT * 2;
        (bool sent, ) = payable(winner).call{value: payout}("");
        require(sent, "Payout failed");
        
        emit MatchEnded(_matchId, winner, payout);
    }
    
    function _refundMatch(uint256 _matchId) internal {
        Match storage m = matches[_matchId];
        m.status = MatchStatus.Completed;
        
        // Return remaining balances? 
        // Actually simplest is return Deposits basically (split pot).
        // Since we deduct balances virtually, the contract still holds 40 MON.
        uint256 split = MATCH_DEPOSIT; // 20 each
        
        (bool s1, ) = payable(m.player1.addr).call{value: split}("");
        require(s1, "Refund P1 failed");
        (bool s2, ) = payable(m.player2.addr).call{value: split}("");
        require(s2, "Refund P2 failed");
        
        emit MatchTied(_matchId, split); 
    }

    /**
     * @notice Cancel a match if no one joined.
     */
    function cancelMatch(uint256 _matchId) external nonReentrant inState(_matchId, MatchStatus.WaitingForPlayer) {
        Match storage m = matches[_matchId];
        require(msg.sender == m.player1.addr, "Only creator can cancel");
        
        m.status = MatchStatus.Completed;
        (bool sent, ) = payable(msg.sender).call{value: MATCH_DEPOSIT}("");
        require(sent, "Refund failed");
        
        emit MatchEnded(_matchId, address(0), 0); // 0 payout implies refund/cancel
    }

