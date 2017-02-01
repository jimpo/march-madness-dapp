pragma solidity ^0.4.2;

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

    address public creator;
    uint public entryFee;
    uint public scoringDuration;
    uint public tournamentStartTime;
    uint public contestOverTime;
    bytes8 public results;
    uint8 public winningScore;

    // Setup
    // Submissions
    // Tournament
    // Scoring
    // Contest Over

	function MarchMadness(
        uint entryFee_,
        uint tournamentStartTime_,
        uint scoringDuration_
    ) {
        creator = msg.sender;
		entryFee = entryFee_;
        tournamentStartTime = tournamentStartTime_;
        scoringDuration = scoringDuration_;
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
        contestOverTime = now + scoringDuration;
        TournamentOver();
        return true;
    }

    function scoreBracket(bytes8 bracket, bytes32 salt) returns (bool) {
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
        submission.score = getBracketScore(bracket);

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

    // TODO: Look into pass by reference of parameter
    function getBracketScore(bytes8 bracket) constant returns (uint8) {
        return 1;
    }
}
