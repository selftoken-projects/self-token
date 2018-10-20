pragma solidity ^0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";
import { AddressSet } from "./utils/AddressSet.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/// @title ERC777 ERC20 Token with Official Operators
/// @author Roger-Wu
/// @dev Official operators are officially recommended operators for all token holders.
/// Official operators can be added or removed by the contract owner.
/// A user can decide whether or not to authorize all official operators.
/// A user authorizes all official operators by default.
contract ERC777ERC20TokenWithOfficialOperators is ERC777ERC20BaseToken, Ownable {
  using AddressSet for AddressSet.Data;

  AddressSet.Data internal mOfficialOperatorSet;
  mapping(address => bool) internal mIsRejectingOfficialOperators;

  event AddedOfficialOperator(address operator);
  event RemovedOfficialOperator(address operator);
  event AuthorizedOfficialOperators(address indexed tokenHolder);
  event UnauthorizedOfficialOperators(address indexed tokenHolder);

  /// @notice Add an address into the list of official operators.
  /// @param _operator The address of a new official operator.
  /// An official operator must be a contract.
  function addOfficialOperator(address _operator) public onlyOwner {
    require(!isRegularAddress(_operator));

    /// revert if _operator is already in mOfficialOperatorSet
    require(mOfficialOperatorSet.add(_operator));

    emit AddedOfficialOperator(_operator);
  }

  /// @notice Delete an address from the list of official operators.
  /// @param _operator The address of an official operator.
  function removeOfficialOperator(address _operator) public onlyOwner {
    /// revert if _operator is not in mOfficialOperatorSet
    require(mOfficialOperatorSet.remove(_operator));

    emit RemovedOfficialOperator(_operator);
  }

  /// @notice Authorize all official operators to manage `msg.sender`'s tokens.
  function authorizeOfficialOperators() public {
    mIsRejectingOfficialOperators[msg.sender] = false;
    emit AuthorizedOfficialOperators(msg.sender);
  }

  /// @notice Unauthorize all official operators to manage `msg.sender`'s tokens.
  function unauthorizeOfficialOperators() public {
    mIsRejectingOfficialOperators[msg.sender] = true;
    emit UnauthorizedOfficialOperators(msg.sender);
  }

  /// @return the list of all the official operators
  function officialOperators() public view returns(address[]) {
    return mOfficialOperatorSet.elements;
  }

  /// @notice Check whether the `_operator` address is allowed to manage the tokens held by `_tokenHolder` address.
  /// @param _operator address to check if it has the right to manage the tokens
  /// @param _tokenHolder address which holds the tokens to be managed
  /// @return `true` if `_operator` is authorized for `_tokenHolder`
  function isOperatorFor(address _operator, address _tokenHolder) public constant returns (bool) {
    return (
      (_operator == _tokenHolder)
      || (!mIsRejectingOfficialOperators[_tokenHolder] && mOfficialOperatorSet.contains(_operator))
      || mAuthorized[_operator][_tokenHolder]
      || (mIsDefaultOperator[_operator] && !mRevokedDefaultOperator[_operator][_tokenHolder])
    );
  }

  /// Approval

  /// @notice Operators can approve for a token holder.
  function operatorApprove(address _tokenHolder, address _spender, uint256 _amount) public erc20 returns (bool success) {
    require(isOperatorFor(msg.sender, _tokenHolder));
    mAllowed[_tokenHolder][_spender] = _amount;
    emit Approval(_tokenHolder, _spender, _amount);
    return true;
  }
}