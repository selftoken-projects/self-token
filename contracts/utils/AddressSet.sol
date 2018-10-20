pragma solidity ^0.4.21;

/// @author Roger-Wu
/// @dev Stores a set of unique addresses.
library AddressSet {
  struct Data {
    address[] elements;
    mapping(address => bool) flags;
  }

  /// @return `false` if `_value` is already in the set.
  /// @return `true` if `_value` is successfully added into the set.
  function add(Data storage self, address _value)
    public
    returns (bool)
  {
    if (self.flags[_value]) {
      return false;
    }
    self.flags[_value] = true;
    self.elements.push(_value);
    return true;
  }

  /// @return `false` if `_value` is not in the set.
  /// @return `true` if `_value` is successfully removed from the set.
  function remove(Data storage self, address _value)
    public
    returns (bool)
  {
    if (!self.flags[_value]) {
      return false;
    }
    self.flags[_value] = false;

    for (uint i = 0; i < self.elements.length; i++) {
      if (self.elements[i] == _value) {
        if (i != self.elements.length - 1) {
          // copy the last element to this slot
          self.elements[i] = self.elements[self.elements.length - 1];
        }
        self.elements.length--;
        break;
      }
    }

    return true;
  }

  function contains(Data storage self, address _value)
    public
    view
    returns (bool)
  {
    return self.flags[_value];
  }

  function getElements(Data storage self)
    public
    view
    returns (address[])
  {
    return self.elements;
  }
}
