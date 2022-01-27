// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "hardhat/console.sol";

contract ETHPool {
  address team;
  uint staked = 0;
  uint St = 0;
  uint precision = 1e8;

  mapping(address => uint) public stakes;
  mapping(address => uint) public S0;

  constructor() {
    team = msg.sender;
  }

  function getBalance() public view returns (uint) {
    return address(this).balance;
  }
  
  function getStaked() public view returns (uint) {
    return staked;
  }

  function addReward() public payable {
    require( staked > 0, "there must be a staked amount before adding a reward" );
    require(msg.sender == team, "only the team can add rewards");

    uint reward = msg.value * precision;  
    St = St + reward / staked;
  }
  
  function stake() public payable {
    address account = msg.sender;
    require(stakes[account] == 0, "only one stake per account at a time is allowed");

    uint amount = msg.value;
    stakes[account] = amount;
    S0[account] = St;
    staked = staked + amount;
  }

  function withdraw() public {
    address account = payable(msg.sender);
    uint deposited = stakes[account];
    require(deposited > 0, "nothing to withdraw");

    uint reward = deposited * (St - S0[account]) / precision;
    uint amount = deposited + reward;

    staked = staked - deposited;
    stakes[account] = 0;

    (bool sent, bytes memory _data) = account.call{value: amount}("");
    _data; // unused
    require(sent, "Error: withdrawal has failed.");
  }
}
