pragma solidity ^0.4.19;

/// @title Oracle contract where m of n predetermined voters determine a value
contract FederatedOracleBytes8 {
    struct Voter {
        // Whether this account is a registered voter.
        bool isVoter;

        // Whether this account's vote has been counted.
        bool hasVoted;

        // IPFS hash of PGP signed proof of voter identity.
        string identityIPFSHash;
    }

    event VoterAdded(address account);
    event VoteSubmitted(address account, bytes8 value);
    event ValueFinalized(bytes8 value);

    mapping(address => Voter) public voters;
    mapping(bytes8 => uint8) public votes;

    uint8 public m;
    uint8 public n;
    bytes8 public finalValue;

    uint8 private voterCount;
    address private creator;

    function FederatedOracleBytes8(uint8 m_, uint8 n_) public {
        creator = msg.sender;
        m = m_;
        n = n_;
    }

    function addVoter(address account, string identityIPFSHash) public {
        require(msg.sender == creator);
        require(voterCount < n);

        var voter = voters[account];
        require(!voter.isVoter);

        voter.identityIPFSHash = identityIPFSHash;
        voterCount++;
        VoterAdded(account);
    }

    function submitValue(bytes8 value) public {
        var voter = voters[msg.sender];
        require(voter.isVoter);
        require(!voter.hasVoted);

        voter.hasVoted = true;
        votes[value]++;
        VoteSubmitted(msg.sender, value);

        if (votes[value] == m) {
            finalValue = value;
            ValueFinalized(value);
        }
    }
}
