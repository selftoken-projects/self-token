pragma solidity ^0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";
import { Pausable } from "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";


/// @dev The owner can pause/unpause the token.
/// When paused, all functions that may change the token balances are prohibited.
/// Function approve is prohibited too.
contract PausableERC777ERC20Token is ERC777ERC20BaseToken, Pausable {

  // ERC777 methods

  /// @dev We can not call super.send() because send() is an xternal function.
  /// We can only override it.
  function send(address _to, uint256 _amount, bytes _userData)
    external
    whenNotPaused
  {
    doSend(msg.sender, msg.sender, _to, _amount, _userData, "", true);
  }

  function operatorSend(address _from, address _to, uint256 _amount, bytes _userData, bytes _operatorData)
    external
    whenNotPaused
  {
    require(isOperatorFor(msg.sender, _from));
    doSend(msg.sender, _from, _to, _amount, _userData, _operatorData, true);
  }

  function burn(uint256 _amount, bytes _holderData)
    external
    whenNotPaused
  {
    doBurn(msg.sender, msg.sender, _amount, _holderData, "");
  }

  function operatorBurn(address _tokenHolder, uint256 _amount, bytes _holderData, bytes _operatorData)
    external
    whenNotPaused
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
  {
    super.doSend(_operator, _from, _to, _amount, _userData, _operatorData, _preventLocking);
  }

  function doBurn(address _operator, address _tokenHolder, uint256 _amount, bytes _holderData, bytes _operatorData)
    internal
    whenNotPaused
  {
    super.doBurn(_operator, _tokenHolder, _amount, _holderData, _operatorData);
  }

  // ERC20 methods

  function transfer(address _to, uint256 _amount)
    public
    erc20
    whenNotPaused
    returns (bool success)
  {
    return super.transfer(_to, _amount);
  }

  function transferFrom(address _from, address _to, uint256 _amount)
    public
    erc20
    whenNotPaused
    returns (bool success)
  {
    return super.transferFrom(_from, _to, _amount);
  }

  function approve(address _spender, uint256 _amount)
    public
    erc20
    whenNotPaused
    returns (bool success)
  {
    return super.approve( _spender, _amount);
  }
}
