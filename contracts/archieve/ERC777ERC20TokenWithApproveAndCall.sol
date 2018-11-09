pragma solidity 0.4.24;

import { PausableFreezableERC777ERC20Token } from "./PausableFreezableERC777ERC20Token.sol";
import { ApprovalRecipient } from "./ApprovalRecipient.sol";

contract ERC777ERC20TokenWithApproveAndCall is PausableFreezableERC777ERC20Token {
  /// Set allowance for other address and notify
  /// Allows `_spender` to spend no more than `_value` tokens on your behalf, and then ping the contract about it
  /// From https://www.ethereum.org/token
  /// @param _spender The address authorized to spend
  /// @param _value the max amount they can spend
  /// @param _extraData some extra information to send to the approved contract
  function approveAndCall(address _spender, uint256 _value, bytes _extraData)
    external
    whenNotPaused
    whenAccountNotFrozen(msg.sender)
    whenAccountNotFrozen(_spender)
    returns (bool success)
  {
    ApprovalRecipient spender = ApprovalRecipient(_spender);
    if (approve(_spender, _value)) {
      spender.receiveApproval(msg.sender, _value, this, _extraData);
      return true;
    }
  }
}