pragma solidity ^0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";
import { Pausable } from "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import { Freezable } from "./utils/Freezable.sol";

/// @dev The owner can pause/unpause the token.
/// When paused, all functions that may change the token balances are prohibited.
/// Function approve is prohibited too.
contract PausableFreezableERC777ERC20Token is ERC777ERC20BaseToken, Pausable, Freezable {

  // ERC777 methods

  /// @dev We can not call super.send() because send() is an xternal function.
  /// We can only override it.
  function send(address _to, uint256 _amount, bytes _userData)
    external
    whenNotPaused
    whenAccountNotFrozen(msg.sender)
    whenAccountNotFrozen(_to)
  {
    doSend(msg.sender, msg.sender, _to, _amount, _userData, "", true);
  }

  function operatorSend(address _from, address _to, uint256 _amount, bytes _userData, bytes _operatorData)
    external
    whenNotPaused
    whenAccountNotFrozen(_from)
    whenAccountNotFrozen(_to)
  {
    require(isOperatorFor(msg.sender, _from));
    doSend(msg.sender, _from, _to, _amount, _userData, _operatorData, true);
  }

  function burn(uint256 _amount, bytes _holderData)
    external
    whenNotPaused
    whenAccountNotFrozen(msg.sender)
  {
    doBurn(msg.sender, msg.sender, _amount, _holderData, "");
  }

  function operatorBurn(address _tokenHolder, uint256 _amount, bytes _holderData, bytes _operatorData)
    external
    whenNotPaused
    whenAccountNotFrozen(msg.sender)
    whenAccountNotFrozen(_tokenHolder)
  {
    require(isOperatorFor(msg.sender, _tokenHolder));
    doBurn(msg.sender, _tokenHolder, _amount, _holderData, _operatorData);
  }

  function doSend(
    address _operator,
    address _from,
    address _to,
    uint256 _amount,
    bytes _userData,
    bytes _operatorData,
    bool _preventLocking
  )
    internal
    whenNotPaused
    whenAccountNotFrozen(_from)
    whenAccountNotFrozen(_to)
  {
    super.doSend(_operator, _from, _to, _amount, _userData, _operatorData, _preventLocking);
  }

  function doBurn(address _operator, address _tokenHolder, uint256 _amount, bytes _holderData, bytes _operatorData)
    internal
    whenNotPaused
    whenAccountNotFrozen(_tokenHolder)
  {
    super.doBurn(_operator, _tokenHolder, _amount, _holderData, _operatorData);
  }

  // ERC20 methods

  function transfer(address _to, uint256 _amount)
    public
    erc20
    whenNotPaused
    whenAccountNotFrozen(_to)
    returns (bool success)
  {
    return super.transfer(_to, _amount);
  }

  function transferFrom(address _from, address _to, uint256 _amount)
    public
    erc20
    whenNotPaused
    whenAccountNotFrozen(_from)
    whenAccountNotFrozen(_to)
    returns (bool success)
  {
    return super.transferFrom(_from, _to, _amount);
  }

  function approve(address _spender, uint256 _amount)
    public
    erc20
    whenNotPaused
    whenAccountNotFrozen(_spender)
    returns (bool success)
  {
    return super.approve( _spender, _amount);
  }
}
