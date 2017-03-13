var ByteBracket = artifacts.require("./ByteBracket.sol");
var FederatedOracleBytes8 = artifacts.require("./FederatedOracleBytes8.sol");
var MarchMadness = artifacts.require("./MarchMadness.sol");

function dateToTimestamp(date) {
  return Math.floor(date.getTime() / 1000);
}

module.exports = function(deployer) {
  return deployer.deploy(FederatedOracleBytes8, 3, 4)
    .then(() => deployer.deploy(ByteBracket))
    .then(() => deployer.link(ByteBracket, MarchMadness))
    .then(() => {
      return deployer.deploy(
        MarchMadness,
        250000000000000000, // entryFee
        Math.floor(Date.UTC(2017, 2, 16, 16, 0, 0) / 1000), // tournamentStartTime
        Math.floor(Date.UTC(2017, 3, 10, 0, 0, 0) / 1000), // noContestTime
        3 * 24 * 60 * 60, // scoringDuration
        1000, // maxSubmissions
        "QmZ8KnqotVrWgAtjkzH9m5QNonXyxvQNihkzL5Rgqg4jYB", // tournamentDataIPFSHash
        FederatedOracleBytes8.address // oracleAddress
      );
    });
};
