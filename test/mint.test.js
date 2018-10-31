const shouldFail = require("./helper/shouldFail");
const { expectThrow } = require("openzeppelin-solidity/test/helpers/expectThrow");
const expectEvent = require("openzeppelin-solidity/test/helpers/expectEvent");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const BatchSendOperator = artifacts.require("BatchSendOperator");
const BigNumber = web3.BigNumber;

let erc820Registry, selfToken, operator1;
const AMOUNT_TO_MINT = 100;

contract('SelfToken', function (accounts) {
  const [owner, user1, user2, user3, anyone] = accounts;

  before(async function () {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require('web3'); // version 1.0.0
    let _web3 = new _Web3(web3.currentProvider)

    erc820Registry = await ERC820Registry.deploy(_web3, accounts[0]);
    assert.ok(erc820Registry.$address);
  });

  it("should deploy new contract", async function () {
    selfToken = await SelfToken.new();
    // operator1 = await BatchSendOperator.new();
    // selfToken.addOfficialOperator(operator1.address, { from: owner });
  });

  it("should allow mint from operator1 to buyer1", async function () {

    // await expectEvent.inTransaction(
    //   selfToken.mint(user1, AMOUNT_TO_MINT, "", {from: operator1.address}),
    //   "Mint", {
    //     operator: operator1.address,
    //     to: user1,
    //     amount: AMOUNT_TO_MINT,
    //     operatorData:""
    //   }
    // );
    // await selfToken.mint(buyer1, 100, "");
    await selfToken.mint(user1, AMOUNT_TO_MINT, "", {from: owner});

    // await expectEvent.inTransaction(
    //   selfToken.mint(user1, AMOUNT_TO_MINT, "", {from: owner}),
    //   "Mint", {
    //     operator: owner,
    //     to: user1,
    //     amount: AMOUNT_TO_MINT,
    //     operatorData: ""
    //   }
    // );



  });


});