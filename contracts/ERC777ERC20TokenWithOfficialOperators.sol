pragma solidity ^0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { AddressUtils } from "openzeppelin-solidity/contracts/AddressUtils.sol";

/// @title ERC777 ERC20 Token with Official Operators
/// @author Roger-Wu
/// @notice Official operators are officially recommended operator contracts.
/// By adding new official operators, we can keep adding new features to
/// an already deployed token contract, which can be viewed as a way to
/// upgrade the contract.
/// Rules of official operators:
/// 1. An official operator must be a contract.
/// 2. An official operator can only be added or removed by the contract owner.
/// 3. Official operators are authorized operators for all token holders by default.
/// 4. A token holder can choose to unauthorize official operators. Then all official
///    operators will not be authorized operators for them. The token holder can still
///    authorize some of the official operators if they want.
contract ERC777ERC20TokenWithOfficialOperators is ERC777ERC20BaseToken, Ownable {
  using AddressUtils for address;

  mapping(address => bool) internal mIsOfficialOperator;
  mapping(address => bool) internal mHasUserUnauthorizedOfficialOperators;

  event OfficialOperatorAdded(address operator);
  event OfficialOperatorRemoved(address operator);
  event OfficialOperatorsAuthorizedByUser(address indexed user);
  event OfficialOperatorsUnauthorizedByUser(address indexed user);

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
    require(!mHasUserUnauthorizedOfficialOperators[msg.sender], "Official operators are already unauthorized by msg.sender.");

    mHasUserUnauthorizedOfficialOperators[msg.sender] = true;
    emit OfficialOperatorsUnauthorizedByUser(msg.sender);
  }

  /// @notice Authorize all official operators to manage `msg.sender`'s tokens.
  function acceptAllOfficialOperators() public {
    require(mHasUserUnauthorizedOfficialOperators[msg.sender], "Official operators are already authorized by msg.sender.");

    mHasUserUnauthorizedOfficialOperators[msg.sender] = false;
    emit OfficialOperatorsAuthorizedByUser(msg.sender);
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
      || (!mHasUserUnauthorizedOfficialOperators[_tokenHolder] && mIsOfficialOperator[_operator])
      || mAuthorized[_operator][_tokenHolder]
      || (mIsDefaultOperator[_operator] && !mRevokedDefaultOperator[_operator][_tokenHolder])
    );
  }
}