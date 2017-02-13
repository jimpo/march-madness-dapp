pragma solidity ^0.4.4;

import "./ByteBracket.sol";

contract MarchMadness {
    struct Submission {
        bytes32 commitment;
        bytes8 bracket;
        uint8 score;
        bool collectedWinnings;
    }

    event NewWinner(address winner, uint8 score);
    event TournamentOver();

	mapping(address => Submission) submissions;

    // Amount that winners will collect
    uint private winnings;

    // Number of submissions with a winning score
    uint private numWinners;

    uint64 private scoringMask;

    address public creator;
    uint public entryFee;
    uint public scoringDuration;
    uint public tournamentStartTime;
    uint public contestOverTime;
    bytes8 public results;
    uint8 public winningScore;
    string public tournamentDataIPFSHash;

    // Setup
    // Submissions
    // Tournament
    // Scoring
    // Contest Over

	function MarchMadness(
        uint entryFee_,
        uint tournamentStartTime_,
        uint scoringDuration_,
        string tournamentDataIPFSHash_
    ) {
        creator = msg.sender;
		entryFee = entryFee_;
        tournamentStartTime = tournamentStartTime_;
        scoringDuration = scoringDuration_;
        tournamentDataIPFSHash = tournamentDataIPFSHash_;
	}

    function submitBracket(bytes32 commitment) payable {
        if (msg.value != entryFee) {
            throw;
        }
        if (now >= tournamentStartTime) {
            throw;
        }

        var submission = submissions[msg.sender];
        if (submission.commitment != 0) {
            throw;
        }

        submission.commitment = commitment;
    }

    function submitResults(bytes8 results_) returns (bool) {
        if (results != 0) {
            return false;
        }
        if (now < tournamentStartTime) {
            return false;
        }
        if (msg.sender != creator) {
            return false;
        }

        results = results_;
        scoringMask = ByteBracket.getScoringMask(results);
        contestOverTime = now + scoringDuration;
        TournamentOver();
        return true;
    }

    function scoreBracket(bytes8 bracket, bytes16 salt) returns (bool) {
        if (results == 0) {
            return false;
        }
        if (now >= contestOverTime) {
            return false;
        }

        var submission = submissions[msg.sender];
        if (submission.score != 0) {
            return false;
        }
        if (sha3(bracket, salt) != submission.commitment) {
            return false;
        }

        submission.bracket = bracket;
        // TODO: Look into pass by reference of bracket argument
        submission.score = ByteBracket.getBracketScore(bracket, results, scoringMask);

        if (submission.score > winningScore) {
            winningScore = submission.score;
            numWinners = 0;
        }
        if (submission.score == winningScore) {
            numWinners++;
            winnings = this.balance / numWinners;
            NewWinner(msg.sender, submission.score);
        }

        return true;
    }

    function collectWinnings() returns (bool) {
        if (now < contestOverTime) {
            return false;
        }

        var submission = submissions[msg.sender];
        if (submission.score != winningScore) {
            return false;
        }
        if (submission.collectedWinnings) {
            return false;
        }

        submission.collectedWinnings = true;

        if (!msg.sender.send(winnings)) {
            throw;
        }

        return true;
    }

    function getCommitment(address account) constant returns (bytes32) {
        return submissions[account].commitment;
    }
}
