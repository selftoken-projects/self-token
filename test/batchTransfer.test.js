const shouldFail = require("./helper/shouldFail");
// When multiple events with the same name are emitted in one tx,
// the original expectEvent.js only examines the first event,
// so we made expectRepeatedEvent.js to fix the problem.
const expectEvent = require("./helper/expectRepeatedEvent");
const ERC820Registry = require('erc820');
const SelfToken = artifacts.require("SelfToken");

let erc820Registry, selfToken;

contract('SelfToken', function (accounts) {
  const [owner, user1, recipient1, recipient2, operator1, anyone] = accounts;
  const TRANSFER_AMOUNT_1 = 10;
  const TRANSFER_AMOUNT_2 = 20;
  const ENOUGH_AMOUNT = TRANSFER_AMOUNT_1 + TRANSFER_AMOUNT_2;
  const NOT_ENOUGH_AMOUNT = TRANSFER_AMOUNT_1 + TRANSFER_AMOUNT_2 - 1;
  const USER_DATA = "0x5e1f";
  const OPERATOR_DATA = "0x07e2";

  before(async function () {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require('web3'); // version 1.0.0
    let _web3 = new _Web3(web3.currentProvider);

    erc820Registry = await ERC820Registry.deploy(_web3, owner);
    assert.ok(erc820Registry.$address);
  });

  beforeEach(async function () {
    selfToken = await SelfToken.new({
      from: owner
    });

    // let operator1 be user1's operator
    selfToken.authorizeOperator(operator1, {
      from: user1
    });
  });

  it("should transfer tokens to multiple recipients in one tx", async function () {
    // mint `ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    const receipt = await selfToken.batchTransfer(
      [recipient1, recipient2],
      [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2], {
        from: user1,
      }
    );

    // there are 4 events in receipt:
    //  "Sent", from user1 to recipient1
    //  "Transfer", from user1 to recipient1
    //  "Sent", from user1 to recipient2
    //  "Transfer", from user1 to recipient2
    // Here we only care about "Transfer" events
    expectEvent.inLogs(
      receipt.logs,
      "Transfer", {
        from: user1,
        to: recipient1,
        amount: TRANSFER_AMOUNT_1,
      }
    );
    expectEvent.inLogs(
      receipt.logs,
      "Transfer", {
        from: user1,
        to: recipient2,
        amount: TRANSFER_AMOUNT_2,
      }
    );

    // check the balances
    (await selfToken.balanceOf(user1)).should.be.bignumber.equal(ENOUGH_AMOUNT - TRANSFER_AMOUNT_1 - TRANSFER_AMOUNT_2);
    (await selfToken.balanceOf(recipient1)).should.be.bignumber.equal(TRANSFER_AMOUNT_1);
    (await selfToken.balanceOf(recipient2)).should.be.bignumber.equal(TRANSFER_AMOUNT_2);
  });

  it("should not transfer tokens to multiple recipients if the user doesn't have enough tokens", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    selfToken.mint(user1, NOT_ENOUGH_AMOUNT, "", {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.batchTransfer(
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2], {
          from: user1,
        }
      )
    );
  });

  it("should send tokens to multiple recipients in one tx", async function () {
    // mint `ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    const receipt = await selfToken.batchSend(
      [recipient1, recipient2],
      [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
      USER_DATA, {
        from: user1,
      }
    );

    // there are 4 events in receipt:
    //  "Sent", from user1 to recipient1
    //  "Transfer", from user1 to recipient1
    //  "Sent", from user1 to recipient2
    //  "Transfer", from user1 to recipient2
    // Here we only care about "Sent" events
    // operator should be user1 because the msg.sender of the tx is user1
    expectEvent.inLogs(
      receipt.logs,
      "Sent", {
        operator: user1,
        from: user1,
        to: recipient1,
        amount: TRANSFER_AMOUNT_1,
        holderData: USER_DATA,
        operatorData: "0x",
      }
    );
    expectEvent.inLogs(
      receipt.logs,
      "Sent", {
        operator: user1,
        from: user1,
        to: recipient2,
        amount: TRANSFER_AMOUNT_2,
        holderData: USER_DATA,
        operatorData: "0x",
      }
    );

    // check the balances
    (await selfToken.balanceOf(user1)).should.be.bignumber.equal(ENOUGH_AMOUNT - TRANSFER_AMOUNT_1 - TRANSFER_AMOUNT_2);
    (await selfToken.balanceOf(recipient1)).should.be.bignumber.equal(TRANSFER_AMOUNT_1);
    (await selfToken.balanceOf(recipient2)).should.be.bignumber.equal(TRANSFER_AMOUNT_2);
  });

  it("should not send tokens to multiple recipients if the user doesn't have enough tokens", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, NOT_ENOUGH_AMOUNT, "", {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.batchSend(
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA, {
          from: user1,
        }
      )
    );
  });

  // operatorBatchSend

  it("an authorized operator can send a user's tokens to multiple recipients in one tx", async function () {
    // mint `ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    const receipt = await selfToken.operatorBatchSend(
      user1,
      [recipient1, recipient2],
      [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
      USER_DATA,
      OPERATOR_DATA, {
        from: operator1,
      }
    );

    expectEvent.inLogs(
      receipt.logs,
      "Sent", {
        operator: operator1,
        from: user1,
        to: recipient1,
        amount: TRANSFER_AMOUNT_1,
        holderData: USER_DATA,
        operatorData: OPERATOR_DATA,
      }
    );
    expectEvent.inLogs(
      receipt.logs,
      "Sent", {
        operator: operator1,
        from: user1,
        to: recipient2,
        amount: TRANSFER_AMOUNT_2,
        holderData: USER_DATA,
        operatorData: OPERATOR_DATA,
      }
    );

    // check the balances
    (await selfToken.balanceOf(user1)).should.be.bignumber.equal(ENOUGH_AMOUNT - TRANSFER_AMOUNT_1 - TRANSFER_AMOUNT_2);
    (await selfToken.balanceOf(recipient1)).should.be.bignumber.equal(TRANSFER_AMOUNT_1);
    (await selfToken.balanceOf(recipient2)).should.be.bignumber.equal(TRANSFER_AMOUNT_2);
  });

  it("an authorized operator can not send a user's tokens to multiple recipients if the user doesn't have enough tokens", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, NOT_ENOUGH_AMOUNT, "", {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.operatorBatchSend(
        user1,
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA,
        OPERATOR_DATA, {
          from: operator1,
        }
      )
    );
  });

  it("only authorized operator can not send a user's tokens to multiple recipients", async function () {
    // mint `ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.operatorBatchSend(
        user1,
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA,
        OPERATOR_DATA, {
          from: anyone,
        }
      )
    );
  });

  // if the token contract is paused

  it("should not allow a user to batchTransfer if the token contract is paused", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.pause({
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.batchTransfer(
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2], {
          from: user1,
        }
      )
    );
  });

  it("should not allow a user to batchSend if the token contract is paused", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.pause({
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.batchSend(
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA, {
          from: user1,
        }
      )
    );
  });

  it("should not allow an operator to operatorBatchSend if the token contract is paused", async function () {
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.pause({
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.operatorBatchSend(
        user1,
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA,
        OPERATOR_DATA, {
          from: operator1,
        }
      )
    );
  });

  // if user1 is frozen

  it("should not allow a user to batchTransfer if they are frozen", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.freeze(user1, {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.batchTransfer(
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2], {
          from: user1,
        }
      )
    );
  });

  it("should not allow a user to batchSend if they are frozen", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.freeze(user1, {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.batchSend(
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA, {
          from: user1,
        }
      )
    );
  });

  it("should not allow an operator to operatorBatchSend if the token holder is frozen", async function () {
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.freeze(user1, {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.operatorBatchSend(
        user1,
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA,
        OPERATOR_DATA, {
          from: operator1,
        }
      )
    );
  });

  // if operator1 is frozen

  it("should not allow an operator to operatorBatchSend if the operator is frozen", async function () {
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.freeze(operator1, {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.operatorBatchSend(
        user1,
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA,
        OPERATOR_DATA, {
          from: operator1,
        }
      )
    );
  });

  // if one of the recipients is frozen

  it("should not allow a user to batchTransfer if one of the recipients is frozen", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.freeze(recipient2, {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.batchTransfer(
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2], {
          from: user1,
        }
      )
    );
  });

  it("should not allow a user to batchSend if one of the recipients is frozen", async function () {
    // mint `NOT_ENOUGH_AMOUNT` tokens to user 1
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.freeze(recipient2, {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.batchSend(
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA, {
          from: user1,
        }
      )
    );
  });

  it("should not allow an operator to operatorBatchSend if the operator is frozen", async function () {
    await selfToken.mint(user1, ENOUGH_AMOUNT, "", {
      from: owner
    });
    await selfToken.freeze(recipient2, {
      from: owner
    });

    // transfer `TRANSFER_AMOUNT_1` tokens to `recipient1`
    // transfer `TRANSFER_AMOUNT_2` tokens to `recipient2`
    await shouldFail.reverting(
      selfToken.operatorBatchSend(
        user1,
        [recipient1, recipient2],
        [TRANSFER_AMOUNT_1, TRANSFER_AMOUNT_2],
        USER_DATA,
        OPERATOR_DATA, {
          from: operator1,
        }
      )
    );
  });
});