pragma solidity 0.4.24;


import { ERC777Token } from "../ERC777/ERC777Token.sol";

/// @title DelegatedTransferOperatorWithNonRepeatedSignature
/// @author Roger Wu (Roger-Wu)
/// @dev A DelegatedTransferOperator contract that checks if
///   a _signature has been used to prevent replay attack.
contract DelegatedTransferOperatorWithNonRepeatedSignature {
  mapping(bytes => bool) private isSignatureUsed;
  ERC777Token public tokenContract;

  event TransferPreSigned(
    address indexed from,
    address indexed to,
    address indexed delegate,
    uint256 amount,
    uint256 fee
  );

  constructor(address _tokenAddress) public {
    tokenContract = ERC777Token(_tokenAddress);
  }

  /**
    * @notice Submit a presigned transfer
    * @param _to address The address which you want to transfer to. If _to is address(0), the tx will fail when doSend()
    * @param _delegate address The address which is allowed to send this transaction. If _delegate == address(0), then anyone can be the delegate.
    * @param _value uint256 The amount of tokens to be transferred.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number. _nonce doesn't have to be serial numbers.
    * @param _signature bytes The signature, issued by the owner.
    */
  function transferPreSigned(
    address _to,
    address _delegate,
    uint256 _value,
    uint256 _fee,
    uint256 _nonce,
    bytes _signature
  )
    external
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

    bytes32 _hash = transferPreSignedHashing(
      address(this),
      _to,
      _delegate,
      _value,
      _fee,
      _nonce
    );

    address _signer = recover(_hash, _signature);
    require(
      _signer != address(0),
      "_signature is invalid."
    );

    // TODO: use increasing nonce to reduce the gas cost
    isSignatureUsed[_signature] = true;

    tokenContract.operatorSend(_signer, _to, _value, "", "");
    if (_fee > 0) {
      tokenContract.operatorSend(_signer, msg.sender, _fee, "", "");
    }

    emit TransferPreSigned(_signer, _to, msg.sender, _value, _fee);
  }

  /**
    * @notice Hash (keccak256) of the payload used by transferPreSigned
    * @param _operator address The address of the operator.
    * @param _to address The address which you want to transfer to.
    * @param _delegate address The address of the delegate.
    *   If _delegate == address(0), then anyone can be the delegate.
    * @param _value uint256 The amount of tokens to be transferred.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number.
    */
  function transferPreSignedHashing(
    address _operator,
    address _to,
    address _delegate,
    uint256 _value,
    uint256 _fee,
    uint256 _nonce
  )
    public
    pure
    returns (bytes32)
  {
    return keccak256(
      abi.encodePacked(
        _operator,
        _to,
        _delegate,
        _value,
        _fee,
        _nonce
      )
    );
  }

  function checkSignatureUsed(bytes _signature) public view returns (bool) {
    return isSignatureUsed[_signature];
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
