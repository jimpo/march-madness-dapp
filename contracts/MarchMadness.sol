pragma solidity ^0.4.4;

import "./ByteBracket.sol";

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
 */
contract MarchMadness {
    struct Submission {
        bytes32 commitment;
        bytes8 bracket;
        uint8 score;
        bool collectedWinnings;
    }

    event SubmissionAccepted(address account);
    event NewWinner(address winner, uint8 score);
    event TournamentOver();

	mapping(address => Submission) submissions;

    // Amount that winners will collect
    uint public winnings;

    // Number of submissions with a winning score
    uint public numWinners;

    // Data derived from results used by bracket scoring algorithm
    uint64 private scoringMask;

    // The address of the result oracle
    address public creator;

    // Fee in wei required to enter a bracket
    uint public entryFee;

    // Duration in seconds of the scoring phase
    uint public scoringDuration;

    // Timestamp of the start of the tournament phase
    uint public tournamentStartTime;

    // Timestamp of the end of the scoring phase
    uint public contestOverTime;

    // Byte bracket representation of the tournament results
    bytes8 public results;

    // The highest score of a bracket scored so far
    uint8 public winningScore;

    // IPFS hash of JSON file containing tournament information (eg. teams, regions, etc)
    string public tournamentDataIPFSHash;

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
        SubmissionAccepted(msg.sender);
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

    function revealBracket(bytes8 bracket, bytes16 salt) returns (bool) {
        var submission = submissions[msg.sender];
        if (sha3(msg.sender, bracket, salt) != submission.commitment) {
            return false;
        }

        submission.bracket = bracket;
        return true;
    }

    function scoreBracket(address account) returns (bool) {
        if (results == 0) {
            return false;
        }
        if (now >= contestOverTime) {
            return false;
        }

        var submission = submissions[account];
        if (submission.bracket == 0) {
            return false;
        }
        if (submission.score != 0) {
            return false;
        }

        submission.score = ByteBracket.getBracketScore(submission.bracket, results, scoringMask);

        if (submission.score > winningScore) {
            winningScore = submission.score;
            numWinners = 0;
        }
        if (submission.score == winningScore) {
            numWinners++;
            winnings = this.balance / numWinners;
            NewWinner(account, submission.score);
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

    function getBracketScore(bytes8 bracket) constant returns (uint8) {
        if (results == 0) {
            throw;
        }
        return ByteBracket.getBracketScore(bracket, results, scoringMask);
    }

    function getBracket(address account) constant returns (bytes8) {
        return submissions[account].bracket;
    }

    function getScore(address account) constant returns (uint8) {
        return submissions[account].score;
    }

    function getCommitment(address account) constant returns (bytes32) {
        return submissions[account].commitment;
    }

    function hasCollectedWinnings(address account) constant returns (bool) {
        return submissions[account].collectedWinnings;
    }
}
