/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require("chai");
const assert = chai.assert;
chai.use(require("chai-as-promised")).should();
const {
  URL
} = require("url");
const EIP820Registry = require("erc820");
const SelfTokenArtifact = artifacts.require("SelfToken");
const ERC777BaseTokenArtifact = artifacts.require("ERC777BaseToken");
const utils = require("./utils");
let Web3 = require("web3"); // version 1.0.0
// let _web3 = new _Web3(web3.currentProvider);

let erc820Registry;
contract("SelfToken", function (accounts) {
  const provider = new URL(this.web3.currentProvider.host);
  provider.protocol = "ws";
  const _web3 = new Web3(provider.toString());

  const SelfToken = new _web3.eth.Contract(SelfTokenArtifact.abi, {
    data: SelfTokenArtifact.bytecode
  });

  const ERC777BaseToken = new _web3.eth.Contract(ERC777BaseTokenArtifact.abi, {
    data: ERC777BaseTokenArtifact.bytecode
  });

  let selfToken = {
    name: "SELF Token",
    symbol: "SELF",
    granularity: "1",
    defaultOperators: [],
    burnOperator: accounts[8],
    defaultBalance: 0,
    initialSupply: 0,
    erc820Addr: "0x0"
  };

  let _ERC777BaseToken = {
    name: "SELF Token",
    symbol: "SELF",
    granularity: "1",
    defaultOperators: [],
    burnOperator: accounts[8],
    defaultBalance: 0,
    initialSupply: 0,
    erc820Addr: "0x0"
  };

  const deployContractSelfToken = SelfToken.deploy();

  const deployContractERC777BaseToken = ERC777BaseToken.deploy({
    arguments: [
      _ERC777BaseToken.name,
      _ERC777BaseToken.symbol,
      _ERC777BaseToken.granularity,
      _ERC777BaseToken.defaultOperators
    ]
  });

  beforeEach(async function () {
    erc820Registry = await EIP820Registry.deploy(_web3, accounts[0]);
    assert.ok(erc820Registry.$address);
    selfToken.erc820Addr = erc820Registry.$address;
    _ERC777BaseToken.erc820Addr = erc820Registry.$address;

    let estimateGas = await deployContractSelfToken.estimateGas();
    selfToken.contract = await deployContractSelfToken.send({
      from: accounts[0],
      gasLimit: estimateGas
    });
    assert.ok(selfToken.contract.options.address);

    estimateGas = await deployContractERC777BaseToken.estimateGas();
    _ERC777BaseToken.contract = await deployContractERC777BaseToken.send({
      from: accounts[0],
      gasLimit: estimateGas
    });
    assert.ok(_ERC777BaseToken.contract.options.address);

    selfToken.mintForAccount = async function (account, amount, operator) {
      const mintTx = selfToken.contract.methods.mint(
        account,
        utils.tokenUnit(amount),
        "0xcafe"
      );
      const gas = await mintTx.estimateGas();
      await mintTx.send({
        gas: gas,
        from: operator
      });
    };

    _ERC777BaseToken.mintForAccount = async function (
      account,
      amount,
      operator
    ) {
      const mintTx = _ERC777BaseToken.contract.methods.mint(
        account,
        utils.tokenUnit(amount),
        "0xcafe"
      );
      const gas = await mintTx.estimateGas();
      await mintTx.send({
        gas: gas,
        from: operator
      });
    };
  });

  _ERC777BaseToken.disableERC20 = async function () {
    await _ERC777BaseToken.contract.methods.disableERC20().send({
      gas: 300000,
      from: accounts[0]
    });
  };

  after(async function () {
    await _web3.currentProvider.connection.close();
  });

  describe("Creation", function () {
    it("should not deploy the ERC777BaseToken with a granularity of 0", async function () {
      const estimateGas = await deployContractERC777BaseToken.estimateGas();
      await ERC777BaseToken.deploy({
          arguments: [
            _ERC777BaseToken.name,
            _ERC777BaseToken.symbol,
            "0",
            _ERC777BaseToken.defaultOperators
          ]
        })
        .send({
          from: accounts[0],
          gasLimit: estimateGas
        })
        .should.be.rejectedWith("revert");
    });
  });

  require("./utils/attributes").test(_web3, accounts, selfToken);
  require("./utils/mint").test(_web3, accounts, selfToken);
  require("./utils/burn").test(_web3, accounts, selfToken);
  require("./utils/send").test(_web3, accounts, selfToken);
  require("./utils/operator").test(_web3, accounts, selfToken);
  require("./utils/operatorBurn").test(_web3, accounts, selfToken);
  require("./utils/operatorSend").test(_web3, accounts, selfToken);
  require("./utils/tokensSender").test(_web3, accounts, selfToken);
  require("./utils/tokensRecipient").test(_web3, accounts, selfToken);
  require("./utils/erc20Compatibility").test(_web3, accounts, selfToken);

  // describe("ERC777BaseToken ERC20 Disable", function() {
  //   it("should disable ERC20 compatibility", async function() {
  //     let erc820Registry = utils.getERC820Registry(_web3);
  //     let erc20Hash = _web3.utils.keccak256("ERC20Token");
  //     let erc20Addr = await erc820Registry.methods
  //       .getInterfaceImplementer(
  //         _ERC777BaseToken.contract.options.address,
  //         erc20Hash
  //       )
  //       .call();

  //     assert.strictEqual(erc20Addr, _ERC777BaseToken.contract.options.address);

  //     await _ERC777BaseToken.disableERC20();

  //     await utils.getBlock(_web3);
  //     erc20Addr = await erc820Registry.methods
  //       .getInterfaceImplementer(
  //         _ERC777BaseToken.contract.options.address,
  //         erc20Hash
  //       )
  //       .call();

  //     assert.strictEqual(erc20Addr, utils.zeroAddress);
  //   });
  // });

  // require('./utils/erc20Disabled').test(_web3, accounts, _ERC777BaseToken);
});