const assertRevert = require("./helper/assertRevert");
const ether = require("./helper/ether");
const expectThrow = require("./helper/expectThrow");
const ERC777ERC20TokenWithOfficialOperators = artifacts.require("ERC777ERC20TokenWithOfficialOperators");

const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

let tokenWithOfficialOperators;

contract('ERC777ERC20TokenWithOfficialOperators', function (accounts) {
    // const [owner, buyer1, buyer2, buyer3, anyone] = accounts;

    it("should deploy new contract", async function () {
        tokenWithOfficialOperators = await ERC777ERC20TokenWithOfficialOperators.new();
        console.log(tokenWithOfficialOperators)
    });
});