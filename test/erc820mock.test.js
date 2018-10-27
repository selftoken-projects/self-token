const chai = require("chai");
const ERC820 = require("erc820");

const assert = chai.assert;
chai.use(require("chai-as-promised")).should();
const log = msg => {
  if (process.env.MOCHA_VERBOSE) console.log(msg);
};

const SelfToken = artifacts.require("SelfToken");

contract("ERC820", function (accounts) {
  let _web3; // version 1.0.0
  let erc820Registry;

  it("should deploy ERC820", async () => {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require("web3"); // version 1.0.0
    _web3 = new _Web3(web3.currentProvider);

    erc820Registry = await ERC820.deploy(_web3, accounts[0]);
    assert.ok(erc820Registry.$address);
    log(erc820Registry.$address);
  }).timeout(20000);

  it("should deploy SelfToken as client", async () => {
    client_SelfToken = await SelfToken.new();
    assert.ok(client_SelfToken.address);
  }).timeout(20000);

  it("check ERC20 ERC777 compatibility", async () => {
    let erc20Hash = _web3.utils.keccak256('ERC20Token');
    let erc777Hash = _web3.utils.keccak256('ERC777Token');
    let erc20Addr = await erc820Registry.getInterfaceImplementer(client_SelfToken.address, erc20Hash);
    let erc777Addr = await erc820Registry.getInterfaceImplementer(client_SelfToken.address, erc777Hash);

    assert.strictEqual(erc20Addr.toLowerCase(), client_SelfToken.address);
    assert.strictEqual(erc777Addr.toLowerCase(), client_SelfToken.address);

  }).timeout(6000);

});