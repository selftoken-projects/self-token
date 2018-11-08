module.exports = {
  port: 8555,
  // testrpcOptions: '-p 8555',
  norpc: true, // true if we want to launch our own testrpc instance
  // dir: './secretDirectory',
  // copyPackages: ['zeppelin-solidity'],
  skipFiles: ['contracts/operators/BatchSendOperator.sol'] //
};