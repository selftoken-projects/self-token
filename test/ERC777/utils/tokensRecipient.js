// /* This Source Code Form is subject to the terms of the Mozilla Public
//  * License, v. 2.0. If a copy of the MPL was not distributed with this
//  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// const chai = require("chai");
// const assert = chai.assert;
// chai.use(require("chai-as-promised")).should();
// const utils = require("./index");
// const OldExampleTokensRecipient = artifacts.require("ExampleTokensRecipient");

// exports.test = function (web3, accounts, token) {
//   const ExampleTokensRecipient = new web3.eth.Contract(
//     OldExampleTokensRecipient.abi, {
//       data: OldExampleTokensRecipient.bytecode
//     }
//   );
//   let recipient;
//   describe("TokensRecipient", async function () {
//     beforeEach(async function () {
//       await utils.mintForAllAccounts(
//         web3,
//         accounts,
//         token,
//         accounts[0],
//         "10",
//         100000
//       );

//       recipient = await ExampleTokensRecipient.deploy({
//         arguments: [false]
//       }).send({
//         from: accounts[4],
//         gasLimit: 4712388
//       });

//       let erc820Registry = utils.getERC820Registry(web3);
//       await erc820Registry
//         .setInterfaceImplementer(
//           accounts[4],
//           web3.utils.keccak256('ERC777TokensRecipient'),
//           recipient.options.address, {
//             from: accounts[4],
//             gas: 300000,
//             gasLimit: 4712388
//           });
//       assert.ok(recipient.options.address);
//     });

//     // truffle clean-room is not able to revert the ERC820Registry
//     // manually unset any TokensRecipient that may have been set during testing.
//     afterEach(async function () {
//       for (let account of accounts) {
//         await erc820Registry
//           .setInterfaceImplementer(
//             account,
//             web3.utils.keccak256('ERC777TokensRecipient'),
//             utils.zeroAddress, {
//               from: account,
//               gas: 300000
//             });
//       }
//     });

//     // TO FIX (unknown revert)
//     // it("should notify the recipient upon receiving tokens", async function () {
//     //   await utils.assertTotalSupply(web3, token, 10 * accounts.length);
//     //   await utils.assertBalance(web3, token, accounts[5], 10);
//     //   await utils.assertBalance(web3, token, recipient.options.address, 0);

//     //   await recipient.methods
//     //     .acceptTokens()
//     //     .send({
//     //       gas: 300000,
//     //       from: accounts[4]
//     //     });

//     //   await token.contract.methods
//     //     .send(recipient.options.address, web3.utils.toWei('1'), '0x')
//     //     .send({
//     //       gas: 300000,
//     //       from: accounts[5]
//     //     });

//     //   await utils.getBlock(web3);

//     //   await utils.assertTotalSupply(web3, token, 10 * accounts.length);
//     //   await utils.assertBalance(web3, token, accounts[5], 9);
//     //   await utils.assertBalance(web3, token, recipient.options.address, 1);
//     // });

//     it("should let the recipient reject the tokens", async function () {
//       await utils.assertTotalSupply(web3, token, 10 * accounts.length);
//       await utils.assertBalance(web3, token, accounts[5], 10);
//       await utils.assertBalance(web3, token, recipient.options.address, 0);

//       await recipient.methods
//         .rejectTokens()
//         .send({
//           gas: 300000,
//           from: accounts[4]
//         });

//       await token.contract.methods
//         .send(recipient.options.address, web3.utils.toWei("1"), "0x")
//         .send({
//           gas: 300000,
//           from: accounts[5]
//         })
//         .should.be.rejectedWith("revert");

//       await utils.getBlock(web3);

//       // revert will prevent setting notified to true
//       await utils.assertTotalSupply(web3, token, 10 * accounts.length);
//       await utils.assertBalance(web3, token, accounts[5], 10);
//       await utils.assertBalance(web3, token, recipient.options.address, 0);
//     });

//     it(
//       'should call "TokensRecipient" for ' +
//       `${utils.formatAccount(accounts[4])}`,
//       async function () {
//         recipient = await ExampleTokensRecipient.deploy({
//           arguments: [false]
//         }).send({
//           from: accounts[4],
//           gasLimit: 4712388
//         });
//         assert.ok(recipient.options.address);

//         let erc820Registry = utils.getERC820Registry(web3);

//         await erc820Registry
//           .setInterfaceImplementer(
//             accounts[4],
//             web3.utils.keccak256('ERC777TokensRecipient'),
//             recipient.options.address, {
//               from: accounts[4]
//             });
//         assert.ok(recipient.options.address);

//         await utils.assertTotalSupply(web3, token, 10 * accounts.length);
//         await utils.assertBalance(web3, token, accounts[4], 10);
//         await utils.assertBalance(web3, token, accounts[5], 10);
//         await utils.assertBalance(web3, token, recipient.options.address, 0);

//         await recipient.methods
//           .acceptTokens()
//           .send({
//             gas: 300000,
//             from: accounts[4]
//           });

//         await token.contract.methods
//           .send(accounts[4], web3.utils.toWei("1"), "0x")
//           .send({
//             gas: 300000,
//             from: accounts[5]
//           });

//         await utils.getBlock(web3);

//         await utils.assertTotalSupply(web3, token, 10 * accounts.length);
//         await utils.assertBalance(web3, token, accounts[4], 11);
//         await utils.assertBalance(web3, token, accounts[5], 9);
//         await utils.assertBalance(web3, token, recipient.options.address, 0);
//       }
//     );

//     it(
//       "should not send tokens to a contract " + "without TokensRecipient",
//       async function () {
//         // must be redeployed without registering with erc820 for this test
//         recipient = await ExampleTokensRecipient.deploy({
//           arguments: [false]
//         }).send({
//           from: accounts[4],
//           gasLimit: 4712388
//         });
//         assert.ok(recipient.options.address);

//         await utils.assertTotalSupply(web3, token, 10 * accounts.length);
//         await utils.assertBalance(web3, token, accounts[5], 10);
//         await utils.assertBalance(web3, token, recipient.options.address, 0);

//         await token.contract.methods
//           .send(recipient.options.address, web3.utils.toWei("1"), "0x")
//           .send({
//             gas: 300000,
//             from: accounts[5]
//           })
//           .should.be.rejectedWith("revert");

//         await utils.getBlock(web3);

//         // revert will prevent setting notified to true
//         await utils.assertTotalSupply(web3, token, 10 * accounts.length);
//         await utils.assertBalance(web3, token, accounts[5], 10);
//         await utils.assertBalance(web3, token, recipient.options.address, 0);
//       }
//     );

//   });
// };