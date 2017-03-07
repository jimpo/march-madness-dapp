var ByteBracket = artifacts.require("./ByteBracket.sol");
var FederatedOracleBytes8 = artifacts.require("./FederatedOracleBytes8.sol");
var MarchMadness = artifacts.require("./MarchMadness.sol");

function dateToTimestamp(date) {
  return Math.floor(date.getTime() / 1000);
}

module.exports = function(deployer) {
  deployer.deploy(FederatedOracleBytes8);
  deployer.deploy(ByteBracket);
  deployer.link(ByteBracket, MarchMadness);
  deployer.deploy(
    MarchMadness,
    1000000000000000000, // entryFee
    dateToTimestamp(new Date()) + 24 * 60 * 60, // tournamentStartTime
    24 * 60 * 60, // scoringDuration
    "QmfAA8123Kvh3cCPw6UJvDeTeU6JKMsk8K9aBkZz2w25qj" // tournamentDataIPFSHash
  );
};
