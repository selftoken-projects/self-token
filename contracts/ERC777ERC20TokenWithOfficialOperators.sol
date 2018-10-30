pragma solidity ^0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { AddressUtils } from "openzeppelin-solidity/contracts/AddressUtils.sol";

/// @title ERC777 ERC20 Token with Official Operators
/// @author Roger-Wu
/// @notice Official operators are officially recommended operator contracts.
/// By adding new official operators, we can keep adding new features to
/// an already deployed token contract, which can be viewed as a way to
/// upgrade the token contract.
/// Rules of official operators:
/// 1. An official operator must be a contract.
/// 2. An official operator can only be added or removed by the contract owner.
/// 3. A token holder can either accept all official operators or not.
///    By default, a token holder accepts all official operators, including
///    the official operators added in the future.
/// 4. If a token holder accepts all official operators, it works as if all
///    the addresses of official operators has been authorized to be his operator.
///    In this case, an official operator will always be the token holder's
///    operator even if he tries to revoke it by sending `revokeOperator` transactions.
/// 5. If a token holder chooses not to accept all official operators, it works as if
///    there is no official operator at all for him. The token holder can still authorize
///    any addresses, including which of official operators, to be his operators.
contract ERC777ERC20TokenWithOfficialOperators is ERC777ERC20BaseToken, Ownable {
  using AddressUtils for address;

  mapping(address => bool) internal mIsOfficialOperator;
  mapping(address => bool) internal mIsUserNotAcceptingAllOfficialOperators;

  event OfficialOperatorAdded(address operator);
  event OfficialOperatorRemoved(address operator);
  event OfficialOperatorsAcceptedByUser(address indexed user);
  event OfficialOperatorsRejectedByUser(address indexed user);

  /// @notice Add an address into the list of official operators.
  /// @param _operator The address of a new official operator.
  /// An official operator must be a contract.
  function addOfficialOperator(address _operator) public onlyOwner {
    require(_operator.isContract(), "An official operator must be a contract.");
    require(!mIsOfficialOperator[_operator], "_operator is already an official operator.");

    mIsOfficialOperator[_operator] = true;
    emit OfficialOperatorAdded(_operator);
  }

  /// @notice Delete an address from the list of official operators.
  /// @param _operator The address of an official operator.
  function removeOfficialOperator(address _operator) public onlyOwner {
    require(mIsOfficialOperator[_operator], "_operator is not an official operator.");

    mIsOfficialOperator[_operator] = false;
    emit OfficialOperatorRemoved(_operator);
  }

  /// @notice Unauthorize all official operators to manage `msg.sender`'s tokens.
  function rejectAllOfficialOperators() public {
    require(!mIsUserNotAcceptingAllOfficialOperators[msg.sender], "Official operators are already rejected by msg.sender.");

    mIsUserNotAcceptingAllOfficialOperators[msg.sender] = true;
    emit OfficialOperatorsRejectedByUser(msg.sender);
  }

  /// @notice Authorize all official operators to manage `msg.sender`'s tokens.
  function acceptAllOfficialOperators() public {
    require(mIsUserNotAcceptingAllOfficialOperators[msg.sender], "Official operators are already accepted by msg.sender.");

    mIsUserNotAcceptingAllOfficialOperators[msg.sender] = false;
    emit OfficialOperatorsAcceptedByUser(msg.sender);
  }

  /// @return true if the address is an official operator, false if not.
  function isOfficialOperator(address _operator) public view returns(bool) {
    return mIsOfficialOperator[_operator];
  }

  /// @notice Check whether the `_operator` address is allowed to manage the tokens held by `_tokenHolder` address.
  /// @param _operator address to check if it has the right to manage the tokens
  /// @param _tokenHolder address which holds the tokens to be managed
  /// @return `true` if `_operator` is authorized for `_tokenHolder`
  function isOperatorFor(address _operator, address _tokenHolder) public constant returns (bool) {
    return (
      (_operator == _tokenHolder)
      || (!mIsUserNotAcceptingAllOfficialOperators[_tokenHolder] && mIsOfficialOperator[_operator])
      || mAuthorized[_operator][_tokenHolder]
      || (mIsDefaultOperator[_operator] && !mRevokedDefaultOperator[_operator][_tokenHolder])
    );
  }
}