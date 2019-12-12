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

## gas cost
* transfer to a token holder: 53401 gas
  https://rinkeby.etherscan.io/tx/0xf1cd9f9c2dce220a1aa4c3819857988267a8a93dff0cc0b30a108ecca6e3c44e
* transfer to a not token holder: 67185 gas or 68401
  https://rinkeby.etherscan.io/tx/0x2a01d58f0ddf9ca6218fee82921493c40421664ba22529b733e415d9f4989a4d

* transferPreSigned to a token holder: 92065 gas
  https://rinkeby.etherscan.io/tx/0x63756a4e8e76a7cc5c8389af4d63f70796cf0a43da874c7c3da21840b95495ee
* transferPreSigned to a not token holder: 105933 gas
  https://rinkeby.etherscan.io/tx/0x87e1ca7265630058bcd81961e218dacf493f9875964f665d7456a6df8ba06cce

* DelegatedTransferOperatorWithIncreasingNonce transferPreSigned
  * to a token holder:
    * first time: 91680 gas
      * https://rinkeby.etherscan.io/tx/0xbe22542ce7fb216402e4f55f317a715c1f9a34e0bb3e3000b55d7eb79e97fbcf
    * from 2nd time: 76636 gas (because update usedNonce in contract cost 5000 gas instead of 20000 gas)
      * https://rinkeby.etherscan.io/tx/0xe221cdebf48cadebc11c2b36886ca5a682eded54cb41259fda9198bd53332307

* DelegatedTransferOperatorWithIncreasingNonceWithGasMinimized transferPreSigned
  * to a token holder:
    * first time: 88098 gas
      * https://rinkeby.etherscan.io/tx/0x8940ddf0720466efd6d93e42a8829046dca1d8f521f8948c2d2988a99df8c603
    * from 2nd time: 73098 gas
      * https://rinkeby.etherscan.io/tx/0x9d2e0a5756709ffaba045d252c64391b781a1b2cef5aef8a4ebf509c92e4cd69

* DelegatedTransferOperatorV5 transferPreSigned
  * to a token holder:
    * without fee:
      * first time: 91680 gas
      * from 2nd time: 76596 gas (saves 17% compared to the first version (92065 -> 76596))
    * with fee: 111807
