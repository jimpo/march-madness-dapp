var ByteBracket = artifacts.require("./ByteBracket.sol");
var FederatedOracleBytes8 = artifacts.require("./FederatedOracleBytes8.sol");
var MarchMadness = artifacts.require("./MarchMadness.sol");

function dateToTimestamp(date) {
  return Math.floor(date.getTime() / 1000);
}

module.exports = function(deployer) {
  return deployer.deploy(FederatedOracleBytes8, 1, 1)
    .then(() => deployer.deploy(ByteBracket))
    .then(() => deployer.link(ByteBracket, MarchMadness))
    .then(() => {
      return deployer.deploy(
        MarchMadness,
        500000000000000000, // entryFee
        dateToTimestamp(new Date()) + 5 * 60, // tournamentStartTime
        3 * 60, // scoringDuration
        "QmfAA8123Kvh3cCPw6UJvDeTeU6JKMsk8K9aBkZz2w25qj", // tournamentDataIPFSHash
        FederatedOracleBytes8.address // oracleAddress
      );
    });
};
