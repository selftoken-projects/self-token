pragma solidity ^0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";

contract ERC777ERC20TokenWithBatchTransfer is ERC777ERC20BaseToken {
  /// @notice ERC20 backwards compatible batch transfer.
  /// @param _recipients The addresses of the recipients
  /// @param _amounts The numbers of tokens to be transferred
  /// @return `true`, if the transfer can't be done, it should fail.
  function batchTransfer(address[] _recipients, uint256[] _amounts) public erc20 returns (bool success) {
    require(_recipients.length == _amounts.length, "the lengths of _recipients and _amounts should be the same");
    for (uint256 i = 0; i < _recipients.length; i++) {
      doSend(msg.sender, msg.sender, _recipients[i], _amounts[i], "", "", false);
    }
    return true;
  }
}
