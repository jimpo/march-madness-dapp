const crypto = require('crypto');

const MarchMadness = artifacts.require("./MarchMadness.sol");

contract('MarchMadness', (accounts) => {
  let marchMadness;

  const defaultEntryFee = 100000000000;
  const defaultTournamentStartTime = () => dateToTimestamp(new Date()) + 10;
  const defaultScoringDuration = 60 * 60 * 24;

  let entryFee, tournamentStartTime, scoringDuration;
  resetDefaultContractParameters();

  beforeEach(() => {
    return MarchMadness.new(entryFee, tournamentStartTime(), scoringDuration, "IPFS_HASH")
      .then((instance) => marchMadness = instance);
  });

  describe("constructor", () => {
    it("sets initial state", () => {
      const calls = [
        marchMadness.creator(),
        marchMadness.entryFee(),
        marchMadness.tournamentStartTime(),
        marchMadness.scoringDuration()
      ];
      return Promise.all(calls)
        .then((results) => {
          assert.equal(results[0], accounts[0]);
          assert.equal(results[1], entryFee);
          assert.equal(results[2], tournamentStartTime());
          assert.equal(results[3], scoringDuration);
        });
    });
  });

  describe("#submitBracket", () => {
    const commitment = crypto.randomBytes(32).toString('hex');

    it("accepts submissions with an entry fee", () => {
      return marchMadness.submitBracket(commitment, { value: entryFee });
    });

    it("rejects submissions without the entry fee", () => {
      return marchMadness.submitBracket(commitment)
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => {
          assert.include(error.message, "VM Exception while processing transaction");
        });
    });

    describe("after the tournament has started", () => {
      before(() => {
        tournamentStartTime = () => dateToTimestamp(new Date()) - 10;
      });
      after(resetDefaultContractParameters);

      it("rejects submission attempts", () => {
        return marchMadness.submitBracket(commitment, { value: entryFee })
          .then(() => assert.fail("Expected error to be thrown"))
          .catch((error) => {
            assert.include(error.message, "VM Exception while processing transaction");
          });
      });
    });

    it("rejects resubmission attempts", () => {
      return marchMadness.submitBracket(commitment, { value: entryFee })
        .then(() => {
          return marchMadness.submitBracket(commitment, { value: entryFee });
        })
        .then(() => assert.fail("Expected error to be thrown"))
        .catch((error) => {
          assert.include(error.message, "VM Exception while processing transaction");
        });
    });
  });

  describe("#submitResults", () => {
    const results = "0x8000000000000000";

    describe("before the tournament has started", () => {
      it("does nothing", () => {
        return marchMadness.submitResults(results)
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
        return marchMadness.submitResults(results)
          .then((txDetails) => {
            assert.equal(txDetails.logs[0].event, 'TournamentOver');

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

      it("rejects submissions that are not from the contract creator", () => {
        return marchMadness.submitResults(results, { from: accounts[1] })
          .then(() => marchMadness.results())
          .then((contractResults) => {
            assert.equal(contractResults, '0x0000000000000000');
          });
      });

      it("does not allow multiple submissions", () => {
        return marchMadness.submitResults(results)
          .then(() => marchMadness.submitResults('0x8000000000000001'))
          .then(() => marchMadness.results())
          .then((contractResults) => {
            assert.equal(contractResults, results);
          });
      });
    });
  });

  describe("#revealBracket", () => {
    const results = "0x8000000000000000";

    const entries = [
      {
        address: accounts[0],
        bracket: "0xC000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      },
      {
        address: accounts[1],
        bracket: "0xF000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      },
      {
        address: accounts[2],
        bracket: "0xC000000000000000",
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
        const commitment =
          web3.sha3(address + bracket.slice(2) + salt.slice(2), { encoding: 'hex' });
        return marchMadness.submitBracket(commitment, { value: entryFee, from: address })
          .then(() => marchMadness.getCommitment(address))
          .then((contractCommitment) => assert.equal(contractCommitment, commitment));
      });
      return Promise.all(calls)
        .then(() => waitForSeconds(1)); // Wait for tournament to start
    });

    describe("before results have been submitted", () => {
      it("does not score brackets", () => {
        const {bracket, salt, address} = entries[0];
        return marchMadness.revealBracket(bracket, salt, { from: address })
          .then(() => marchMadness.getScore(address))
          .then((score) => assert.equal(score, 0));
      });
    });

    describe("after results have been submitted", () => {
      beforeEach(() => {
        return marchMadness.submitResults(results)
          .then(() => marchMadness.results())
          .then((contractResults) => assert.equal(contractResults, results));
      });

      it("does not score brackets that don't match the commitment", () => {
        const {salt, address} = entries[0];
        const bracket = results;
        return marchMadness.revealBracket(bracket, salt, { from: address })
          .then(() => marchMadness.getScore(address))
          .then((score) => assert.equal(score, 0));
      });

      it("does not score brackets after the scoring period ends", () => {
        const {bracket, salt, address} = entries[0];
        return waitForSeconds(1)
          .then(() => marchMadness.revealBracket(bracket, salt, { from: address }))
          .then(() => marchMadness.getScore(address))
          .then((score) => assert.equal(score, 0));
      });

      it("assigns the bracket a score", () => {
        entries[0].expectedScore = 32 * 5;
        entries[1].expectedScore = 32 * 4;
        entries[2].expectedScore = 32 * 5;

        const assertions = entries.map(({bracket, salt, address, expectedScore}) => {
          return marchMadness.revealBracket(bracket, salt, { from: address })
            .then(() => marchMadness.getScore(address))
            .then((score) => assert.equal(score, expectedScore));
        });
        return Promise.all(assertions);
      });

      it("logs new winners", () => {
        return Promise.resolve()
          .then(() => {
            const {bracket, salt, address} = entries[0];
            return marchMadness.revealBracket(bracket, salt, { from: address })
              .then(({logs}) => assert.equal(logs[0].event, 'NewWinner'));
          })
          .then(() => {
            const {bracket, salt, address} = entries[1];
            return marchMadness.revealBracket(bracket, salt, { from: address })
              .then(({logs}) => assert.lengthOf(logs, 0));
          })
          .then(() => {
            const {bracket, salt, address} = entries[2];
            return marchMadness.revealBracket(bracket, salt, { from: address })
              .then(({logs}) => assert.equal(logs[0].event, 'NewWinner'));
          });
      });
    });
  });

  describe("#collectWinnings", () => {
    const results = "0x8000000000000000";

    const entries = [
      {
        address: accounts[0],
        bracket: "0xC000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      },
      {
        address: accounts[1],
        bracket: "0xF000000000000000",
        salt: "0x" + crypto.randomBytes(16).toString('hex')
      },
      {
        address: accounts[2],
        bracket: "0xC000000000000000",
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
        const commitment =
          web3.sha3(address + bracket.slice(2) + salt.slice(2), { encoding: 'hex' });
        return marchMadness.submitBracket(commitment, { value: entryFee, from: address })
          .then(() => marchMadness.getCommitment(address))
          .then((contractCommitment) => assert.equal(contractCommitment, commitment));
      });
      return Promise.all(calls)
        .then(() => waitForSeconds(1)) // Wait for tournament to start
        .then(() => {
          return marchMadness.submitResults(results)
            .then(() => marchMadness.results())
            .then((contractResults) => assert.equal(contractResults, results));
        });
    });

    it("does not allow withdrawals before the scoring period ends", () => {
      const {bracket, salt, address} = entries[0];
      let initialBalance = web3.eth.getBalance(address).toString();
      return marchMadness.revealBracket(bracket, salt, { from: address, gasPrice: 0 })
        .then(({logs}) => assert.equal(logs[0].event, 'NewWinner'))
        .then(() => marchMadness.collectWinnings({ from: address, gasPrice: 0 }))
        .then(() => {
          assert.equal(web3.eth.getBalance(address).toString(), initialBalance.toString());
        });
    });

    it("splits the winnings between all entries with a winning score", () => {
      entries[0].expectedWinnings = entryFee * 3 / 2;
      entries[1].expectedWinnings = 0;
      entries[2].expectedWinnings = entryFee * 3 / 2;

      const scoringCalls = entries.map(({bracket, salt, address}) => {
        return marchMadness.revealBracket(bracket, salt, { from: address, gasPrice: 0 });
      });

      return Promise.all(scoringCalls)
        .then(() => waitForSeconds(1)) // Wait for scoring period to end
        .then(() => {
          const assertions = entries.map(({bracket, salt, address, expectedWinnings}) => {
            const initialBalance = web3.eth.getBalance(address);
            return marchMadness.collectWinnings({ from: address, gasPrice: 0 })
              .then(() => {
                const expectedBalance = initialBalance.plus(expectedWinnings);
                assert.equal(web3.eth.getBalance(address).toString(), expectedBalance.toString());
              });
          });
          return Promise.all(assertions);
        });
    });
  });

  function dateToTimestamp(date) {
    return Math.floor(date.getTime() / 1000);
  }

  function resetDefaultContractParameters() {
    entryFee = defaultEntryFee;
    tournamentStartTime = defaultTournamentStartTime;
    scoringDuration = defaultScoringDuration;
  }

  function waitForSeconds(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
});
