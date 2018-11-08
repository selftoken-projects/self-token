/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const {
  URL
} = require('url');
const EIP820Registry = require('erc820');
const OldReferenceToken = artifacts.require('SelfToken');
const utils = require('./utils');
let Web3 = require('web3'); // version 1.0.0
// let _web3 = new _Web3(web3.currentProvider);

let erc820Registry;
contract('ReferenceToken', function (accounts) {

  const provider = new URL(this.web3.currentProvider.host);
  provider.protocol = 'ws';
  const _web3 = new Web3(provider.toString());

  const ReferenceToken = new _web3.eth.Contract(
    OldReferenceToken.abi, {
      data: OldReferenceToken.bytecode
    }
  );

  let token = {
    name: "SELF Token",
    symbol: "SELF",
    granularity: "1",
    defaultOperators: [],
    burnOperator: accounts[8],
    defaultBalance: 0,
    initialSupply: 0,
    erc820Addr: "0x0"
  };

  const deployContract = ReferenceToken
    .deploy();

  beforeEach(async function () {
    erc820Registry = await EIP820Registry.deploy(_web3, accounts[0]);
    assert.ok(erc820Registry.$address);
    token.erc820Addr = erc820Registry.$address;

    // Use Web3.js 1.0
    const estimateGas = await deployContract.estimateGas();
    token.contract = await deployContract
      .send({
        from: accounts[0],
        gasLimit: estimateGas
      });
    assert.ok(token.contract.options.address);

    // token.disableERC20 = async function () {
    //   await token.contract.methods
    //     .disableERC20()
    //     .send({
    //       gas: 300000,
    //       from: accounts[0]
    //     });
    // };

    token.mintForAccount = async function (account, amount, operator) {
      const mintTx = token.contract.methods
        .mint(account, utils.tokenUnit(amount), '0xcafe');
      const gas = await mintTx.estimateGas();
      await mintTx.send({
        gas: gas,
        from: operator
      });
    };
  });

  after(async function () {
    await _web3.currentProvider.connection.close();
  });

  require('./utils/attributes').test(_web3, accounts, token);
  require('./utils/mint').test(_web3, accounts, token);
  require('./utils/burn').test(_web3, accounts, token);
  require('./utils/send').test(_web3, accounts, token);
  require('./utils/operator').test(_web3, accounts, token);
  require('./utils/operatorBurn').test(_web3, accounts, token);
  require('./utils/operatorSend').test(_web3, accounts, token);
  require('./utils/tokensSender').test(_web3, accounts, token);
  require('./utils/tokensRecipient').test(_web3, accounts, token);
  require('./utils/erc20Compatibility').test(_web3, accounts, token);

  // describe('ERC20 Disable', function () {
  //   it('should disable ERC20 compatibility', async function () {
  //     let erc820Registry = utils.getERC820Registry(_web3);
  //     let erc20Hash = _web3.utils.keccak256('ERC20Token');
  //     let erc20Addr = await erc820Registry.methods
  //       .getInterfaceImplementer(token.contract.options.address, erc20Hash)
  //       .call();

  //     assert.strictEqual(erc20Addr, token.contract.options.address);

  //     await token.disableERC20();

  //     await utils.getBlock(_web3);
  //     erc20Addr = await erc820Registry.methods
  //       .getInterfaceImplementer(token.contract.options.address, erc20Hash)
  //       .call();

  //     assert.strictEqual(erc20Addr, utils.zeroAddress);
  //   });
  // });

  // require('./utils/erc20Disabled').test(_web3, accounts, token);
});