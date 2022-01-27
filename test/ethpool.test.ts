import { expect } from 'chai'
import { ethers } from 'hardhat'
import '@nomiclabs/hardhat-ethers'

import { ETHPool__factory, ETHPool } from '../build/types'

const { getContractFactory, getSigners } = ethers

describe('ETHPool', () => {
  let ethpool: ETHPool
  let sT, sA, sB

  beforeEach(async () => {
    [sT, sA, sB] = await getSigners()
    const ethpoolFactory = (await getContractFactory('ETHPool', sT)) as ETHPool__factory
    ethpool = await ethpoolFactory.deploy()
    await ethpool.deployed()

    expect(ethpool.address).to.properAddress
  })

  describe('stake()', async () => {
    it('should increase the staked amount', async () => {
      await ethpool.connect(sA).stake({ value: 1 });
      const staked = await ethpool.getStaked()
      expect(staked).to.eq(1)
    })
  })
  
  describe('A and B stake before T rewards', async () => {
    it('should distribute correctly', async () => {
      let staked, balance;
  
      await ethpool.connect(sA).stake({ value: 100 })
      await ethpool.connect(sB).stake({ value: 300 })
      staked = await ethpool.getStaked()
      expect(staked).to.eq(400)
  
      await ethpool.connect(sT).addReward({ value: 200 })
      balance = await ethpool.getBalance()
      expect(balance).to.eq(600)
  
      staked = await ethpool.getStaked()
      expect(staked).to.eq(400)
  
      await ethpool.connect(sA).withdraw()
      balance = await ethpool.getBalance()
      expect(balance).to.eq(450)
  
      await ethpool.connect(sB).withdraw()
      balance = await ethpool.getBalance()
      expect(balance).to.eq(0)
    })
  })
  
  describe('B stakes after T rewards', async () => {
    it('should distribute correctly', async () => {
      let staked, balance;
  
      await ethpool.connect(sA).stake({ value: 100 })
      staked = await ethpool.getStaked()
      expect(staked).to.eq(100)
  
      await ethpool.connect(sT).addReward({ value: 200 })
      balance = await ethpool.getBalance()
      expect(balance).to.eq(300)
  
      await ethpool.connect(sB).stake({ value: 300 })
      staked = await ethpool.getStaked()
      expect(staked).to.eq(400)
  
      balance = await ethpool.getBalance()
      expect(balance).to.eq(600)
  
      await ethpool.connect(sA).withdraw()
      balance = await ethpool.getBalance()
      expect(balance).to.eq(300)
  
      await ethpool.connect(sB).withdraw()
      balance = await ethpool.getBalance()
      expect(balance).to.eq(0)
    })
  })
  
  describe('attemps to withdraw without staking', async () => {
    it('should stop the withdrawal', async () => {
      await expect(ethpool.connect(sA).withdraw())
        .to.be.revertedWith('nothing to withdraw');
    })
  })
  
  describe('stakes twice in the same address', async () => {
    it('should stop the staking', async () => {
      await ethpool.connect(sA).stake({ value: 3 });
      await expect(ethpool.connect(sA).stake({ value: 4 }))
        .to.be.revertedWith('only one stake per account at a time is allowed');
    })
  })
  
  describe('adds a reward without permission', async () => {
    it('should reject non-team addresses', async () => {
      await ethpool.connect(sA).stake({ value: 3000 });
      await expect(ethpool.connect(sA).addReward({ value: 300 }))
        .to.be.revertedWith('only the team can add rewards');
    })
  })
  
  describe('adds a reward without stakes', async () => {
    it('should reject the addition', async () => {
      await expect(ethpool.connect(sT).addReward({ value: 300 }))
        .to.be.revertedWith('there must be a staked amount before adding a reward');
    })
  })
})
