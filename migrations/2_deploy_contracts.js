module.exports = function(deployer) {
  deployer.deploy(ByteBracket);
  deployer.autolink();
  deployer.deploy(MarchMadness);
};
