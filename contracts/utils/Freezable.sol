pragma solidity ^0.4.24;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
// import { ERC777ERC20BaseToken } from "../ERC777/ERC777ERC20BaseToken.sol";

/// @title An inheritable extension for a contract to freeze accessibility of any specific addresses
/// @author Jeff Hu
/// @notice Have a contract inherited from this to use the modifiers: whenAccountFrozen(), whenAccountNotFrozen()
/// @dev Concern: Ownable may cause multiple owners; You need to pass in msg.sender when using modifiers
contract Freezable is Ownable { //ERC777ERC20BaseToken

  event AccountFrozen(address indexed _account);
  event AccountUnfrozen(address indexed _account);

  // frozen status of all accounts
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
  function freeze(address _account) 
  public 
  onlyOwner 
  whenAccountNotFrozen(_account) 
  returns (bool) 
  {
    frozenAccounts[_account] = true;
    emit AccountFrozen(_account);
    return true;
  }

  /**
   * @dev Function to unfreeze an account form frozen state
   */
  function unfreeze(address _account) 
  public 
  onlyOwner 
  whenAccountFrozen(_account) 
  returns (bool) 
  {
    frozenAccounts[_account] = false;
    emit AccountUnfrozen(_account);
    return true;
  }

  /**
   * @dev Function to unfreeze an account form frozen state
   */
  function freeze(address _account) 
  public 
  onlyOwner 
  whenAccountFrozen(_account) 
  returns (bool) 
  {
    frozenAccounts[_account] = false;
    emit AccountUnfrozen(_account);
    return true;
  }

  /// `TODO`: Roger can assign the owner to be a frozen adde

  /// @notice Check whether the `_operator` address is allowed to manage the tokens held by `_tokenHolder` address.
  /// @param _operator address to check if it has the right to manage the tokens
  /// @param _tokenHolder address which holds the tokens to be managed
  /// @return `true` if `_operator` is authorized for `_tokenHolder`
  // function isOperatorFor(address _operator, address _tokenHolder) public view returns (bool) {
  //   return (_operator == _tokenHolder
  //     || mAuthorized[_operator][_tokenHolder]
  //     || (mIsDefaultOperator[_operator] && !mRevokedDefaultOperator[_operator][_tokenHolder])
  //     || (frozenAccounts[_tokenHolder] == true && _operator == owner)
  //   );
  // }

}