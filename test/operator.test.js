const shouldFail = require("./helper/shouldFail");
const {
  expectThrow
} = require("openzeppelin-solidity/test/helpers/expectThrow");
const expectEvent = require("openzeppelin-solidity/test/helpers/expectEvent");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const BatchSendOperator = artifacts.require("BatchSendOperator");
const BigNumber = web3.BigNumber;

let erc820Registry, selfToken, operator1, operator2, officialOperators = [];

function addAuthorizedOperators(authorizedOperators, user) {
  return new Promise(function (resolve, reject) {

    let AuthorizedOperatorEvent = selfToken.AuthorizedOperator({}, {
      fromBlock: 0,
      toBlock: 'latest',
      address: user
    })
    AuthorizedOperatorEvent.get((error, logs) => {
      if (error) reject(error);

      // logs.forEach(log => console.log(log.args))
      var itemsProcessed = 0;
      logs.forEach(log => {
        authorizedOperators.push(log.args.operator);
        // console.log(authorizedOperators)

        // resolve promise on last processed item 
        itemsProcessed++;
        if (itemsProcessed === authorizedOperators.length) {
          resolve(authorizedOperators);
        }
      })
    })
  });
}

function removeRevokedOperators(authorizedOperators, user) {
  return new Promise(function (resolve, reject) {
    let RevokedOperatorEvent = selfToken.RevokedOperator({}, {
      fromBlock: 0,
      toBlock: 'latest',
      address: user
    })
    RevokedOperatorEvent.get((error, logs) => {
      if (error) reject(error);

      // logs.forEach(log => console.log(log.args))
      var itemsProcessed = 0;
      logs.forEach(log => {

        let indexOfElementToRemove = authorizedOperators.indexOf(log.args.operator);
        if (indexOfElementToRemove > -1) {
          authorizedOperators.splice(indexOfElementToRemove, 1);
        }
        // console.log(authorizedOperators)


        // resolve promise on last processed item 
        itemsProcessed++;
        if (itemsProcessed === authorizedOperators.length) {
          resolve(authorizedOperators);
        }
      })
    })
  });
}

function addOfficialOperators(officialOperators, authorizedOperators, user) {
  return new Promise(async function (resolve, reject) {
    let acceptAllOfficialOperators = await selfToken.isUserAcceptingAllOfficialOperators(user)
    if (acceptAllOfficialOperators) {

      // TODO: do not readd operator

      var itemsProcessed = 0;
      // console.log(officialOperators)
      officialOperators.forEach(officialOperator => {
        // if this operator is not in authorizedOperators
        if (authorizedOperators.indexOf(officialOperator) == -1) {
          authorizedOperators.push(officialOperator);
        }

        // resolve promise on last processed item 
        itemsProcessed++;
        if (itemsProcessed === officialOperators.length) {
          resolve(authorizedOperators);
        }
      })
    }
    // else do nothing and resolve directly
    else resolve(authorizedOperators);
  })
}

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

  it("normal users should be able to authorize operator for themselves", async function () {
    // `operator1` should not be an official operator initially.
    assert.equal(await selfToken.isOfficialOperator(operator1.address), false);

    // authorize an operator which is not an official operator
    await expectEvent.inTransaction(
      selfToken.authorizeOperator(operator1.address, {
        from: user1
      }),
      "AuthorizedOperator", {
        operator: operator1.address,
        tokenHolder: user1
      }
    );

    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
  })

  it("normal users should be able to revoke operator for themselves", async function () {

    // revoke an authorized operator
    await expectEvent.inTransaction(
      selfToken.revokeOperator(operator1.address, {
        from: user1
      }),
      "RevokedOperator", {
        operator: operator1.address,
        tokenHolder: user1
      }
    );

    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), false);
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

    // server update official operator 
    officialOperators.push(operator1)

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

    // server update official operator 
    officialOperators.splice(officialOperators.indexOf(operator1.address), 1)


    // `operator1` should not be an official operator now.
    assert.equal(await selfToken.isOfficialOperator(operator1.address), false);
  });

  it("should be able to accept all official operators again after rejecting all", async function () {
    // add operator1 to official operators
    await selfToken.addOfficialOperator(operator1.address, {
      from: owner
    });

    // server update official operator 
    officialOperators.push(operator1.address)

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
  });

  it("should be able to authorize other unofficial operator when accept all official operators", async function () {

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
    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), true);
  });

  it("should be able to view all authorized operator", async function () {

    // view all authorized operators by querying past events
    let authorizedOperators = []

    authorizedOperators = await addAuthorizedOperators(authorizedOperators, user1);
    authorizedOperators = await removeRevokedOperators(authorizedOperators, user1);
    authorizedOperators = await addOfficialOperators(officialOperators, authorizedOperators, user1);

    // should have two authorized operators 
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), true);
    // sort before comparing arrays to ignore order of array elements
    assert.deepEqual(authorizedOperators.sort(), [operator1.address, operator2.address].sort())

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

    // list all authorizedOperators again
    authorizedOperators = []

    authorizedOperators = await addAuthorizedOperators(authorizedOperators, user1);
    authorizedOperators = await removeRevokedOperators(authorizedOperators, user1);
    authorizedOperators = await addOfficialOperators(officialOperators, authorizedOperators, user1);

    // should one have one authorized operator
    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), false);
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);

    assert.deepEqual(authorizedOperators, [operator1.address])
  })

  it("should not be able to add non contract official operator", async function () {
    await expectThrow(selfToken.addOfficialOperator(user1));
  })

  it("should not be able to unauthorize an authorized official operator when accepting all official operators", async function () {
    // operator1 is an official operator now
    await shouldFail.reverting(selfToken.revokeOperator(operator1.address, {
      from: user1
    }))
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
  })

  it("should revert when reauthorizing operators", async function () {
    await selfToken.authorizeOperator(
      operator2.address, {
        from: user1
      })

    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), true);

    await shouldFail.reverting(
      selfToken.authorizeOperator(
        operator2.address, {
          from: user1
        })
    );
  })

  it("should revert when rerevoking operators", async function () {
    await selfToken.revokeOperator(
      operator2.address, {
        from: user1
      })

    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), false);

    await shouldFail.reverting(
      selfToken.revokeOperator(
        operator2.address, {
          from: user1
        })
    );
  })
});
