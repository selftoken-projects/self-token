pragma solidity ^0.4.24;

interface ApprovalRecipient {
  function receiveApproval(
    address _from,
    uint256 _value,
    address _token,
    bytes _extraData
  ) external;
}
