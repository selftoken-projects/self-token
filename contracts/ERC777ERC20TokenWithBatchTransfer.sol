pragma solidity ^0.4.24;

import { PausableFreezableERC777ERC20Token } from "./PausableFreezableERC777ERC20Token.sol";

contract ERC777ERC20TokenWithBatchTransfer is PausableFreezableERC777ERC20Token {
  /// @notice ERC20 backwards compatible batch transfer.
  /// @param _recipients The addresses of the recipients
  /// @param _amounts The numbers of tokens to be transferred
  /// @return `true`, if the transfer can't be done, it should fail.
  function batchTransfer(address[] _recipients, uint256[] _amounts)
    public
    erc20
    whenNotPaused
    whenAccountNotFrozen(msg.sender)
    returns (bool success)
  {
    require(_recipients.length == _amounts.length, "The lengths of _recipients and _amounts should be the same.");

    for (uint256 i = 0; i < _recipients.length; i++) {
      doSend(msg.sender, msg.sender, _recipients[i], _amounts[i], "", "", false);
    }
    return true;
  }

  /// @notice Send tokens to multiple recipients.
  /// @param _recipients The addresses of the recipients
  /// @param _amounts The numbers of tokens to be transferred
  function batchSend(address[] _recipients, uint256[] _amounts, bytes _userData)
    whenNotPaused
    whenAccountNotFrozen(msg.sender)
    external
  {
    require(_recipients.length == _amounts.length, "The lengths of _recipients and _amounts should be the same.");

    for (uint256 i = 0; i < _recipients.length; i++) {
      doSend(msg.sender, msg.sender, _recipients[i], _amounts[i], _userData, "", true);
    }
  }
}
