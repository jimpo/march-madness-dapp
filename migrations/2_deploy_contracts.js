var ByteBracket = artifacts.require("./ByteBracket.sol");
var MarchMadness = artifacts.require("./MarchMadness.sol");

function dateToTimestamp(date) {
  return Math.floor(date.getTime() / 1000);
}

module.exports = function(deployer) {
  deployer.deploy(ByteBracket);
  deployer.link(ByteBracket, MarchMadness);
  deployer.deploy(
    MarchMadness,
    1000000, // entryFee
    dateToTimestamp(new Date(2017, 3, 1)), // tournamentStartTime
    7 * 24 * 60 * 60, // scoringDuration
    "QmR9ExGuAYYgCsApgQ4eGHS2g46Wa2RxMKBCGqSWbWJiUW" // tournamentDataIPFSHash
  );
};
