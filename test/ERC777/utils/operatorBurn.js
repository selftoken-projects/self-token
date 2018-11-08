/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require("chai");
chai.use(require("chai-as-promised"));
const utils = require("./index");

exports.test = function (web3, accounts, token) {
  describe("operatorBurn", function () {
    beforeEach(async function () {
      await utils.mintForAllAccounts(
        web3,
        accounts,
        token,
        accounts[0],
        "10",
        100000
      );
    });

    it(
      `should let ${utils.formatAccount(token.burnOperator)} ` +
      `burn 1 ${token.symbol} from ` +
      `${utils.formatAccount(accounts[1])}`,
      async function () {
        await token.contract.methods
          .authorizeOperator(token.burnOperator)
          .send({
            from: accounts[1],
            gas: 300000
          });

        await utils.assertTotalSupply(
          web3,
          token,
          10 * accounts.length + token.initialSupply
        );
        await utils.assertBalance(web3, token, accounts[1], 10);

        let eventsCalled = utils.assertEventsWillBeCalled(token.contract, [{
            name: "Burned",
            data: {
              operator: token.burnOperator,
              from: accounts[1],
              amount: utils.tokenUnit("1"),
              data: null,
              operatorData: null
            }
          },
          {
            name: "Transfer",
            data: {
              from: accounts[1],
              to: utils.zeroAddress,
              amount: utils.tokenUnit("1")
            }
          }
        ]);

        await token.contract.methods
          .operatorBurn(accounts[1], utils.tokenUnit("1"), "0x", "0x")
          .send({
            gas: 300000,
            from: token.burnOperator
          });

        await utils.getBlock(web3);
        await utils.assertTotalSupply(
          web3,
          token,
          10 * accounts.length + token.initialSupply - 1
        );
        await utils.assertBalance(web3, token, accounts[1], 9);
        await eventsCalled;
      }
    );

    // it(`should let ${utils.formatAccount(token.burnOperator)} ` +
    //   `burn 1 ${token.symbol} from ` +
    //   `${utils.formatAccount(accounts[1])}` +
    //   '(ERC20 Disabled)', async function () {
    //     await token.contract.methods
    //       .authorizeOperator(token.burnOperator)
    //       .send({
    //         from: accounts[1],
    //         gas: 300000
    //       });

    //     await token.disableERC20();

    //     await utils.assertTotalSupply(
    //       web3, token, 10 * accounts.length + token.initialSupply);
    //     await utils.assertBalance(web3, token, accounts[1], 10);

    //     let eventCalled = utils.assertEventWillBeCalled(
    //       token.contract,
    //       'Burned', {
    //         operator: token.burnOperator,
    //         from: accounts[1],
    //         amount: utils.tokenUnit('1'),
    //         data: '0xcafe',
    //         operatorData: '0xbeef',
    //       }
    //     );

    //     await token.contract.methods
    //       .operatorBurn(
    //         accounts[1], utils.tokenUnit('1'), '0xcafe', '0xbeef')
    //       .send({
    //         gas: 300000,
    //         from: token.burnOperator
    //       });

    //     await utils.getBlock(web3);
    //     await utils.assertTotalSupply(
    //       web3, token, 10 * accounts.length + token.initialSupply - 1);
    //     await utils.assertBalance(web3, token, accounts[1], 9);
    //     await eventCalled;
    //   });

    it(
      `should not let ${utils.formatAccount(token.burnOperator)} burn from ` +
      `${utils.formatAccount(accounts[2])} (not operator)`,
      async function () {
        await utils.assertTotalSupply(
          web3,
          token,
          10 * accounts.length + token.initialSupply
        );
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.contract.methods
          .operatorBurn(accounts[2], utils.tokenUnit("4"), "0x", "0x")
          .send({
            gas: 300000,
            from: token.burnOperator
          })
          .should.be.rejectedWith("revert");

        await utils.getBlock(web3);
        await utils.assertTotalSupply(
          web3,
          token,
          10 * accounts.length + token.initialSupply
        );
        await utils.assertBalance(web3, token, accounts[2], 10);
      }
    );

    // it(
    //   `should not let ${utils.formatAccount(accounts[4])} burn from ` +
    //     `${utils.formatAccount(accounts[2])} ` +
    //     "(not burn operator)",
    //   async function() {
    //     await utils.assertTotalSupply(
    //       web3,
    //       token,
    //       10 * accounts.length + token.initialSupply
    //     );
    //     await utils.assertBalance(web3, token, accounts[2], 10);

    //     await token.contract.methods.authorizeOperator(accounts[4]).send({
    //       from: accounts[2],
    //       gas: 300000
    //     });

    //     await token.contract.methods
    //       .operatorBurn(accounts[2], utils.tokenUnit("4"), "0x", "0x")
    //       .send({
    //         gas: 300000,
    //         from: accounts[4]
    //       })
    //       .should.be.rejectedWith("revert");

    //     await utils.getBlock(web3);
    //     await utils.assertTotalSupply(
    //       web3,
    //       token,
    //       10 * accounts.length + token.initialSupply
    //     );
    //     await utils.assertBalance(web3, token, accounts[2], 10);
    //   }
    // );

    it(
      `should let ${utils.formatAccount(token.burnOperator)} ` +
      "use operatorBurn on itself",
      async function () {
        await utils.assertTotalSupply(
          web3,
          token,
          10 * accounts.length + token.initialSupply
        );
        await utils.assertBalance(web3, token, token.burnOperator, 10);
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.contract.methods
          .operatorBurn(token.burnOperator, utils.tokenUnit("4"), "0x", "0x")
          .send({
            gas: 300000,
            from: token.burnOperator
          });

        await utils.getBlock(web3);
        await utils.assertTotalSupply(
          web3,
          token,
          10 * accounts.length + token.initialSupply - 4
        );
        await utils.assertBalance(web3, token, token.burnOperator, 6);
      }
    );
  });
};