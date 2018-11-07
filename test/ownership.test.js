const shouldFail = require("./helper/shouldFail");
const expectEvent = require("openzeppelin-solidity/test/helpers/expectEvent");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const BigNumber = web3.BigNumber;
const { ether } = require('openzeppelin-solidity/test/helpers/ether');


let erc820Registry, selfToken;
const AMOUNT_TO_MINT = ether(1);

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
  });

  // only owner can mint
  it("only owner can mint", async function () {
    assert.ok(await selfToken.mint(user1, AMOUNT_TO_MINT, "", {from: owner}));
  });

  // fail when user 2 wants to mint
  it("fail when user wants to mint", async function () {
    await shouldFail.reverting(selfToken.mint(user1, AMOUNT_TO_MINT, "", {from: user2}));
  });

  // fail when user 2 wants to transferOwnership
  it("fail when user wants to mint", async function () {
    await shouldFail.reverting(selfToken.transferOwnership(user1, {from: user2}));
  });

  // transfer ownership to user1
  it("transfer ownership to user1", async function () {
    assert.ok(await selfToken.transferOwnership(user1, {from: owner}));
  });

  // owner can still mint before user 1 claims ownership
  it("owner can still mint before user 1 claims ownership", async function() {
    assert.ok(await selfToken.mint(user1, AMOUNT_TO_MINT, "", { from: owner }));
  });

  // user (new owner) can not mint, cuz user 1 is not yet an owner (need to claim)
  it("user (new owner) cannot mint", async function () {
    await shouldFail.reverting(selfToken.mint(user2, AMOUNT_TO_MINT, "", {from: user1}));
  });

  // user 2 cannot claim ownership
  it("user 2 cannot claim ownership", async function () {
    await shouldFail.reverting(selfToken.claimOwnership({from: user2}));
  });

  // user 1 claim ownership
  it("user 1 claim ownership", async function () {
    await expectEvent.inTransaction(
      selfToken.claimOwnership({from: user1}),
      "OwnershipTransferred", {
        previousOwner: owner,
        newOwner: user1
      }
    );
  });

  // user 1 cannot claim again
  it("user 1 cannot claim ownership again", async function () {
    await shouldFail.reverting(selfToken.claimOwnership({from: user1}));
  });

  // fail when original owner wants to mint
  it("fail when original owner wants to mint", async function () {
    await shouldFail.reverting(selfToken.mint(user1, AMOUNT_TO_MINT, "", {from: owner}));
  });

  // user 1 can mint token now
  it("only owner can mint", async function () {
    assert.ok(await selfToken.mint(user1, AMOUNT_TO_MINT, "", {from: user1}));
  });

  // user renounce ownership
  it("user 1 renounce ownership", async function () {
    await expectEvent.inTransaction(
      selfToken.renounceOwnership({from: user1}),
      "OwnershipRenounced", {
        previousOwner: user1
      }
    );
  });

  // fail when user wants to mint
  it("fail when user wants to mint", async function () {
    await shouldFail.reverting(selfToken.mint(user2, AMOUNT_TO_MINT, "", {from: user1}));
  });

});