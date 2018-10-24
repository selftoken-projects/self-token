pragma solidity ^0.4.25;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/// @title An inheritable extension for a contract to freeze accessibility of any specific addresses
/// @author Jeff Hu
/// @notice Have a contract inherited from this to use the modifiers: whenAccountFrozen(), whenAccountNotFrozen()
/// @dev Concern: Ownable may cause multiple owners; You need to pass in msg.sender when using modifiers
contract Freezable is Ownable {

  event AccountFrozen(address indexed _account);
  event AccountReleased(address indexed _account);
  
  // freeze status of addresses
  mapping(address=>bool) public frozenAccounts;
  
  
   /**
   * ///@dev Modifier to make a function callable only when the address is frozen.
   */
  modifier whenAccountFrozen(address _account) {
    require(frozenAccounts[_account] == true);
    _;
  }
  
  /**
   * @dev Modifier to make a function callable only when the address is not frozen.
   */
  modifier whenAccountNotFrozen(address _account) {
    require(frozenAccounts[_account] == false);
    _;
  }
  

  /**
   * @dev Function to freeze an account from transactions
   */
  function freeze(address _account) public onlyOwner whenAccountNotFrozen(_account) returns (bool) {
    frozenAccounts[_account] = true;
    emit AccountFrozen(_account);
    return true;
  }

  /**
   * @dev Function to release an account form frozen state
   */
  function release(address _account) public onlyOwner whenAccountFrozen(_account) returns (bool) {
    frozenAccounts[_account] = false;
    emit AccountReleased(_account);
    return true;
  }
 
}