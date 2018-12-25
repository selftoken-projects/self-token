# Delegated Transfer Operator

## hash
* hash 中必須包含 _operator 而不能只是 _token，因為將來有可能做出新版的 operator，而 signature 可能被 replay attack。
* 如果 hash 中已經有 _operator 是否還需要 _token？不必要。
* 如果 hash 中已經有 _operator 是否還需要 function hash？不必要。
```solidity
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
```

## recover
* 一定要檢查 recover 回來的 _signer != address(0)，否則會使得任何人都可以把 address(0) 的 token 轉出來。

## isSignatureUsed
* 可以先把 signature hash 後再放進 isSignatureUsed，可使得 key 的長度固定為 bytes32。或許 solidity 已經內建做了這件事？
