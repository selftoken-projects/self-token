var SelfToken = artifacts.require("./SelfToken.sol");
const ERC820Registry = require('erc820');

module.exports = async function (deployer, network, accounts) {
  let _Web3 = require('web3'); // version 1.0.0
  let _web3 = new _Web3(web3.currentProvider)

  let erc820Registry = await ERC820Registry.deploy(_web3, accounts[0]);

  deployer.deploy(SelfToken);
};