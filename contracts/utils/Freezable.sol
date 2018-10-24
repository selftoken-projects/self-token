contract Freezable is Ownable {

  import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

  event AccountFrozen(address indexed _account);
  event AccountReleased(address indexed _account);
  
  // freeze status of addresses
  mapping(address=>bool) public frozenAccounts;
  
  
   /**
   * @dev Modifier to make a function callable only when the address is frozen.
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