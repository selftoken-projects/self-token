pragma solidity 0.4.24;

import { ERC777Token } from "../ERC777/ERC777Token.sol";

contract DelegatedTransferOperator {
  mapping(bytes => bool) private isSignatureUsed;
  ERC777Token tokenContract;

  event TransferPreSigned(address indexed from, address indexed to, address indexed delegate, uint256 amount, uint256 fee);

  constructor(address _tokenAddress) public {
    tokenContract = ERC777Token(_tokenAddress);
  }

  /**
    * @notice Submit a presigned transfer
    * @param _from address The address of the token holder.
    * @param _to address The address which you want to transfer to.
    * @param _delegate address The address which is allowed to send this transaction. If _delegate == address(0), then anyone can be the delegate.
    * @param _value uint256 The amount of tokens to be transferred.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number. _nonce doesn't have to be serial numbers.
    * @param _signature bytes The signature, issued by the owner.
    */
  function transferPreSigned(
    address _from,
    address _to,
    address _delegate,
    uint256 _value,
    uint256 _fee,
    uint256 _nonce,
    bytes _signature
  )
    external
    returns (bool)
  {
    // A _signature can not be used again.
    require(
      isSignatureUsed[_signature] == false,
      "The _signature has been used."
    );

    // address _delegate should be address(0) or msg.sender.
    require(
      _delegate == address(0) || _delegate == msg.sender,
      "address _delegate should be address(0) or msg.sender"
    );

    // address _to should not be address(0)
    require(
      _to != address(0),
      "address _to should not be address(0)"
    );

    // TODO: check nonce is never used?

    bytes32 delegationHash = keccak256(abi.encodePacked(
      address(tokenContract),
      _from,
      _to,
      _delegate,
      _value,
      _fee,
      _nonce
    ));

    address _signer = recover(delegationHash, _signature);
    require(
      _signer == _from,
      "The delegation signer should be the token holder."
    );

    isSignatureUsed[_signature] = true;

    tokenContract.operatorSend(_from, _to, _value, "", "");
    if (_fee > 0) {
      tokenContract.operatorSend(_from, msg.sender, _fee, "", "");
    }

    emit TransferPreSigned(_from, _to, msg.sender, _value, _fee);
    return true;
  }

  /**
    * @notice Recover signer address from a message by using his signature
    * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
    * @param sig bytes signature, the signature is generated using web3.eth.sign()
    */
  function recover(bytes32 hash, bytes sig) public pure returns (address) {
    bytes32 r;
    bytes32 s;
    uint8 v;

    // Check the signature length
    if (sig.length != 65) {
      return (address(0));
    }

    // Divide the signature in r, s and v variables
    // ecrecover takes the signature parameters, and the only way to get them
    // currently is to use assembly.
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      r := mload(add(sig, 0x20))
      s := mload(add(sig, 0x40))
      v := byte(0, mload(add(sig, 0x60)))
    }

    // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
    if (v < 27) {
      v += 27;
    }

    // If the version is correct return the signer address
    if (v != 27 && v != 28) {
      return (address(0));
    } else {
      return ecrecover(hash, v, r, s);
    }
  }
}
