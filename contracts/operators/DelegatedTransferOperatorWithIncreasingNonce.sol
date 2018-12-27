pragma solidity 0.4.24;


import { ERC777Token } from "../ERC777/ERC777Token.sol";

/// @title DelegatedTransferOperatorWithIncreasingNonce
/// @author Roger Wu (Roger-Wu)
/// @dev A DelegatedTransferOperator contract that checks if a _nonce
///   has been used by a token holder to prevent replay attack.
///   It cost less gas to store used nonces than to store used signature
///   because it SSTORE the new nonce in the same slot.
contract DelegatedTransferOperatorWithIncreasingNonce {
  mapping(address => uint256) public usedNonce;
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
    * @param _to address The address which you want to transfer to.
    * @param _delegate address The address which is allowed to send this transaction.
    * @param _value uint256 The amount of tokens to be transferred.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number.
    * @param _signature bytes The signature, issued by the owner.
    * @notice some rules:
    * 1. If _to is address(0), the tx will fail when doSend().
    * 2. If _delegate == address(0), then anyone can be the delegate.
    * 3. _nonce must be greater than the last used nonce by the token holder,
    *    but nonces don't have to be serial numbers.
    *    We recommend using unix time as nonce.
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
    require(
      _delegate == address(0) || _delegate == msg.sender,
      "_delegate should be address(0) or msg.sender"
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

    require(
      _nonce > usedNonce[_signer],
      "_nonce must be greater than the last used nonce of the token holder."
    );

    usedNonce[_signer] = _nonce;

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
    return keccak256(abi.encodePacked(
      _operator,
      _to,
      _delegate,
      _value,
      _fee,
      _nonce
    ));
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
