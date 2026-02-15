// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BluffBid Arena
 * @dev A token-wagered competitive game where two agents compete in a 5-round sealed-bid duel.
 *      Uses a commit-reveal scheme to prevent cheating and ensure fairness.
 */
contract BluffBid {
    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    uint256 public constant MATCH_DEPOSIT = 4 ether; // 4.0 MON (payment amount)
    uint256 public constant STARTING_BALANCE = 40; // 4.0 MON in scaled units (internal)
    uint256 public constant TOTAL_ROUNDS = 5;
    uint256 public constant MAX_BID = 25; // 2.5 MON (scaled by 10: 25 units = 2.5 MON)
    uint256 public constant MOVE_TIMEOUT = 24 hours;

    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------

    enum MatchStatus {
        WaitingForPlayer,
        Active,
        Completed
    }

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

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
        bool isActive;
    }

    struct Match {
        uint256 id;
        MatchStatus status;
        uint256 currentRound;
        uint256 lastActionTime;
        PlayerState player1;
        PlayerState player2;
        mapping(uint256 => Round) rounds;
    }

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    uint256 public matchIdCounter;
    mapping(uint256 => Match) public matches;

    bool private locked;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event MatchCreated(uint256 indexed matchId, address indexed creator);
    event PlayerJoined(uint256 indexed matchId, address indexed joiner);
    event BidCommitted(uint256 indexed matchId, uint256 round, address indexed player);
    event BidRevealed(uint256 indexed matchId, uint256 round, address indexed player, uint256 bid);
    event RoundResolved(uint256 indexed matchId, uint256 round, address winner, uint256 p1Bid, uint256 p2Bid);
    event MatchEnded(uint256 indexed matchId, address winner, uint256 payout);
    event MatchTied(uint256 indexed matchId, uint256 payoutEach);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyPlayer(uint256 _matchId) {
        require(
            msg.sender == matches[_matchId].player1.addr ||
            msg.sender == matches[_matchId].player2.addr,
            "Not a player"
        );
        _;
    }

    modifier inState(uint256 _matchId, MatchStatus _status) {
        require(matches[_matchId].status == _status, "Invalid match state");
        _;
    }

    // -------------------------------------------------------------------------
    // Match Lifecycle
    // -------------------------------------------------------------------------

    function createMatch() external payable returns (uint256 matchId) {
        require(msg.value == MATCH_DEPOSIT, "Incorrect deposit");

        matchIdCounter++;
        matchId = matchIdCounter;

        Match storage m = matches[matchId];
        m.id = matchId;
        m.status = MatchStatus.WaitingForPlayer;
        m.currentRound = 1;
        m.lastActionTime = block.timestamp;

        m.player1 = PlayerState({
            addr: msg.sender,
            balance: STARTING_BALANCE, // Store in scaled units (40 = 4.0 MON)
            wins: 0,
            isActive: true
        });

        emit MatchCreated(matchId, msg.sender);
    }

    function joinMatch(uint256 _matchId)
        external
        payable
        inState(_matchId, MatchStatus.WaitingForPlayer)
    {
        require(msg.value == MATCH_DEPOSIT, "Incorrect deposit");

        Match storage m = matches[_matchId];
        require(msg.sender != m.player1.addr, "Cannot self-play");

        m.player2 = PlayerState({
            addr: msg.sender,
            balance: STARTING_BALANCE, // Store in scaled units (40 = 4.0 MON)
            wins: 0,
            isActive: true
        });

        m.status = MatchStatus.Active;
        m.lastActionTime = block.timestamp;

        emit PlayerJoined(_matchId, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Commit / Reveal
    // -------------------------------------------------------------------------

    function commitBid(uint256 _matchId, bytes32 _commitment)
        external
        onlyPlayer(_matchId)
        inState(_matchId, MatchStatus.Active)
    {
        Match storage m = matches[_matchId];
        Round storage round = m.rounds[m.currentRound];

        if (msg.sender == m.player1.addr) {
            require(!round.p1Committed, "Already committed");
            round.p1CommitHash = _commitment;
            round.p1Committed = true;
        } else {
            require(!round.p2Committed, "Already committed");
            round.p2CommitHash = _commitment;
            round.p2Committed = true;
        }

        m.lastActionTime = block.timestamp;

        emit BidCommitted(_matchId, m.currentRound, msg.sender);
    }

    function revealBid(
        uint256 _matchId,
        uint256 _bid,
        bytes32 _salt
    )
        external
        onlyPlayer(_matchId)
        inState(_matchId, MatchStatus.Active)
        nonReentrant
    {
        Match storage m = matches[_matchId];
        Round storage round = m.rounds[m.currentRound];

        require(round.p1Committed && round.p2Committed, "Wait for commits");
        require(_bid <= MAX_BID, "Bid too high");

        if (msg.sender == m.player1.addr) {
            require(!round.p1Revealed, "Already revealed");
            require(
                keccak256(abi.encodePacked(_bid, _salt)) ==
                    round.p1CommitHash,
                "Invalid reveal"
            );
            require(_bid <= m.player1.balance, "Insufficient balance");

            round.p1Bid = _bid;
            round.p1Revealed = true;
        } else {
            require(!round.p2Revealed, "Already revealed");
            require(
                keccak256(abi.encodePacked(_bid, _salt)) ==
                    round.p2CommitHash,
                "Invalid reveal"
            );
            require(_bid <= m.player2.balance, "Insufficient balance");

            round.p2Bid = _bid;
            round.p2Revealed = true;
        }

        m.lastActionTime = block.timestamp;

        emit BidRevealed(_matchId, m.currentRound, msg.sender, _bid);

        if (round.p1Revealed && round.p2Revealed) {
            _resolveRound(_matchId);
        }
    }

    // -------------------------------------------------------------------------
    // Internal Game Logic
    // -------------------------------------------------------------------------

    function _resolveRound(uint256 _matchId) internal {
        Match storage m = matches[_matchId];
        Round storage round = m.rounds[m.currentRound];

        m.player1.balance -= round.p1Bid;
        m.player2.balance -= round.p2Bid;

        address winner;

        if (round.p1Bid > round.p2Bid) {
            m.player1.wins++;
            winner = m.player1.addr;
        } else if (round.p2Bid > round.p1Bid) {
            m.player2.wins++;
            winner = m.player2.addr;
        }

        emit RoundResolved(
            _matchId,
            m.currentRound,
            winner,
            round.p1Bid,
            round.p2Bid
        );

        if (m.currentRound < TOTAL_ROUNDS) {
            m.currentRound++;
        } else {
            _endMatch(_matchId);
        }
    }

    function _endMatch(uint256 _matchId) internal {
        Match storage m = matches[_matchId];
        m.status = MatchStatus.Completed;

        uint256 pot = MATCH_DEPOSIT * 2;

        if (m.player1.wins > m.player2.wins) {
            _safeTransfer(m.player1.addr, pot);
            emit MatchEnded(_matchId, m.player1.addr, pot);
        } else if (m.player2.wins > m.player1.wins) {
            _safeTransfer(m.player2.addr, pot);
            emit MatchEnded(_matchId, m.player2.addr, pot);
        } else {
            uint256 split = pot / 2;
            _safeTransfer(m.player1.addr, split);
            _safeTransfer(m.player2.addr, split);
            emit MatchTied(_matchId, split);
        }
    }

    // -------------------------------------------------------------------------
    // Timeout
    // -------------------------------------------------------------------------

    function claimTimeout(uint256 _matchId)
        external
        nonReentrant
        inState(_matchId, MatchStatus.Active)
    {
        Match storage m = matches[_matchId];
        require(
            block.timestamp > m.lastActionTime + MOVE_TIMEOUT,
            "Timeout not reached"
        );

        uint256 pot = MATCH_DEPOSIT * 2;
        m.status = MatchStatus.Completed;

        _safeTransfer(msg.sender, pot);

        emit MatchEnded(_matchId, msg.sender, pot);
    }

    function cancelMatch(uint256 _matchId)
        external
        nonReentrant
        inState(_matchId, MatchStatus.WaitingForPlayer)
    {
        Match storage m = matches[_matchId];
        require(msg.sender == m.player1.addr, "Not creator");

        m.status = MatchStatus.Completed;
        _safeTransfer(msg.sender, MATCH_DEPOSIT);

        emit MatchEnded(_matchId, address(0), 0);
    }

    // -------------------------------------------------------------------------
    // Internal Safe Transfer
    // -------------------------------------------------------------------------

    function _safeTransfer(address to, uint256 amount) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");
    }
}