pragma solidity 0.4.24;

import { ERC777Token } from "../ERC777/ERC777Token.sol";

contract ERC865Operator {
  mapping(bytes => bool) private isSignatureUsed;
  ERC777Token tokenContract;

  event TransferPreSigned(address indexed from, address indexed to, address indexed delegate, uint256 amount, uint256 fee);

  constructor(address _tokenAddress) public {
    tokenContract = ERC777Token(_tokenAddress);
  }

  /**
    * @notice Submit a presigned transfer
    * @param _signature bytes The signature, issued by the owner.
    * @param _to address The address which you want to transfer to.
    * @param _value uint256 The amount of tokens to be transferred.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number.
    */
  function transferPreSigned(
    bytes _signature,
    address _to,
    uint256 _value,
    uint256 _fee,
    uint256 _nonce
  )
    external
    returns (bool)
  {
    require(_to != address(0));
    require(isSignatureUsed[_signature] == false);

    // TODO: check nonce?

    bytes32 hashedTx = transferPreSignedHashing(address(tokenContract), _to, _value, _fee, _nonce);

    address from = recover(hashedTx, _signature);
    require(from != address(0));

    // _transfer(from, _to, _value);
    // _transfer(from, msg.sender, _fee);
    tokenContract.operatorSend(from, _to, _value, "", "");
    if (_fee > 0) {
      tokenContract.operatorSend(from, msg.sender, _fee, "", "");
    }

    // isSignatureUsed[_signature] = true;

    // // emit Transfer(from, _to, _value);
    // // emit Transfer(from, msg.sender, _fee);
    emit TransferPreSigned(from, _to, msg.sender, _value, _fee);
    return true;
  }

  /**
    * @notice Hash (keccak256) of the payload used by transferPreSigned
    * @param _token address The address of the token.
    * @param _to address The address which you want to transfer to.
    * @param _value uint256 The amount of tokens to be transferred.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number.
    */
  function transferPreSignedHashing(
    address _token,
    address _to,
    uint256 _value,
    uint256 _fee,
    uint256 _nonce
  )
    public
    pure
    returns (bytes32)
  {
    /* "15420b71": transferPreSignedHashing(address,address,uint256,uint256,uint256) */
    return keccak256(abi.encodePacked(bytes4(0x15420b71), _token, _to, _value, _fee, _nonce));
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
