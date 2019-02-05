var ByteBracket = artifacts.require("./ByteBracket.sol");
var FederatedOracleBytes8 = artifacts.require("./FederatedOracleBytes8.sol");
var MarchMadness = artifacts.require("./MarchMadness.sol");

function timestampUTC() {
  return Math.floor(Date.UTC.apply(this, arguments) / 1000);
}

module.exports = function(deployer) {
  return deployer.deploy(FederatedOracleBytes8, 1, 1)
    .then(() => deployer.deploy(ByteBracket))
    .then(() => deployer.link(ByteBracket, MarchMadness))
    .then(() => {
      return deployer.deploy(
        MarchMadness,
        "250000000000000000", // entryFee
        timestampUTC(2017, 3, 21, 17, 0, 0), // tournamentStartTime
        timestampUTC(2017, 4, 15, 0, 0, 0), // noContestTime
        3 * 24 * 60 * 60, // scoringDuration
        1000, // maxSubmissions
        "QmTb8m7igYRawLAjMQCUXn67KNQu21sjarTfqHV7aCV3eY", // tournamentDataIPFSHash
        FederatedOracleBytes8.address // oracleAddress
      );
    });
};
