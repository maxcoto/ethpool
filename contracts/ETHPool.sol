// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "hardhat/console.sol";

contract ETHPool {
  address team;
  uint staked = 0;
  uint St = 0;
  uint precision = 1e8;

  struct Stake {
    uint amount;
    uint S0;
  }

  mapping(address => Stake[]) public stakes;

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
    uint amount = msg.value;

    Stake memory _stake = Stake(amount, St);
    stakes[account].push(_stake);

    staked = staked + amount;
  }

  function withdraw() public {
    address account = payable(msg.sender);
    uint length = stakes[account].length;

    require(length > 0, "nothing to withdraw");

    uint reward = 0;
    uint amount = 0;
    Stake memory _stake;

    for(uint i = 0; i < length; i++){
      _stake = stakes[account][i];

      reward = _stake.amount * (St - _stake.S0) / precision;
      amount = amount + _stake.amount + reward;

      staked = staked - _stake.amount;
      stakes[account][i].amount = 0;
    }

    require(amount > 0, "nothing to withdraw");

    (bool sent, bytes memory _data) = account.call{value: amount}("");
    _data; // unused
    require(sent, "Error: withdrawal has failed.");
  }
}
