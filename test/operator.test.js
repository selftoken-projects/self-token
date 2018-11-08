const shouldFail = require("./helper/shouldFail");
const {
  expectThrow
} = require("openzeppelin-solidity/test/helpers/expectThrow");
const expectEvent = require("openzeppelin-solidity/test/helpers/expectEvent");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const BatchSendOperator = artifacts.require("BatchSendOperator");

let erc820Registry, selfToken, operator1, operator2;

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
      if (logs.length >= 1) {
        logs.forEach(log => {
          authorizedOperators.push(log.args.operator);

          // resolve promise on last processed item 
          itemsProcessed++;
          if (itemsProcessed === logs.length) {
            resolve(authorizedOperators);
          }
        })
      } else resolve(authorizedOperators);
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
      if (logs.length >= 1) {
        logs.forEach(log => {

          let indexOfElementToRemove = authorizedOperators.indexOf(log.args.operator);
          if (indexOfElementToRemove > -1) {
            authorizedOperators.splice(indexOfElementToRemove, 1);
          }
          // resolve promise on last processed item 
          itemsProcessed++;
          if (itemsProcessed === logs.length) {
            resolve(authorizedOperators);
          }
        })
      } else resolve(authorizedOperators);
    })
  });
}

function addOfficialOperators(officialOperators, authorizedOperators, user) {
  return new Promise(async function (resolve, reject) {
    let acceptAllOfficialOperators = await selfToken.isUserAcceptingAllOfficialOperators(user)
    if (acceptAllOfficialOperators) {

      var itemsProcessed = 0;
      if (officialOperators.length >= 1) {
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
      } else resolve(authorizedOperators);
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

    operator1 = await BatchSendOperator.new();
    operator2 = await BatchSendOperator.new();
  });

  beforeEach(async function () {
    selfToken = await SelfToken.new();
  });

  it("normal users should be able to authorize and revoke operator for themselves", async function () {
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
  it("should allow the owner to add and remove official operator", async function () {
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


    // only owner can remove official operator
    shouldFail.reverting(selfToken.removeOfficialOperator(operator1.address, {
      from: anyone
    }));


    // owner can remove official operator
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

  it("an official operator is a valid operator for anyone by default", async function () {
    await selfToken.addOfficialOperator(operator1.address, {
      from: owner
    });
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
  });

  it("should be able to accept all official operators again after rejecting all", async function () {
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

    // add operator1 to official operators
    await selfToken.addOfficialOperator(operator1.address, {
      from: owner
    });
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);

    // authorize operator2
    await selfToken.authorizeOperator(operator2.address, {
      from: user1
    })
    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), true);

    // view all authorized operators by querying past events
    let authorizedOperators = []

    authorizedOperators = await addAuthorizedOperators(authorizedOperators, user1);
    authorizedOperators = await removeRevokedOperators(authorizedOperators, user1);
    authorizedOperators = await addOfficialOperators([operator1.address], authorizedOperators, user1);



    // should have two authorized operators 
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), true);
    // sort before comparing arrays to ignore order of array elements
    assert.deepEqual(authorizedOperators.sort(), [operator1.address, operator2.address].sort())

    // revoke unofficial operators
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
    authorizedOperators = await addOfficialOperators([operator1.address], authorizedOperators, user1);


    // should one have one authorized operator
    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), false);
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);

    assert.deepEqual(authorizedOperators, [operator1.address])
  })

  it("should not be able to add non contract official operator", async function () {
    await expectThrow(selfToken.addOfficialOperator(user1));
  })

  it("should not be able to revoke an unauthorized operator", async function () {
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), false);
    await shouldFail.reverting(selfToken.revokeOperator(operator1.address, {
      from: user1
    }))
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), false);
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

  it("should revert when revoking not authorized operators (in order for operators to be revoked, they must first be authorized)", async function () {
    assert.equal(await selfToken.isOperatorFor(operator2.address, user1), false);

    await shouldFail.reverting(
      selfToken.revokeOperator(
        operator2.address, {
          from: user1
        })
    );
  })

  it("when not assigned, user is an operator for himself", async function () {
    assert.equal(await selfToken.isOperatorFor(user1, user1), true);
  })
});