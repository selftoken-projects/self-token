pragma solidity ^0.4.24;

import { ERC777ERC20BaseToken } from "./ERC777/ERC777ERC20BaseToken.sol";
import { PausableERC777ERC20Token } from "./PausableERC777ERC20Token.sol";
import { ERC777ERC20TokenWithOfficialOperators } from "./ERC777ERC20TokenWithOfficialOperators.sol";
import { ERC777ERC20TokenWithApproveAndCall } from "./ERC777ERC20TokenWithApproveAndCall.sol";
import { CappedMintableERC777ERC20Token } from "./CappedMintableERC777ERC20Token.sol";
import { ERC777ERC20TokenWithBatchTransfer } from "./ERC777ERC20TokenWithBatchTransfer.sol";
import { Claimable } from "openzeppelin-solidity/contracts/ownership/Claimable.sol";


/// @dev The inheritance order is important.
contract SelfToken is ERC777ERC20BaseToken, PausableERC777ERC20Token, ERC777ERC20TokenWithOfficialOperators, ERC777ERC20TokenWithApproveAndCall, CappedMintableERC777ERC20Token, ERC777ERC20TokenWithBatchTransfer, Claimable {
  constructor()
    public
    ERC777ERC20BaseToken("SELF Token", "SELF", 1, new address[](0))
    CappedMintableERC777ERC20Token(1e9 * 1e18)
  {}
}