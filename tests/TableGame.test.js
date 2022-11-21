// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TableGame", function () {
  describe("- Deployment", function () {
    it("test initial value", async function () {
      const TableGame = await ethers.getContractFactory("TableGame");
      const table = await TableGame.deploy();
      await table.deployed();
      console.log('TableGame deployed at:'+ table.address)
      expect((await table.getAccumulatedBalance()).toNumber()).to.equal(0);
    });
  });
});