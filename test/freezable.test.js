const assertRevert = require("./helper/assertRevert");
const ether = require("./helper/ether");
const expectThrow = require("./helper/expectThrow");
const ERC820Registry = require('erc820')
const SelfToken = artifacts.require("SelfToken");   
const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

let erc820Registry, selfToken;

contract('SelfToken', function (accounts) {
    const [owner, buyer1, buyer2, buyer3, anyone] = accounts;

    beforeEach(async function () {
        // use web3 1.0.0 instead of truffle's 0.20.6 web3
        let _Web3 = require('web3'); // version 1.0.0
        let _web3 = new _Web3(web3.currentProvider)

        erc820Registry = await ERC820Registry.deploy(_web3, accounts[0]);
        assert.ok(erc820Registry.$address);
    });

    it("should deploy new contract", async function () {
        selfToken = await SelfToken.new();
        console.log(selfToken)
    });

    it("should freeze buyer1", async function () {
        // freeze buyer1
        await selfToken.freeze(buyer1);

        // verify: buyer1 is frozen
        assert.equal(await selfToken.frozenAccounts(buyer1), true);

        
    });


});