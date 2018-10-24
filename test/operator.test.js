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

let erc820Registry, selfToken, batchSendOperator, tnx;

contract('SelfToken', function (accounts) {
    // const [officialOperator1] = accounts;

    beforeEach(async function () {
        // use web3 1.0.0 instead of truffle's 0.20.6 web3
        let _Web3 = require('web3'); // version 1.0.0
        let _web3 = new _Web3(web3.currentProvider)

        erc820Registry = await ERC820Registry.deploy(_web3, accounts[0]);
        assert.ok(erc820Registry.$address);
    });

    it("should deploy new contracts", async function () {
        selfToken = await SelfToken.new();
        batchSendOperator = await BatchSendOperator.new();
        // console.log(selfToken)
    });

    it("should add official operator", async function () {
        await expectEvent.inTransaction(
            selfToken.addOfficialOperator(batchSendOperator.address),
            "OfficialOperatorAdded", {
                operator: batchSendOperator.address
            }
        )
    })

    it("should remove official operator", async function () {
        await expectEvent.inTransaction(
            selfToken.removeOfficialOperator(batchSendOperator.address),
            "OfficialOperatorRemoved", {
                operator: batchSendOperator.address
            }
        )
    })
});