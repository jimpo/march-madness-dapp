const crypto = require('crypto');

const MarchMadness = artifacts.require("./MarchMadness.sol");

contract('MarchMadness', (accounts) => {
  let marchMadness;

  let entryFee = 100000000000;
  let tournamentStartTime = dateToTimestamp(new Date()) + 10;
  let scoringDuration = 60 * 60 * 24;

  beforeEach(() => {
    return MarchMadness.new(entryFee, tournamentStartTime, scoringDuration, "IPFS_HASH")
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
          assert.equal(results[2], tournamentStartTime);
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
      let originalTournamentStartTime;

      before(() => {
        originalTournamentStartTime = tournamentStartTime;
        tournamentStartTime = dateToTimestamp(new Date()) - 10;
      });
      after(() => tournamentStartTime = originalTournamentStartTime);

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
      let originalTournamentStartTime;

      before(() => {
        originalTournamentStartTime = tournamentStartTime;
        tournamentStartTime = dateToTimestamp(new Date()) - 10;
      });
      after(() => tournamentStartTime = originalTournamentStartTime);

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

  describe("#scoreBracket", () => {
  });

  function dateToTimestamp(date) {
    return Math.floor(date.getTime() / 1000);
  }
});
