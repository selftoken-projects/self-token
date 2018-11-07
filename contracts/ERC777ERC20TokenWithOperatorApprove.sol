pragma solidity ^0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";

/// @title ERC777 ERC20 Token with Operator Approve
/// @author Roger-Wu
/// @notice Allow an operator to approve tokens for a token holder.
contract ERC777ERC20TokenWithOperatorApprove is ERC777ERC20BaseToken {
  function operatorApprove(
    address _tokenHolder,
    address _spender,
    uint256 _amount
  )
    public
    erc20
    returns (bool success)
  {
    require(
      isOperatorFor(msg.sender, _tokenHolder),
      "msg.sender is not an operator for _tokenHolder"
    );

    mAllowed[_tokenHolder][_spender] = _amount;
    emit Approval(_tokenHolder, _spender, _amount);
    return true;
  }
}