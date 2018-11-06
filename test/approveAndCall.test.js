const shouldFail = require("./helper/shouldFail");
const expectEvent = require("./helper/expectEvent");
const ERC820Registry = require('erc820');
const SelfToken = artifacts.require("SelfToken");
const ExampleApprovalRecipient = artifacts.require("ExampleApprovalRecipient");
const BigNumber = web3.BigNumber;

// const should = require('chai')
//   .use(require('chai-as-promised'))
//   .use(require('chai-bignumber')(BigNumber))
//   .should();

let erc820Registry, selfToken, exampleApprovalRecipient;

contract('SelfToken', function (accounts) {
  const [owner, merchant1, user1] = accounts;
  const price = 100;
  const initialTokenBalance = 1000;
  const extraData = "0x5e1f";

  before(async function () {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require('web3'); // version 1.0.0
    let _web3 = new _Web3(web3.currentProvider);

    erc820Registry = await ERC820Registry.deploy(_web3, owner);
    assert.ok(erc820Registry.$address);
  });

  beforeEach(async function () {
    selfToken = await SelfToken.new({ from: owner });
    exampleApprovalRecipient = await ExampleApprovalRecipient.new(
      merchant1, selfToken.address, price, { from: merchant1 }
    );
  });

  it("should allow the user to pay tokens and buy something in one tx with approveAndCall", async function () {
    selfToken.mint(user1, price, "", { from: owner });

    const receipt = await selfToken.approveAndCall(
      exampleApprovalRecipient.address, price, extraData, { from: user1 }
    );

    // `SomethingPurchased` event is not visible in receipt.logs
    // (maybe) because it was emitted in `ExampleApprovalRecipient`.
    // TODO: Find a way to check if `SomethingPurchased` is actually emitted.
    expectEvent.inLogs(receipt.logs, "Transfer", {
      from: user1,
      to: merchant1,
      amount: price,
    });

    (await selfToken.balanceOf(merchant1)).should.be.bignumber.equal(price);
    (await exampleApprovalRecipient.message()).should.equal(extraData);
  });

  // The following test cases are actually testing ExampleApprovalRecipient.sol
  // instead of approveAndCall.
  // beforeEach is still called before every it.
  describe("testing ExampleApprovalRecipient", function () {
    it("approveAndCall should fail if the user didn't approve enough tokens", async function () {
      selfToken.mint(user1, price, "", { from: owner });

      shouldFail.reverting(
        selfToken.approveAndCall(
          exampleApprovalRecipient.address, price - 1, extraData, { from: user1 }
        )
      );
    });

    it("approveAndCall should fail if the user didn't have enough tokens", async function () {
      selfToken.mint(user1, price - 1, "", { from: owner });

      shouldFail.reverting(
        selfToken.approveAndCall(
          exampleApprovalRecipient.address, price, extraData, { from: user1 }
        )
      );
    });

    it("approveAndCall should fail if the user tries to pay different tokens", async function () {
      const fakeSelfToken = await SelfToken.new({ from: owner });
      fakeSelfToken.mint(user1, initialTokenBalance, "", { from: owner });

      // approve fakeSelfToken and call exampleApprovalRecipient's receiveApproval.
      shouldFail.reverting(
        fakeSelfToken.approveAndCall(
          exampleApprovalRecipient.address, price, extraData, { from: user1 }
        )
      );
    });

    it("should only pay tokens equal to the price even if a user approves more tokens", async function () {
      selfToken.mint(user1, price * 2, "", { from: owner });

      expectEvent.inTransaction(
        selfToken.approveAndCall(
          exampleApprovalRecipient.address, price * 2, extraData, { from: user1 }
        ),
        "Transfer", {
          from: user1,
          to: merchant1,
          amount: price,
        }
      );

      (await selfToken.balanceOf(merchant1)).should.be.bignumber.equal(price);
    });
  });
});
