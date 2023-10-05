const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const accounts = await ethers.getSigners();
  const owner = accounts.shift();
  const accountA = accounts.shift();
  const accountB = accounts.shift();
  const ownable2Step = await ethers.deployContract('$Ownable2Step', [owner.address]);
  return { accounts, owner, accountA, accountB, ownable2Step };
}

describe('Ownable2Step', function () {
  beforeEach(async function () {
    await loadFixture(fixture).then(results => Object.assign(this, results));
  });

  describe('transfer ownership', function () {
    it('starting a transfer does not change owner', async function () {
      await expect(this.ownable2Step.connect(this.owner).transferOwnership(this.accountA.address))
        .to.emit(this.ownable2Step, 'OwnershipTransferStarted')
        .withArgs(this.owner.address, this.accountA.address);

      expect(await this.ownable2Step.owner()).to.equal(this.owner.address);
      expect(await this.ownable2Step.pendingOwner()).to.equal(this.accountA.address);
    });

    it('changes owner after transfer', async function () {
      await this.ownable2Step.connect(this.owner).transferOwnership(this.accountA.address);

      await expect(this.ownable2Step.connect(this.accountA).acceptOwnership())
        .to.emit(this.ownable2Step, 'OwnershipTransferred')
        .withArgs(this.owner.address, this.accountA.address);

      expect(await this.ownable2Step.owner()).to.equal(this.accountA.address);
      expect(await this.ownable2Step.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it('guards transfer against invalid user', async function () {
      await this.ownable2Step.connect(this.owner).transferOwnership(this.accountA.address);

      await expect(this.ownable2Step.connect(this.accountB).acceptOwnership())
        .to.be.revertedWithCustomError(this.ownable2Step, 'OwnableUnauthorizedAccount')
        .withArgs(this.accountB.address);
    });
  });

  describe('renouncing ownership', async function () {
    it('changes owner after renouncing ownership', async function () {
      await expect(this.ownable2Step.connect(this.owner).renounceOwnership())
        .to.emit(this.ownable2Step, 'OwnershipTransferred')
        .withArgs(this.owner.address, ethers.ZeroAddress);

      // If renounceOwnership is removed from parent an alternative is needed ...
      // without it is difficult to cleanly renounce with the two step process
      // see: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3620#discussion_r957930388
      expect(await this.ownable2Step.owner()).to.equal(ethers.ZeroAddress);
    });

    it('pending owner resets after renouncing ownership', async function () {
      await this.ownable2Step.connect(this.owner).transferOwnership(this.accountA.address);
      expect(await this.ownable2Step.pendingOwner()).to.equal(this.accountA.address);

      await this.ownable2Step.connect(this.owner).renounceOwnership();
      expect(await this.ownable2Step.pendingOwner()).to.equal(ethers.ZeroAddress);

      await expect(this.ownable2Step.connect(this.accountA).acceptOwnership())
        .to.be.revertedWithCustomError(this.ownable2Step, 'OwnableUnauthorizedAccount')
        .withArgs(this.accountA.address);
    });

    it('allows to recover access using the internal _transferOwnership', async function () {
      await this.ownable2Step.connect(this.owner).renounceOwnership();

      await expect(this.ownable2Step.$_transferOwnership(this.accountA.address))
        .to.emit(this.ownable2Step, 'OwnershipTransferred')
        .withArgs(ethers.ZeroAddress, this.accountA.address);

      expect(await this.ownable2Step.owner()).to.equal(this.accountA.address);
    });
  });
});
