/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require("chai");
const assert = chai.assert;
chai.use(require("chai-as-promised")).should();
const {
  URL
} = require("url");
const ERC820Registry = require("erc820");
const SelfTokenArtifacts = artifacts.require("SelfToken");
const utils = require("./utils");

// use web3 1.0.0 instead of truffle's 0.20.6 web3
let _Web3 = require("web3"); // version 1.0.0
let _web3 = new _Web3(web3.currentProvider);

contract("SelfToken", function (accounts) {
  const SelfToken = new _web3.eth.Contract(
    SelfTokenArtifacts.abi, {
      data: SelfTokenArtifacts.bytecode
    }
  );
  let token = {
    name: "SELF Token",
    symbol: "SELF",
    granularity: "1",
    defaultOperators: [],
    // burnOperator: accounts[8],
    totalSupply: "0",
    defaultBalance: "0" // initial balance of all accounts
  };

  const deployContract = SelfToken.deploy()

  beforeEach(async function () {
    erc820Registry = await ERC820Registry.deploy(_web3, accounts[0]);
    assert.ok(erc820Registry.$address);

    // deploy selfToken
    const estimateGas = await deployContract.estimateGas();
    token.contract = await deployContract
      .send({
        from: accounts[0],
        gasLimit: estimateGas
      });
    assert.ok(token.contract.options.address);

    token.genMintTxForAccount = function (account, amount, operator, gas) {
      return token.contract.methods
        .mint(account, _web3.utils.toWei(amount), '0xcafe')
        .send.request({
          gas: gas,
          from: operator
        });
    };
  });


  // require("./utils/attributes").test(_web3, accounts, token);
  // require("./utils/mint").test(_web3, accounts, token);
  // require("./utils/burn").test(_web3, accounts, token);
  // require("./utils/send").test(_web3, accounts, token);
  // require("./utils/operator").test(_web3, accounts, token);
  // require("./utils/disabled.operatorBurn").test(_web3, accounts, token);
  // require("./utils/operatorSend").test(_web3, accounts, token);
  require("./utils/tokensSender").test(_web3, accounts, token);
  require("./utils/tokensRecipient").test(_web3, accounts, token);
  // require("./utils/erc20Compatibility").test(_web3, accounts, token);





  // describe("ERC20 Disable", function () {
  //   it("should disable ERC20 compatibility", async function () {
  //     let erc820Registry = utils.getERC820Registry(_web3);
  //     let erc20Hash = _web3.utils.keccak256("ERC20selfToken");
  //     let erc20Addr = await erc820Registry.methods
  //       .getInterfaceImplementer(token.contract.options.address, erc20Hash)
  //       .call();

  //     assert.strictEqual(erc20Addr, token.contract.options.address);

  //     await token.disableERC20();

  //     await utils.getBlock(_web3);
  //     erc20Addr = await erc820Registry.methods
  //       .getInterfaceImplementer(token.contract.options.address, erc20Hash)
  //       .call();

  //     assert.strictEqual(
  //       erc20Addr,
  //       "0x0000000000000000000000000000000000000000"
  //     );
  //   });
  // });

  // require("./utils/erc20Disabled").test(_web3, accounts, token);
});