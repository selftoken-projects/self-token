const assertRevert = require("./helper/assertRevert");
const ether = require("./helper/ether");
const expectThrow = require("./helper/expectThrow");
const SelfToken = artifacts.require("SelfToken");

const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

let selfToken;

contract('SelfToken', function (accounts) {
    // const [owner, buyer1, buyer2, buyer3, anyone] = accounts;

    it("should deploy new contract", async function () {
        selfToken = await SelfToken.new();
        console.log(selfToken)
    });
});