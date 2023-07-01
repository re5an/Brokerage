// const Migrations = artifacts.require("Migrations");
//
// module.exports = function (deployer) {
//   deployer.deploy(Migrations);
// };


const BrokerContract = artifacts.require("BrokerContract");

module.exports = function (deployer) {
  deployer.deploy(BrokerContract);
};
