const crypto = require('crypto');
const {assertRevert} = require('./helpers');

const FederatedOracleBytes8 = artifacts.require("./FederatedOracleBytes8.sol");
const MarchMadness = artifacts.require("./MarchMadness.sol");

contract('MarchMadness', (accounts) => {
  let marchMadness, federatedOracle;

  const defaultEntryFee = 100000000000;
  const defaultTournamentStartTime = () => dateToTimestamp(new Date()) + 10;
  const defaultNoContestTime = () => dateToTimestamp(new Date()) + 100;
  const defaultScoringDuration = 60 * 60 * 24;
  const defaultMaxSubmissions = 100;

  let entryFee, tournamentStartTime, noContestTime, scoringDuration, maxSubmissions;
  resetDefaultContractParameters();

  const results = "0x8000000000000000";

  before(() => {
    return FederatedOracleBytes8.new(1, 1)
      .then((instance) => federatedOracle = instance)
      .then(() => federatedOracle.addVoter(accounts[0], "IPFS_PROOF_HASH"))
      .then(() => federatedOracle.submitValue(results))
      .then(() => federatedOracle.finalValue())
      .then((value) => assert.equal(value, results));
  });

  beforeEach(() => {
    return MarchMadness.new(
      entryFee,
      tournamentStartTime(),
      noContestTime(),
      scoringDuration,
      maxSubmissions,
      "IPFS_HASH",
      federatedOracle.address
    )
      .then((instance) => marchMadness = instance);
  });

  describe("constructor", () => {
    it("sets initial state", () => {
      const calls = [
        marchMadness.entryFee(),
        marchMadness.tournamentStartTime(),
        marchMadness.scoringDuration()
      ];
      return Promise.all(calls)
        .then((results) => {
          assert.equal(results[0], entryFee);
          assert.equal(results[1], tournamentStartTime());
          assert.equal(results[2], scoringDuration);
        });
    });
  });

  describe("#submitBracket", () => {
    const commitment = "0x" + crypto.randomBytes(32).toString('hex');

    it("accepts submissions with an entry fee", () => {
      return marchMadness.submitBracket(commitment, { value: entryFee });
    });

    it("rejects submissions without the entry fee", () => {
      return assertRevert(marchMadness.submitBracket(commitment));
    });

    describe("after the tournament has started", () => {
      before(() => {
        tournamentStartTime = () => dateToTimestamp(new Date()) - 10;
      });
      after(resetDefaultContractParameters);

      it("rejects submission attempts", () => {
        return marchMadness.submitBracket(commitment, { value: entryFee })
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => assert.include(error.message, "revert"));
      });
    });

    it("rejects resubmission attempts", () => {
      return marchMadness.submitBracket(commitment, { value: entryFee })
        .then(() => {
          return marchMadness.submitBracket(commitment, { value: entryFee });
        })
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => assert.include(error.message, "revert"));
    });
  });

  describe("#startScoring", () => {
    describe("before the tournament has started", () => {
      it("does nothing", () => {
        return assertRevert(marchMadness.startScoring())
          .then(() => marchMadness.results())
          .then((contractResults) => {
            assert.equal(contractResults, '0x0000000000000000');
          });
      });
    });

    describe("after the tournament has started", () => {
      before(() => {
        tournamentStartTime = () => dateToTimestamp(new Date()) - 10;
      });
      after(resetDefaultContractParameters);

      it("assigns the results and contestOverTime and logs TournamentOver", () => {
        return marchMadness.startScoring()
          .then(({logs}) => {
            assert.equal(logs[0].event, 'TournamentOver');

            const calls = [
              marchMadness.results(),
              marchMadness.contestOverTime()
            ];
            return Promise.all(calls)
              .then(([contractResults, contestOverTime]) => {
                const now = dateToTimestamp(new Date());
                assert.equal(contractResults, results);
                assert.equal(contestOverTime, now + scoringDuration);
              });
          });
      });

      it("can only be called once", () => {
        return marchMadness.startScoring()
          .then(() => assertRevert(marchMadness.startScoring()));
      });
    });
  });

  describe("#revealBracket", () => {
    const bracket = "0xffffffffffffffff";
    const salt = "0x" + crypto.randomBytes(16).toString('hex');

    beforeEach(() => {
      const commitment = web3.utils.keccak256(
        "0x" + accounts[0].slice(2) + bracket.slice(2) + salt.slice(2)
      );
      return marchMadness.submitBracket(commitment, { value: entryFee })
        .then(() => marchMadness.getCommitment(accounts[0]))
        .then((contractCommitment) => assert.equal(contractCommitment, commitment));
    });

    it("stores the bracket in the contract", () => {
      return marchMadness.revealBracket(bracket, salt)
        .then(() => marchMadness.getBracket(accounts[0]))
        .then((bracket_) => assert.equal(bracket_, bracket));
    });

    it("does not accept brackets that don't match the commitment", () => {
      const incorrectSalt = "0x" + crypto.randomBytes(16).toString('hex');
      return assertRevert(marchMadness.revealBracket(bracket, incorrectSalt))
        .then(() => marchMadness.getBracket(accounts[0]))
        .then((bracket_) => assert.equal(bracket_, '0x0000000000000000'));
    });
  });

  describe("#scoreBracket", () => {
    const entries = [
      {
        address: accounts[0],
        bracket: "0xc000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      },
      {
        address: accounts[1],
        bracket: "0xf000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      },
      {
        address: accounts[2],
        bracket: "0xc000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      }
    ];

    before(() => {
      tournamentStartTime = () => dateToTimestamp(new Date()) + 1;
      scoringDuration = 1;
    });
    after(resetDefaultContractParameters);

    beforeEach(() => {
      const calls = entries.map(({address, bracket, salt}) => {
        const commitment = web3.utils.keccak256(
          "0x" + address.slice(2) + bracket.slice(2) + salt.slice(2)
        );
        return marchMadness.submitBracket(commitment, { value: entryFee, from: address })
          .then(() => marchMadness.revealBracket(bracket, salt, { from: address }))
          .then(() => marchMadness.getBracket(address))
          .then((bracket_) => assert.equal(bracket_, bracket));
      });
      return Promise.all(calls)
        .then(() => waitForSeconds(1)); // Wait for tournament to start
    });

    describe("before results have been submitted", () => {
      it("does not score brackets", () => {
        const {bracket, salt, address} = entries[0];
        return assertRevert(marchMadness.scoreBracket(address))
          .then(() => marchMadness.getScore(address))
          .then((score) => assert.equal(score, 0));
      });
    });

    describe("after results have been submitted", () => {
      beforeEach(() => {
        return marchMadness.startScoring()
          .then(() => marchMadness.results())
          .then((contractResults) => assert.equal(contractResults, results));
      });

      it("does not score brackets after the scoring period ends", () => {
        const {bracket, salt, address} = entries[0];
        return waitForSeconds(1)
          .then(() => assertRevert(marchMadness.scoreBracket(address)))
          .then(() => marchMadness.getScore(address))
          .then((score) => assert.equal(score, 0));
      });

      it("assigns the bracket a score", () => {
        entries[0].expectedScore = 32 * 5;
        entries[1].expectedScore = 32 * 4;
        entries[2].expectedScore = 32 * 5;

        const assertions = entries.map(({bracket, salt, address, expectedScore}) => {
          return marchMadness.scoreBracket(address)
            .then(() => marchMadness.getScore(address))
            .then((score) => assert.equal(score, expectedScore));
        });
        return Promise.all(assertions);
      });

      it("logs new winners", () => {
        return Promise.resolve()
          .then(() => {
            const {bracket, salt, address} = entries[0];
            return marchMadness.scoreBracket(address)
              .then(({logs}) => assert.equal(logs[0].event, 'NewWinner'));
          })
          .then(() => {
            const {bracket, salt, address} = entries[1];
            return marchMadness.scoreBracket(address)
              .then(({logs}) => assert.lengthOf(logs, 0));
          })
          .then(() => {
            const {bracket, salt, address} = entries[2];
            return marchMadness.scoreBracket(address)
              .then(({logs}) => assert.equal(logs[0].event, 'NewWinner'));
          });
      });
    });
  });

  describe("#collectWinnings", () => {
    const entries = [
      {
        address: accounts[0],
        bracket: "0xc000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      },
      {
        address: accounts[1],
        bracket: "0xf000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      },
      {
        address: accounts[2],
        bracket: "0xc000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      }
    ];

    before(() => {
      tournamentStartTime = () => dateToTimestamp(new Date()) + 1;
      scoringDuration = 1;
    });
    after(resetDefaultContractParameters);

    beforeEach(() => {
      const calls = entries.map(({address, bracket, salt}) => {
        const commitment = web3.utils.keccak256(
          "0x" + address.slice(2) + bracket.slice(2) + salt.slice(2)
        );
        return marchMadness.submitBracket(commitment, { value: entryFee, from: address })
          .then(() => marchMadness.revealBracket(bracket, salt, { from: address }))
          .then(() => marchMadness.getBracket(address))
          .then((bracket_) => assert.equal(bracket_, bracket));
      });
      return Promise.all(calls)
        .then(() => waitForSeconds(1)) // Wait for tournament to start
        .then(() => {
          return marchMadness.startScoring()
            .then(() => marchMadness.results())
            .then((contractResults) => assert.equal(contractResults, results));
        });
    });

    it("does not allow withdrawals before the scoring period ends", () => {
      const {bracket, salt, address} = entries[0];
      return web3.eth.getBalance(address)
        .then((initialBalance) => {
          return marchMadness.scoreBracket(address, { gasPrice: 0 })
            .then(({logs}) => assert.equal(logs[0].event, 'NewWinner'))
            .then(() => assertRevert(
              marchMadness.collectWinnings({ from: address, gasPrice: 0 })
            ))
            .then(() => web3.eth.getBalance(address))
            .then((finalBalance) => assert.equal(finalBalance, initialBalance));
        });
    });

    it("splits the winnings between all entries with a winning score", () => {
      entries[0].expectedWinnings = entryFee * 3 / 2;
      entries[1].expectedWinnings = 0;
      entries[2].expectedWinnings = entryFee * 3 / 2;

      const scoringCalls = entries.map(({bracket, salt, address}) => {
        return marchMadness.scoreBracket(address, { gasPrice: 0 });
      });

      return Promise.all(scoringCalls)
        .then(() => waitForSeconds(1)) // Wait for scoring period to end
        .then(() => {
          const assertions = entries.map(({bracket, salt, address, expectedWinnings}) => {
            return web3.eth.getBalance(address)
              .then((initialBalance) => {
                return marchMadness.collectWinnings({ from: address, gasPrice: 0 })
                  .then(() => web3.eth.getBalance(address))
                  .then((finalBalance) => {
                    const expectedBalance = web3.utils.toBN(initialBalance)
                          .add(web3.utils.toBN(expectedWinnings))
                          .toString();
                    assert.equal(finalBalance, expectedBalance);
                  });
              });
          });
          return Promise.all(assertions);
        });
    });
  });

  describe("#collectEntryFee", () => {
    const commitment = "0x" + crypto.randomBytes(32).toString('hex');
    const address = accounts[0];

    before(() => {
      tournamentStartTime = () => dateToTimestamp(new Date()) + 1;
      noContestTime = () => dateToTimestamp(new Date()) + 2;
    });

    beforeEach(() => {
      return marchMadness.submitBracket(commitment, { from: address, value: entryFee })
        .then(() => waitForSeconds(1)); // Wait for tournament to start
    });

    it("does not allow entrants to collect fees before the no contest time", () => {
      return web3.eth.getBalance(address)
        .then((initialBalance) => {
          return marchMadness.collectEntryFee({ from: address, gasPrice: 0 })
            .then(() => web3.eth.getBalance(address))
            .then((finalBalance) => assert.equal(finalBalance, initialBalance));
        });
    });

    it("does not allow entrants to collect fees if the results were submitted", () => {
      return marchMadness.startScoring()
        .then(() => waitForSeconds(1))
        .then(() => web3.eth.getBalance(address))
        .then((initialBalance) => {
          return assertRevert(marchMadness.collectEntryFee({ from: address, gasPrice: 0 }))
            .then(() => web3.eth.getBalance(address))
            .then((finalBalance) => assert.equal(finalBalance, initialBalance));
        });
    });

    it("allows entrants to reclaim their entry fees once after the no contest time", () => {
      return web3.eth.getBalance(address)
        .then((initialBalance) => {
          return waitForSeconds(1)
            .then(() => marchMadness.collectEntryFee({ from: address, gasPrice: 0 }))
            .then(() => assertRevert(marchMadness.collectEntryFee({ from: address, gasPrice: 0 })))
            .then(() => web3.eth.getBalance(address))
            .then((finalBalance) => {
              const expectedBalance = web3.utils.toBN(initialBalance)
                    .add(web3.utils.toBN(entryFee))
                    .toString();
              assert.equal(finalBalance, expectedBalance);
            });
        });
    });
  });

  function dateToTimestamp(date) {
    return Math.floor(date.getTime() / 1000);
  }

  function resetDefaultContractParameters() {
    entryFee = defaultEntryFee;
    tournamentStartTime = defaultTournamentStartTime;
    noContestTime = defaultNoContestTime;
    scoringDuration = defaultScoringDuration;
    maxSubmissions = defaultMaxSubmissions;
  }

  function waitForSeconds(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
});
