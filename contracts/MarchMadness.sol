pragma solidity ^0.5.0;

import "./ByteBracket.sol";
import "./FederatedOracleBytes8.sol";

/**
 * @title March Madness bracket pool smart contract
 *
 * The contract has four phases: submission, tournament, scoring, then the contest is over. During
 * the submission phase, entrants submit a cryptographic commitment to their bracket picks. Each
 * address may only make one submission. Entrants may reveal their brackets at any time after making
 * the commitment. Once the tournament starts, no further submissions are allowed. When the
 * tournament ends, the results are submitted by the oracles and the scoring period begins. During
 * the scoring period, entrants may reveal their bracket picks and score their brackets. The highest
 * scoring bracket revealed is recorded. After the scoring period ends, all entrants with a highest
 * scoring bracket split the pot and may withdraw their winnings.
 *
 * In the event that the oracles do not submit results or fail to reach consensus after a certain
 * amount of time, entry fees will be returned to entrants.
 */
contract MarchMadness {
    struct Submission {
        bytes32 commitment;
        bytes8 bracket;
        uint8 score;
        bool collectedWinnings;
        bool collectedEntryFee;
    }

    event SubmissionAccepted(address account);
    event NewWinner(address winner, uint8 score);
    event TournamentOver();

    FederatedOracleBytes8 resultsOracle;

	mapping(address => Submission) submissions;

    // Amount that winners will collect
    uint public winnings;

    // Number of submissions with a winning score
    uint public numWinners;

    // Data derived from results used by bracket scoring algorithm
    uint64 private scoringMask;

    // Fee in wei required to enter a bracket
    uint public entryFee;

    // Duration in seconds of the scoring phase
    uint public scoringDuration;

    // Timestamp of the start of the tournament phase
    uint public tournamentStartTime;

    // In case the oracles fail to submit the results or reach consensus, the amount of time after
    // the tournament has started after which to return entry fees to users.
    uint public noContestTime;

    // Timestamp of the end of the scoring phase
    uint public contestOverTime;

    // Byte bracket representation of the tournament results
    bytes8 public results;

    // The highest score of a bracket scored so far
    uint8 public winningScore;

    // The maximum allowed number of submissions
    uint32 public maxSubmissions;

    // The number of brackets submitted so far
    uint32 public numSubmissions;

    // IPFS hash of JSON file containing tournament information (eg. teams, regions, etc)
    string public tournamentDataIPFSHash;

	constructor(
        uint entryFee_,
        uint tournamentStartTime_,
        uint noContestTime_,
        uint scoringDuration_,
        uint32 maxSubmissions_,
        string memory tournamentDataIPFSHash_,
        address oracleAddress
    )
        public
    {
		entryFee = entryFee_;
        tournamentStartTime = tournamentStartTime_;
        scoringDuration = scoringDuration_;
        noContestTime = noContestTime_;
        maxSubmissions = maxSubmissions_;
        tournamentDataIPFSHash = tournamentDataIPFSHash_;
        resultsOracle = FederatedOracleBytes8(oracleAddress);
	}

    function submitBracket(bytes32 commitment) public payable {
        require(msg.value == entryFee);
        require(now < tournamentStartTime);
        require(numSubmissions < maxSubmissions);

        Submission storage submission = submissions[msg.sender];
        require(submission.commitment == 0);

        submission.commitment = commitment;
        numSubmissions++;
        emit SubmissionAccepted(msg.sender);
    }

    function startScoring() public {
        require(results == 0);
        require(now >= tournamentStartTime);
        require(now < noContestTime);

        bytes8 oracleValue = resultsOracle.finalValue();
        require(oracleValue != 0);

        results = oracleValue;
        scoringMask = ByteBracket.getScoringMask(results);
        contestOverTime = now + scoringDuration;
        emit TournamentOver();
    }

    function revealBracket(bytes8 bracket, bytes16 salt) public {
        Submission storage submission = submissions[msg.sender];
        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, bracket, salt));
        require(commitment == submission.commitment);

        submission.bracket = bracket;
    }

    function scoreBracket(address account) public {
        require(results != 0);
        require(now < contestOverTime);

        Submission storage submission = submissions[account];
        require(submission.bracket != 0);
        require(submission.score == 0);

        submission.score = ByteBracket.getBracketScore(submission.bracket, results, scoringMask);

        if (submission.score > winningScore) {
            winningScore = submission.score;
            numWinners = 0;
        }
        if (submission.score == winningScore) {
            numWinners++;
            winnings = address(this).balance / numWinners;
            emit NewWinner(account, submission.score);
        }
    }

    function collectWinnings() public {
        require(now >= contestOverTime);

        Submission storage submission = submissions[msg.sender];
        require(submission.score == winningScore);
        require(!submission.collectedWinnings);

        submission.collectedWinnings = true;
        assert(msg.sender.send(winnings));
    }

    function collectEntryFee() public {
        require(now >= noContestTime);
        require(results == 0);

        Submission storage submission = submissions[msg.sender];
        require(submission.commitment != 0);
        require(!submission.collectedEntryFee);

        submission.collectedEntryFee = true;
        assert(msg.sender.send(entryFee));
    }

    function getBracketScore(bytes8 bracket) public view returns (uint8) {
        require(results != 0);

        return ByteBracket.getBracketScore(bracket, results, scoringMask);
    }

    function getBracket(address account) public view returns (bytes8) {
        return submissions[account].bracket;
    }

    function getScore(address account) public view returns (uint8) {
        return submissions[account].score;
    }

    function getCommitment(address account) public view returns (bytes32) {
        return submissions[account].commitment;
    }

    function hasCollectedWinnings(address account) public view returns (bool) {
        return submissions[account].collectedWinnings;
    }
}
