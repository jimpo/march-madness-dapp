const FederatedOracleBytes8 = artifacts.require("./FederatedOracleBytes8.sol");

contract('FederatedOracleBytes8', (accounts) => {
  let federatedOracle;

  beforeEach(() => {
    return FederatedOracleBytes8.new(2, 3)
      .then((instance) => federatedOracle = instance);
  });

  describe("constructor", () => {
    it("sets initial state", () => {
      const calls = [
        federatedOracle.m(),
        federatedOracle.n()
      ];
      return Promise.all(calls)
        .then((results) => {
          assert.equal(results[0], 2);
          assert.equal(results[1], 3);
        });
    });
  });

  describe("#addVoter", () => {
    it("throws on calls that are not from the oracle creator", () => {
      return federatedOracle.addVoter(accounts[1], { from: accounts[1] })
        .then(() => assert.fail())
        .catch((e) => assert.include(e.message, "invalid JUMP"));
    });

    it("allows the creator to add up to n voters", () => {
      return federatedOracle.addVoter(accounts[1])
        .then(() => federatedOracle.addVoter(accounts[2]))
        .then(() => federatedOracle.addVoter(accounts[3]));
    });

    it("logs when a voter is added", () => {
      return federatedOracle.addVoter(accounts[1])
        .then(({logs}) => assert.equal(logs[0].event, 'VoterAdded'));
    });

    it("throws when adding a voter multiple times", () => {
      return federatedOracle.addVoter(accounts[1])
        .then(() => federatedOracle.addVoter(accounts[1]))
        .then(() => assert.fail())
        .catch((e) => assert.include(e.message, "invalid JUMP"));
    });

    it("throws when adding more than n voters", () => {
      return federatedOracle.addVoter(accounts[1])
        .then(() => federatedOracle.addVoter(accounts[2]))
        .then(() => federatedOracle.addVoter(accounts[3]))
        .then(() => federatedOracle.addVoter(accounts[4]))
        .then(() => assert.fail())
        .catch((e) => assert.include(e.message, "invalid JUMP"));
    });
  });

  describe("#submitValue", () => {
    const value = "0x1111111111111111";

    beforeEach(() => {
      return federatedOracle.addVoter(accounts[1])
        .then(() => federatedOracle.addVoter(accounts[2]))
        .then(() => federatedOracle.addVoter(accounts[3]));
    });

    it("throws if called by non-approved voter", () => {
      return federatedOracle.submitValue("0x1111111111111111")
        .then(() => assert.fail())
        .catch((e) => assert.include(e.message, "invalid JUMP"));
    });

    it("throws if a voter attempts to vote multiple times", () => {
      return federatedOracle.submitValue("0x1111111111111111", { from: accounts[1] })
        .then(() => federatedOracle.submitValue("0x1111111111111111", { from: accounts[1] }))
        .then(() => assert.fail())
        .catch((e) => assert.include(e.message, "invalid JUMP"));
    });

    it("assigns the finalized value after m voters submit the same value", () => {
      return federatedOracle.submitValue("0x1111111111111111", { from: accounts[1] })
        .then(() => federatedOracle.finalValue())
        .then((value) => assert.equal(value, "0x0000000000000000"))
        .then(() => federatedOracle.submitValue("0x2222222222222222", { from: accounts[2] }))
        .then(() => federatedOracle.finalValue())
        .then((value) => assert.equal(value, "0x0000000000000000"))
        .then(() => federatedOracle.submitValue("0x1111111111111111", { from: accounts[3] }))
        .then(({logs}) => assert.equal(logs[1].event, 'ValueFinalized'))
        .then(() => federatedOracle.finalValue())
        .then((value) => assert.equal(value, "0x1111111111111111"));
    });
  });
});
