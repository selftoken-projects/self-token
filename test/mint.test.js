const shouldFail = require("./helper/shouldFail");
const expectEvent = require("./helper/expectEvent");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const BatchSendOperator = artifacts.require("BatchSendOperator");
const {
  ether
} = require('openzeppelin-solidity/test/helpers/ether');

let erc820Registry, selfToken, operator1;
const AMOUNT_TO_MINT = ether(100);
const CAP = ether(1e9);

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

  it("total supply should be zero", async function () {
    (await selfToken.totalSupply()).should.be.bignumber.equal(0);
  });

  it("total supply CAP should be 10000000000000", async function () {
    (await selfToken.totalSupplyCap()).should.be.bignumber.equal(CAP);
  });

  it("should not allow non-owner to mint", async function () {
    await shouldFail.reverting(selfToken.mint(user1, AMOUNT_TO_MINT, "", {
      from: user2
    }));
  });

  it("should allow mint from owner to buyer1", async function () {
    // Minted: owner mints 100 to user1
    await expectEvent.inTransaction(
      selfToken.mint(user1, AMOUNT_TO_MINT, "", {
        from: owner
      }),
      "Minted", {
        operator: owner,
        to: user1,
        amount: AMOUNT_TO_MINT,
        operatorData: "0x"
      }
    );

    // total supply == amount to mint == 100
    (await selfToken.totalSupply()).should.be.bignumber.equal(AMOUNT_TO_MINT);

    // check user1 balance
    (await selfToken.balanceOf(user1)).should.be.bignumber.equal(AMOUNT_TO_MINT);
  });

  // cannot exceed cap
  it("should not allow exceed cap", async function () {
    await shouldFail.reverting(selfToken.mint(user2, CAP, "", {
      from: owner
    }));

    // total supply == amount to mint == 100
    (await selfToken.totalSupply()).should.be.bignumber.equal(AMOUNT_TO_MINT);

    // check user2 balance
    (await selfToken.balanceOf(user2)).should.be.bignumber.equal(0);
  });

  // mint 0 when trying to mint 0.5
  it("should fail on minting not multiple number (granuarity)", async function () {
    await expectEvent.inTransaction(
      selfToken.mint(user2, 0.5, "", {
        from: owner
      }),
      "Minted", {
        operator: owner,
        to: user2,
        amount: 0,
        operatorData: "0x"
      }
    );

    (await selfToken.balanceOf(user2)).should.be.bignumber.equal(0);
  });

  // should allow reaching cap
  it("should allow reaching cap", async function () {
    // Step 1: last 1e18 to reach (ether(1))
    await expectEvent.inTransaction(
      selfToken.mint(user2, CAP - AMOUNT_TO_MINT - ether(1), "", {
        from: owner
      }),
      "Minted", {
        operator: owner,
        to: user2,
        amount: CAP - AMOUNT_TO_MINT - ether(1),
        operatorData: "0x"
      }
    );

    (await selfToken.totalSupply()).should.be.bignumber.equal(CAP - ether(1));

    // Step 2: do the last 1e18
    await expectEvent.inTransaction(
      selfToken.mint(user2, ether(1), "", {
        from: owner
      }),
      "Minted", {
        operator: owner,
        to: user2,
        amount: ether(1),
        operatorData: "0x"
      }
    );

    // total supply == CAP
    (await selfToken.totalSupply()).should.be.bignumber.equal(CAP);
  });

});