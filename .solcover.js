module.exports = {
  port: 8555,
  // testrpcOptions: '-p 8555',
  norpc: true, // true if we want to launch our own testrpc instance 
  // dir: './secretDirectory',
  // copyPackages: ['zeppelin-solidity'],
  testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle test',
  compileCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle compile',
  skipFiles: ['operators/BatchSendOperator.sol', 'utils/ExampleApprovalRecipient.sol', 'ERC777/examples', 'ERC820/ERC820Client']
};