const ether = require('openzeppelin-solidity/test/helpers/ether');
const ethGetBalance = require('openzeppelin-solidity/test/helpers/web3');
const expectThrow = require("openzeppelin-solidity/test/helpers/expectThrow");
const expectEvent = require("openzeppelin-solidity/test/helpers/expectEvent");
const chai = require('chai');
const Web3 = require('web3');
const ERC820 = require('erc820');
const ExampleImplementer = require('erc820/artifacts/contracts').ExampleImplementer;
const ExampleClient = require("erc820/artifacts/contracts").ExampleClient;

const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const utils = Web3;
const log = (msg) => {
  if (process.env.MOCHA_VERBOSE) console.log(msg);
};
const blocks = [];
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const SelfToken = artifacts.require("SelfToken");

contract('ERC820', function (accounts) {
  let _web3; // version 1.0.0
  let erc820Registry;
  let proxy;
  let implementer;
  let client;
  let interfaceHash;

  const [addr, manager1, manager2] = accounts;

  it('should deploy ERC820', async () => {
    // use web3 1.0.0 instead of truffle's 0.20.6 web3
    let _Web3 = require('web3'); // version 1.0.0
    _web3 = new _Web3(web3.currentProvider)

    erc820Registry = await ERC820.deploy(_web3, accounts[0]);
    assert.ok(erc820Registry.$address);
    log(erc820Registry.$address);

  }).timeout(20000);

  it('should deploy the example implementer', async () => {
    implementer = await ExampleImplementer.new(_web3);
    assert.ok(implementer.$address);
  }).timeout(20000);

  it('should deploy the example client', async () => {
    client = await ExampleClient.new(_web3);
    assert.ok(client.$address);
  }).timeout(20000);

  it('should set an address', async () => {
    interfaceHash = await erc820Registry.interfaceHash("ERC820ExampleClient");
    assert.equal(interfaceHash, _web3.utils.sha3("ERC820ExampleClient"));
    await erc820Registry.setInterfaceImplementer(addr, interfaceHash, implementer.$address, {
      from: addr
    });
    const rImplementer = await erc820Registry.getInterfaceImplementer(addr, interfaceHash);
    assert.equal(rImplementer, implementer.$address);
  }).timeout(6000);

  it('should change manager', async () => {
    await erc820Registry.setManager(ZERO_ADDRESS, manager1, {
      from: addr
    });
    const rManager1 = await erc820Registry.getManager(addr);
    assert.equal(rManager1.toLowerCase(), manager1);
  }).timeout(6000);

  it('manager should remove interface', async () => {
    await erc820Registry.setInterfaceImplementer(addr, interfaceHash, ZERO_ADDRESS, {
      from: manager1,
      gas: 200000
    });
    const rImplementer = await erc820Registry.getInterfaceImplementer(addr, interfaceHash);
    assert.equal(rImplementer, ZERO_ADDRESS);
  }).timeout(6000);

  it('address should change back the interface', async () => {
    await erc820Registry.setInterfaceImplementer(addr, interfaceHash, implementer.$address, {
      from: manager1
    });
    const rImplementer = await erc820Registry.getInterfaceImplementer(addr, interfaceHash);
    assert.equal(rImplementer, implementer.$address);
  }).timeout(6000);

  it('manager should change manager', async () => {
    await erc820Registry.setManager(addr, manager2, {
      from: manager1
    });
    const rManager2 = await erc820Registry.getManager(addr);
    assert.equal(rManager2.toLowerCase(), manager2);
  }).timeout(6000);

  it('address should remove interface', async () => {
    await erc820Registry.setInterfaceImplementer(addr, interfaceHash, ZERO_ADDRESS, {
      from: manager2,
      gas: 200000
    });
    const rImplementer = await erc820Registry.getInterfaceImplementer(addr, interfaceHash);
    assert.equal(rImplementer, ZERO_ADDRESS);
  }).timeout(6000);

  it('Should not allow to set an interface an invalid contract', async () => {
    await erc820Registry.setInterfaceImplementer(addr, interfaceHash, erc820Registry.$address, {
        from: manager2,
        gas: 200000
      })
      .should.be.rejectedWith('revert');
  }).timeout(6000);

  it('manager should set back interface', async () => {
    await erc820Registry.setInterfaceImplementer(addr, interfaceHash, implementer.$address, {
      from: manager2,
      gas: 200000
    });
    const rImplementer = await erc820Registry.getInterfaceImplementer(addr, interfaceHash);
    assert.equal(rImplementer, implementer.$address);
  }).timeout(6000);

  it('address should remove manager', async () => {
    await erc820Registry.setManager(addr, ZERO_ADDRESS, {
      from: manager2,
      gas: 200000
    });
    const rManager = await erc820Registry.getManager(addr);
    assert.equal(rManager.toLowerCase(), addr);
  }).timeout(6000);

  it('manager should not be able to change interface', async () => {
    await erc820Registry.setInterfaceImplementer(addr, interfaceHash, ZERO_ADDRESS, {
        from: manager2,
        gas: 200000
      })
      .should.be.rejectedWith('revert');
  }).timeout(6000);

  it("should deploy new contracts", async function () {
    selfToken = await SelfToken.new();
  });

  it("should deploy new contracts", async function () {
    selfToken = await SelfToken.new();
  });

});