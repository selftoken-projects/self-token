pragma solidity 0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";
import { Ownable } from "./openzeppelin-solidity/ownership/Ownable.sol";

/// @title Capped Mintable ERC777 ERC20 Token
/// @author Roger-Wu
/// @dev Mintable token with a minting cap.
///  The owner can mint any amount of tokens until the cap is reached.
contract CappedMintableERC777ERC20Token is ERC777ERC20BaseToken, Ownable {
  uint256 internal mTotalSupplyCap;

  constructor(uint256 _totalSupplyCap) public {
    mTotalSupplyCap = _totalSupplyCap;
  }

  /// @return the cap of total supply
  function totalSupplyCap() external view returns(uint _totalSupplyCap) {
    return mTotalSupplyCap;
  }

  /// @dev Generates `_amount` tokens to be assigned to `_tokenHolder`
  ///  Sample mint function to showcase the use of the `Minted` event and the logic to notify the recipient.
  ///  Reference: https://github.com/jacquesd/ERC777/blob/devel/contracts/examples/SelfToken.sol
  /// @param _tokenHolder The address that will be assigned the new tokens
  /// @param _amount The quantity of tokens generated
  /// @param _operatorData Data that will be passed to the recipient as a first transfer
  function mint(address _tokenHolder, uint256 _amount, bytes _operatorData) external onlyOwner {
    requireMultiple(_amount);
    require(mTotalSupply.add(_amount) <= mTotalSupplyCap);

    mTotalSupply = mTotalSupply.add(_amount);
    mBalances[_tokenHolder] = mBalances[_tokenHolder].add(_amount);

    callRecipient(msg.sender, address(0), _tokenHolder, _amount, "", _operatorData, true);

    emit Minted(msg.sender, _tokenHolder, _amount, _operatorData);
    if (mErc20compatible) {
      emit Transfer(0x0, _tokenHolder, _amount);
    }
  }
}
