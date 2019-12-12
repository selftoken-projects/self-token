const shouldFail = require("../helper/shouldFail");
const expectEvent = require("../helper/expectEvent");
const ethUtil = require('ethereumjs-util');
const BigNumber = web3.BigNumber;

const ERC820Registry = require('erc820');
const SelfToken = artifacts.require("SelfToken");
const DelegatedTransferOperator = artifacts.require("DelegatedTransferOperatorV4");

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// use web3 1.0.0 instead of truffle's 0.20.6 web3
const _Web3 = require('web3'); // version 1.0.0
const _web3 = new _Web3(web3.currentProvider);

const formattedAddress = (address) => {
  return Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
};
const formattedInt = (int) => {
  return ethUtil.setLengthLeft(int, 32);
};
const formattedBytes32 = (bytes) => {
  return ethUtil.addHexPrefix(bytes.toString('hex'));
};
const hashedTightPacked = (args) => {
  return ethUtil.sha3(Buffer.concat(args));
};

const alicePrivateKey = Buffer.from('2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201', 'hex');
const aliceAddress = ethUtil.privateToAddress('0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201').toString('hex');
// console.log("alice address should be:", aliceAddress);

let erc820Registry, selfToken, delegatedTransferOperator, token, operator;

contract('DelegatedTransferOperatorWithIncreasingNonceWithGasMinimized', function ([
  owner,
  alice,
  bob,
  charlie,
  damiens,
]) {
  // console.log("injected alice address:", alice);
  if ('0x' + aliceAddress !== alice) {
    console.error('the injected alice address !== the address generated from alicePrivateKey.');
    console.error('1. Please use `npm run test` to test.');
    console.error('2. You should see `Starting our own ganache instance` when running `npm run test`. If not, please make sure there are no other ganache instance running. ');
  }

  const initialTokenBalance = 1000;

  before(async function () {
    erc820Registry = await ERC820Registry.deploy(_web3, owner);
    assert.ok(erc820Registry.$address);
  });

  beforeEach(async function () {
    selfToken = await SelfToken.new({
      from: owner,
    });
    token = selfToken;
    delegatedTransferOperator = await DelegatedTransferOperator.new(
      selfToken.address, {
        from: owner,
      }
    );
    operator = delegatedTransferOperator;
    await selfToken.mint(alice, initialTokenBalance, "", {
      from: owner,
    });

    await selfToken.authorizeOperator(delegatedTransferOperator.address, {
      from: alice,
    });
  });

  it('should delegated transfer', async function () {
    const nonce = 1;
    const from = alice;
    const to = bob;
    const delegate = charlie;
    const fee = 10;
    const amount = 100;
    const userData = '0x10';

    const delegation = [
      formattedAddress(operator.address),
      formattedAddress(to),
      formattedAddress(delegate),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
      Buffer.from(userData.slice(2), 'hex'),
    ];

    // vrs.v: number, vrs.r: Buffer, vrs.s: Buffer
    const vrs = await ethUtil.ecsign(hashedTightPacked(delegation), alicePrivateKey);
    const sig = await ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

    await operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      vrs.v, {
        from: delegate,
      }
    ).should.be.fulfilled;

    // check if balances are updated
    (await selfToken.balanceOf(from)).should.be.bignumber.equal(initialTokenBalance - amount - fee);
    (await selfToken.balanceOf(to)).should.be.bignumber.equal(amount);
    (await selfToken.balanceOf(delegate)).should.be.bignumber.equal(fee);
  });

  it('should delegated transfer if the fee is 0', async function () {
    const nonce = 1;
    const from = alice;
    const to = bob;
    const delegate = charlie;
    const fee = 0;
    const amount = 100;
    const userData = '0x10';

    const delegation = [
      formattedAddress(operator.address),
      formattedAddress(to),
      formattedAddress(delegate),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
      Buffer.from(userData.slice(2), 'hex'),
    ];

    const vrs = await ethUtil.ecsign(hashedTightPacked(delegation), alicePrivateKey);
    const sig = await ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

    await operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      vrs.v, {
        from: delegate,
      }
    ).should.be.fulfilled;

    // check if balances are updated
    (await selfToken.balanceOf(from)).should.be.bignumber.equal(initialTokenBalance - amount - fee);
    (await selfToken.balanceOf(to)).should.be.bignumber.equal(amount);
    (await selfToken.balanceOf(delegate)).should.be.bignumber.equal(fee);
  });

  it('should allow anyone to send delegated transfer when the delegate is address(0)', async function () {
    const nonce = 1;
    const from = alice;
    const to = bob;
    const delegate = "0x0000000000000000000000000000000000000000";
    const sender = damiens;
    const fee = 10;
    const amount = 100;
    const userData = '0x10';

    const delegation = [
      formattedAddress(operator.address),
      formattedAddress(to),
      formattedAddress(delegate),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
      Buffer.from(userData.slice(2), 'hex'),
    ];

    const vrs = await ethUtil.ecsign(hashedTightPacked(delegation), alicePrivateKey);
    const sig = await ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

    await operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      vrs.v, {
        from: sender,
      }
    ).should.be.fulfilled;

    // check if balances are updated
    (await selfToken.balanceOf(from)).should.be.bignumber.equal(initialTokenBalance - amount - fee);
    (await selfToken.balanceOf(to)).should.be.bignumber.equal(amount);
    (await selfToken.balanceOf(sender)).should.be.bignumber.equal(fee);
  });

  it('should fail if the msg.sender is not the delegate', async function () {
    const nonce = 1;
    const from = alice;
    const to = bob;
    const delegate = charlie;
    const sender = damiens;
    const fee = 10;
    const amount = 100;
    const userData = '0x10';

    const delegation = [
      formattedAddress(operator.address),
      formattedAddress(to),
      formattedAddress(delegate),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
      Buffer.from(userData.slice(2), 'hex'),
    ];

    const vrs = await ethUtil.ecsign(hashedTightPacked(delegation), alicePrivateKey);
    const sig = await ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

    await shouldFail.reverting(operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      vrs.v, {
        from: sender,
      }
    ));
  });

  it('should fail if signature is invalid', async function () {
    const nonce = 1;
    const from = alice;
    const to = bob;
    const delegate = charlie;
    const fee = 10;
    const amount = 100;
    const userData = '0x10';

    const delegation = [
      formattedAddress(operator.address),
      formattedAddress(to),
      formattedAddress(delegate),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
      Buffer.from(userData.slice(2), 'hex'),
    ];

    // const vrs = await ethUtil.ecsign(hashedTightPacked(delegation), alicePrivateKey);
    // const sig = 'random';
    const vrs = {
      r: Buffer.from('1111111111111111111111111111111111111111111111111111111111111111', 'hex'),
      s: Buffer.from('1111111111111111111111111111111111111111111111111111111111111111', 'hex'),
      v: 27,
    };

    await shouldFail.reverting(operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      vrs.v, {
        from: delegate,
      }
    ));
  });

  it('should fail if signature is used', async function () {
    const nonce = 1;
    const from = alice;
    const to = bob;
    const delegate = charlie;
    const fee = 10;
    const amount = 100;
    const userData = '0x10';

    const delegation = [
      formattedAddress(operator.address),
      formattedAddress(to),
      formattedAddress(delegate),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
      Buffer.from(userData.slice(2), 'hex'),
    ];

    const vrs = await ethUtil.ecsign(hashedTightPacked(delegation), alicePrivateKey);
    const sig = await ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

    await operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      vrs.v, {
        from: delegate,
      }
    ).should.be.fulfilled;

    (await operator.usedNonce(from)).should.be.bignumber.equal(nonce);

    await shouldFail.reverting(operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      vrs.v, {
        from: delegate,
      }
    ));
  });

  it('should fail if transfer to address(0)', async function () {
    const nonce = 1;
    const from = alice;
    const to = "0x0000000000000000000000000000000000000000";
    const delegate = charlie;
    const fee = 10;
    const amount = 100;
    const userData = '0x10';

    const delegation = [
      formattedAddress(operator.address),
      formattedAddress(to),
      formattedAddress(delegate),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
      Buffer.from(userData.slice(2), 'hex'),
    ];

    const vrs = await ethUtil.ecsign(hashedTightPacked(delegation), alicePrivateKey);
    const sig = await ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

    await shouldFail.reverting(operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      vrs.v, {
        from: delegate,
      }
    ));
  });

  it('should fail if the v of signature is not 0, 1, 27, 28', async function () {
    const nonce = 1;
    const from = alice;
    const to = bob;
    const delegate = charlie;
    const fee = 10;
    const amount = 100;
    const userData = '0x10';

    const delegation = [
      formattedAddress(operator.address),
      formattedAddress(to),
      formattedAddress(delegate),
      formattedInt(amount),
      formattedInt(fee),
      formattedInt(nonce),
      Buffer.from(userData.slice(2), 'hex'),
    ];

    // vrs.v is 27 (number)
    const vrs = await ethUtil.ecsign(hashedTightPacked(delegation), alicePrivateKey);
    // const sig = await ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
    const v = 29;
    // const sig = ethUtil.bufferToHex(Buffer.concat([
    //   ethUtil.setLengthLeft(vrs.r, 32),
    //   ethUtil.setLengthLeft(vrs.s, 32),
    //   ethUtil.toBuffer(v),
    // ]));

    await shouldFail.reverting(operator.transferPreSigned(
      to,
      delegate,
      amount,
      fee,
      nonce,
      userData,
      formattedBytes32(vrs.r),
      formattedBytes32(vrs.s),
      v, {
        from: delegate,
      }
    ));
  });
});
