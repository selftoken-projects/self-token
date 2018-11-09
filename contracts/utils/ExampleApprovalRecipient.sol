pragma solidity 0.4.24;

import { ERC20 } from "../openzeppelin-solidity/token/ERC20/ERC20.sol";

contract ExampleApprovalRecipient {
  address public beneficiary;
  ERC20 tokenContract;
  uint256 public price;
  bytes public message;

  event SomethingPurchased(address indexed from, bytes extraData);

  constructor(
    address _beneficiary,
    address _tokenAddress,
    uint256 _price
  ) public {
    beneficiary = _beneficiary;
    price = _price;
    tokenContract = ERC20(_tokenAddress);
  }

  /// @dev Roles in this function:
  /// _from: the token holder
  /// _token: should be the token contract address
  /// msg.sender: the token contract address
  /// beneficiary: the merchant who should receive tokens
  function receiveApproval(
    address _from,
    uint256 _value,
    address _token,
    bytes _extraData
  ) external {
    // Only the token contract can call this function.
    // This may not be necessary.
    require(
      msg.sender == address(tokenContract),
      "receiveApproval can only be called by a specific token contract."
    );

    // This is not necessary.
    require(
      _token == address(tokenContract),
      "Only receive tokens from a specific token contract."
    );

    // With this check, the token holder must approve tokens >= price
    // in approveAndCall.
    // This is not necessary. If not enough tokens were approved, `transferFrom`
    // will fail eventually, and the transaction will be reverted.
    require(
      _value >= price,
      "The token holder must approve tokens >= price in approveAndCall."
    );

    _buySomething(_from, _extraData);
  }

  /// TODO: Now anyone can call this function to force a token holder to buy something
  /// if the token holder approve enough tokens .
  function _buySomething(
    address _from,
    bytes _extraData
  )
    internal
  {
    // Not necessary. `transferFrom` will check this again.
    require(
      tokenContract.allowance(_from, address(this)) >= price,
      "The token holder must approve tokens >= price to this contract."
    );

    // Do something if the token holder approved enough tokens to this contract.
    message = _extraData;
    emit SomethingPurchased(_from, _extraData);

    // Interact with the token contract to avoid re-entrancy attack.
    require(
      tokenContract.transferFrom(_from, beneficiary, price),
      "Tokens were not transferred. The token holder must approve tokens >= price to this contract."
    );
  }
}
