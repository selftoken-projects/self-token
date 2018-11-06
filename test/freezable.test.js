const shouldFail = require("./helper/shouldFail");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const expectEvent = require("./helper/expectEvent");


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

  it("should freeze buyer1", async function () {
    // Init: buyer1 approve buyer3: 1 wei (To be tested by transferFrom later)
    await selfToken.approve(buyer3, 1, {
      from: buyer1
    });

    // Main: Freeze buyer1
    await selfToken.freeze(buyer1);

    // buyer1 is frozen
    assert.equal(await selfToken.frozenAccounts(buyer1), true);

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

  it("should not allow freezing buyer1 again", async function () {
    shouldFail.reverting(selfToken.freeze(buyer1));
  });

  it("should unfreeze buyer1", async function () {
    // Init: buyer1 approve buyer3: 1 wei (To be tested by transferFrom later)
    // await selfToken.approve(buyer3, 1, {from: buyer1});

    // Main: Unfreeze buyer1
    await selfToken.unfreeze(buyer1);

    // buyer1 is not frozen
    assert.equal(await selfToken.frozenAccounts(buyer1), false);

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

  it("should not allow unfreezing buyer1 again", async function () {
    await shouldFail.reverting(selfToken.unfreeze(buyer1));
  });

  /* New Test Cases for PR #9  */

  it("should allow freeze my account", async function () {
    await expectEvent.inTransaction(
      selfToken.freezeMyAccount({ from: buyer1 }),
      "AccountFrozen", {
        _account: buyer1
      }
    );

    // buyer1 is frozen
    assert.equal(await selfToken.frozenAccounts(buyer1), true);

    // buyer1 cannot transfer
    await shouldFail.reverting(selfToken.transfer(buyer2, 1, {
      from: buyer1
    }));

    // buyer1 cannot unfreeze itself
    await shouldFail.reverting(selfToken.unfreeze(buyer1, {
      from: buyer1
    }));
  });

  it("should allow owner transferFromFrozenAccount buyer1 account", async function () {
    await expectEvent.inTransaction(
      selfToken.transferFromFrozenAccount(buyer1, buyer2, 1, { from: owner }),
      "Sent", {
        operator: owner,
        from: buyer1,
        to: buyer2,
        amount: 1,
        holderData: "0x",
        operatorData: "0x"
      }
    );
  });


  it("should allow owner unfreeze buyer1 account", async function () {
    // owner can unfreeze buyer1
    await expectEvent.inTransaction(
      selfToken.unfreeze(buyer1, { from: owner }),
      "AccountUnfrozen", {
        _account: buyer1
      }
    );

    // buyer1 unfreeze
    assert.equal(await selfToken.frozenAccounts(buyer1), false);
  });

  it("owner cannot freeze itself", async function () {
    await shouldFail.reverting(selfToken.freezeMyAccount({
      from: owner
    }));
  });

});