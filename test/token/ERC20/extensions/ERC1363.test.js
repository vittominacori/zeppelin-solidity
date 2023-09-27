const { BN } = require('@openzeppelin/test-helpers');

const { shouldBehaveLikeERC1363 } = require('./ERC1363.behaviour');

const ERC1363 = artifacts.require('$ERC1363');

contract('ERC1363', function (accounts) {
  const name = 'My Token';
  const symbol = 'MTKN';
  const initialSupply = new BN(100);

  beforeEach(async function () {
    this.token = await ERC1363.new(name, symbol);
  });

  shouldBehaveLikeERC1363(initialSupply, accounts);
});
