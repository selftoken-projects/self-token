const ether = require('openzeppelin-solidity/test/helpers/ether');
const ethGetBalance = require('openzeppelin-solidity/test/helpers/web3');
const expectThrow = require("openzeppelin-solidity/test/helpers/expectThrow");
const expectEvent = require("openzeppelin-solidity/test/helpers/expectEvent");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");
const BatchSendOperator = artifacts.require("BatchSendOperator");
const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

let erc820Registry, selfToken, operator1, operator2, tnx;

contract('SelfToken', function (accounts) {
  const [user1] = accounts;

  before(async function () {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require('web3'); // version 1.0.0
    let _web3 = new _Web3(web3.currentProvider)

    erc820Registry = await ERC820Registry.deploy(_web3, user1);
    assert.ok(erc820Registry.$address);
  });

  it("should deploy new contracts", async function () {
    selfToken = await SelfToken.new();
    operator1 = await BatchSendOperator.new();
    operator2 = await BatchSendOperator.new();
    // console.log(selfToken)
  });

  // note: add offical operator != authorize official operator
  it("should add official operator & all official operator is authorized by default", async function () {
    await expectEvent.inTransaction(
      selfToken.addOfficialOperator(operator1.address),
      "OfficialOperatorAdded", {
        operator: operator1.address
      }
    )

    // all official operator is authorized by default
    assert.equal(await selfToken.isOperatorFor(operator1.address, user1), true);
  })

  it("should remove official operator", async function () {
    await expectEvent.inTransaction(
      selfToken.removeOfficialOperator(operator1.address),
      "OfficialOperatorRemoved", {
        operator: operator1.address
      }
    )
  })

  it("can authorized all official operators after unauthorizing all", async function () {
    // unauthorize all official operators
    await expectEvent.inTransaction(
      selfToken.rejectAllOfficialOperators(),
      "OfficialOperatorsUnauthorizedByUser", {
        user: user1
      }
    );

    // authorize back all official operators
    await expectEvent.inTransaction(
      selfToken.acceptAllOfficialOperators(),
      "OfficialOperatorsAuthorizedByUser", {
        user: user1
      }
    );

  });

  it("can view all authorized operator", async function () {
    // offchain keep track of a list of official/unofficial operators 
    let operatorSet = new Set();

    // add official operator (they are also authorized by default)
    await selfToken.addOfficialOperator(operator1.address)
    operatorSet.add(operator1.address)

    // authorize unofficial operators
    await selfToken.authorizeOperator(operator2.address);
    operatorSet.add(operator2.address);

    // loop through all possible operators 
    let authorizedOperators = []
    operatorSet.forEach(function (key, operator, set) {
      if (selfToken.isOperatorFor(operator, user1)) {
        authorizedOperators.push(operator);
      }
    });

    // deepEqual compares whether the two array have the same value
    assert.deepEqual(authorizedOperators, [operator1.address, operator2.address])

    // unauthorize unofficial operators
    await expectEvent.inTransaction(
      selfToken.revokeOperator(operator2.address),
      "RevokedOperator", {
        operator: operator2.address,
        tokenHolder: user1
      }
    );

    // check all operators again
    authorizedOperators = []
    operatorSet.forEach(function (key, operator, set) {
      if (selfToken.isOperatorFor(operator, user1)) {
        authorizedOperators.push(operator);
        // console.log(operator)
      }
    });

    // TODO: fix err
    // assert.deepEqual(authorizedOperators, [operator1.address])



  })

  // should not be able to authorize non contract operator
});