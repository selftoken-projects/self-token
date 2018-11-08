const shouldFail = require("./helper/shouldFail");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

let erc820Registry, selfToken;

contract('SelfToken', function (accounts) {
  const [owner, buyer1, buyer2, buyer3, anyone] = accounts;

  before(async function () {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require('web3'); // version 1.0.0
    let _web3 = new _Web3(web3.currentProvider)

    erc820Registry = await ERC820Registry.deploy(_web3, accounts[0]);
    assert.ok(erc820Registry.$address);
  });

  it("should deploy new contract", async function () {
    selfToken = await SelfToken.new();

    // mint 100 tokens for buyer1, buyer2, and buyer3
    await selfToken.mint(buyer1, 100, "");
    await selfToken.mint(buyer2, 100, "");
    await selfToken.mint(buyer3, 100, "");
  });

  it("non-owner should not pause", async function () {
    await shouldFail.reverting(selfToken.pause({ from: buyer1 }));
  });

  it("should pause token transfer and approving", async function () {
    // Init: buyer1 approve buyer3: 1 wei (To be tested by transferFrom later)
    await selfToken.approve(buyer3, 1, {
      from: buyer1
    });

    // Main: Pause buyer1
    await selfToken.pause();

    // buyer1 cannot transfer
    shouldFail.reverting(selfToken.transfer(buyer2, 1, {
      from: buyer1
    }));

    // buyer2 cannot transfer to buyer1
    shouldFail.reverting(selfToken.transfer(buyer1, 1, {
      from: buyer2
    }));

    // buyer1 cannot approve buyer2
    shouldFail.reverting(selfToken.approve(buyer2, 1, {
      from: buyer1
    }));

    // buyer1 cannot burn
    shouldFail.reverting(selfToken.burn(1, "", {
      from: buyer1
    }));

    // buyer3 cannot transferFrom buyer1
    shouldFail.reverting(selfToken.transferFrom(buyer1, anyone, 1, {
      from: buyer3
    }));
  });

  it("non-owner should not unpause", async function () {
    await shouldFail.reverting(selfToken.unpause({ from: buyer1 }));
  });

  it("should unpause token transfer and approving", async function () {
    // Main: Unpause buyer1
    await selfToken.unpause();

    // buyer1 can transfer
    await selfToken.transfer(buyer2, 1, {
      from: buyer1
    });

    // buyer2 can transfer to buyer1
    await selfToken.transfer(buyer1, 1, {
      from: buyer2
    });

    // buyer1 can approve buyer2
    await selfToken.approve(buyer2, 1, {
      from: buyer1
    });

    // buyer1 can burn
    await selfToken.burn(1, "", {
      from: buyer1
    });

    // buyer3 can transferFrom buyer1
    await selfToken.transferFrom(buyer1, anyone, 1, {
      from: buyer3
    });
  });

  it("owner should not unpause again", async function () {
    await shouldFail.reverting(selfToken.unpause({ from: owner }));
  });
});