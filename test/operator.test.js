const shouldFail = require("./helper/shouldFail");
const {
  expectThrow
} = require("openzeppelin-solidity/test/helpers/expectThrow");
const expectEvent = require("openzeppelin-solidity/test/helpers/expectEvent");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const BatchSendOperator = artifacts.require("BatchSendOperator");
const BigNumber = web3.BigNumber;

let erc820Registry, selfToken, operator1, operator2;

contract('SelfToken', function (accounts) {
  const [owner, user1, anyone] = accounts;

  before(async function () {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require('web3'); // version 1.0.0
    let _web3 = new _Web3(web3.currentProvider);

    erc820Registry = await ERC820Registry.deploy(_web3, user1);
    assert.ok(erc820Registry.$address);
  });

  it("should deploy new contracts", async function () {
    selfToken = await SelfToken.new();
    operator1 = await BatchSendOperator.new();
    operator2 = await BatchSendOperator.new();
    // console.log(selfToken)
  });

  // TO FIX:
  it("normal users should be able to authorize operator for themselves", async function () {
    await selfToken.authorizeOperator(operator1.address, {
      from: user1
    });
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
  })

  it("should only allow the owner to add an official operator", async function () {
    shouldFail.reverting(selfToken.addOfficialOperator(operator1.address, {
      from: anyone
    }));
  });

  // note: add offical operator != authorize official operator
  it("should allow the owner to add official operator", async function () {
    await expectEvent.inTransaction(
      selfToken.addOfficialOperator(operator1.address, {
        from: owner
      }),
      "OfficialOperatorAdded", {
        operator: operator1.address
      }
    );

    // `operator1` should be an official operator now.
    assert.equal(await selfToken.isOfficialOperator(operator1.address), true);
  });

  it("an official operator is an authorized operator for anyone by default", async function () {
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
  });

  it("should only allow the owner to remove an official operator", async function () {
    shouldFail.reverting(selfToken.removeOfficialOperator(operator1.address, {
      from: anyone
    }));
  });

  it("should remove official operator", async function () {
    await expectEvent.inTransaction(
      selfToken.removeOfficialOperator(operator1.address, {
        from: owner
      }),
      "OfficialOperatorRemoved", {
        operator: operator1.address
      }
    );

    // `operator1` should not be an official operator now.
    assert.equal(await selfToken.isOfficialOperator(operator1.address), false);
  });

  it("can accept all official operators again after rejecting all", async function () {
    // add operator1 to official operators
    await selfToken.addOfficialOperator(operator1.address, {
      from: owner
    });

    // By default, a user accepts all official operators
    assert.equal(await selfToken.isUserAcceptingAllOfficialOperators(user1), true);
    // `operator1` should be an operator for `user1`.
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);

    // reject all official operators
    await expectEvent.inTransaction(
      selfToken.rejectAllOfficialOperators({
        from: user1
      }),
      "OfficialOperatorsRejectedByUser", {
        user: user1
      }
    );

    // `user1` should not accept all official operators
    assert.equal(await selfToken.isUserAcceptingAllOfficialOperators(user1), false);
    // `operator1` should not be an operator for `user1`.
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), false);

    // authorize back all official operators
    await expectEvent.inTransaction(
      selfToken.acceptAllOfficialOperators({
        from: user1
      }),
      "OfficialOperatorsAcceptedByUser", {
        user: user1
      }
    );

    // `user1` should accept all official operators again
    assert.equal(await selfToken.isUserAcceptingAllOfficialOperators(user1), true);
    // `operator1` should be an operator for `user1`.
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);

    // remove operator1 from official operators
    await selfToken.removeOfficialOperator(operator1.address, {
      from: owner
    });
  });

  it("can view all authorized operator", async function () {
    // offchain keep track of a list of official/unofficial operators
    let operatorSet = new Set();

    // add official operator (they are also authorized by default)
    await selfToken.addOfficialOperator(operator1.address, {
      from: owner
    });
    operatorSet.add(operator1.address);

    // official operator should be authorized by default
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);

    // authorize unofficial operators
    await expectEvent.inTransaction(
      selfToken.authorizeOperator(operator2.address, {
        from: user1
      }),
      "AuthorizedOperator", {
        operator: operator2.address,
        tokenHolder: user1,
      }
    );
    operatorSet.add(operator2.address);
    // TODO: not sure the logic yet
    // assert.equal(await selfToken.isOperatorFor(operator2.address, user1), true);

    // loop through all possible operators
    let authorizedOperators = []
    let cnt = 0;
    operatorSet.forEach(async function (key, operator, set) {
      cnt++;
      let isOperator = await selfToken.isOperatorFor(operator, user1)
      if (isOperator) {
        authorizedOperators.push(operator);
      }
      if (cnt == set.size) {
        // deepEqual compares whether the two array have the same value
        // TODO: not sure the logic yet
        // assert.deepEqual(authorizedOperators, [operator1.address, operator2.address])
      }
    });

    // unauthorize unofficial operators
    await expectEvent.inTransaction(
      selfToken.revokeOperator(operator2.address, {
        from: user1
      }),
      "RevokedOperator", {
        operator: operator2.address,
        tokenHolder: user1
      }
    );

    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), false);
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);

    // check all operators again
    authorizedOperators = []
    cnt = 0;
    operatorSet.forEach(async function (key, operator, set) {
      cnt++;
      let isOperator = await selfToken.isOperatorFor(operator, user1)
      if (isOperator) {
        authorizedOperators.push(operator);
      }
      if (cnt == set.size) {
        // deepEqual compares whether the two array have the same value
        assert.deepEqual(authorizedOperators, [operator1.address])
      }
    });
  })

  it("should not be able to authorize non contract operator", async function () {
    await expectThrow(selfToken.addOfficialOperator(user1));
  })

  it("should not be able to unauthorize an authorized official operator one by one", async function () {
    await selfToken.revokeOperator(operator1.address);
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
  })
});