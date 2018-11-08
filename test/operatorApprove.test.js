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
  const [owner, user1, user2, user3, operator1, anyone] = accounts;

  before(async function () {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require('web3'); // version 1.0.0
    let _web3 = new _Web3(web3.currentProvider);

    erc820Registry = await ERC820Registry.deploy(_web3, accounts[0]);
    assert.ok(erc820Registry.$address);
  });

  it("should allow an operator to approve tokens for a token holder", async function () {
    // deploy SelfToken contract
    selfToken = await SelfToken.new();

    // mint 100 tokens for user1
    await selfToken.mint(user1, 100, "", {
      from: owner
    });

    // authorize operator1 as user1's operator
    await selfToken.authorizeOperator(operator1, {
      from: user1
    });

    // operator1 approve user1's 10 tokens to user2
    assert.ok(await selfToken.operatorApprove(user1, user2, 10, {
      from: operator1
    }));

    // 10 tokens should approved.
    (await selfToken.allowance(user1, user2)).should.be.bignumber.equal(10);

    // user2 can transfer 10 tokens from user1 to user3.
    assert.ok(await selfToken.transferFrom(user1, user3, 10, {
      from: user2
    }));

    // user2 cannot transfer one more tokens from user1 to user3.
    await shouldFail.reverting(selfToken.transferFrom(user1, user3, 1, {
      from: user2
    }));

    // user1 should have 90 tokens.
    (await selfToken.balanceOf(user1)).should.be.bignumber.equal(90);

    // user3 should have 10 tokens.
    (await selfToken.balanceOf(user3)).should.be.bignumber.equal(10);
  });

  it("should not allow an address to approve tokens for a token holder if they are not the token holder's operator", async function () {
    // deploy SelfToken contract
    selfToken = await SelfToken.new();

    // mint 100 tokens for user1
    await selfToken.mint(user1, 100, "", {
      from: owner
    });

    // operator1 approve user1's 10 tokens to user2
    await shouldFail.reverting(
      selfToken.operatorApprove(user1, user2, 10, {
        from: anyone
      })
    );
  });
});