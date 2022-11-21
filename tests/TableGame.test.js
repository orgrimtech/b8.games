// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TableGame", function () {
  describe("- Deployment", function () {
    it("test initial value with USDT address.", async function () {
      const TableGame = await ethers.getContractFactory("TableGame_USDT_ETH");
      const table = await TableGame.deploy();
      await table.deployed();
      console.log('TableGame deployed at:'+ table.address)
      expect((await table.getAccumulatedBalance()).toNumber()).to.equal(0);
    });
    it("test initial value with USDC address.", async function () {
      const TableGame = await ethers.getContractFactory("TableGame_USDC_ETH");
      const table = await TableGame.deploy();
      await table.deployed();
      console.log('TableGame deployed at:'+ table.address)
      expect((await table.getAccumulatedBalance()).toNumber()).to.equal(0);
    });
    it("test initial value with user input address.", async function () {
      const [owner, organizer] = await ethers.getSigners();
		  const mesoTokenFactory = (await ethers.getContractFactory("MesoToken"));
		  mesoToken = await mesoTokenFactory.deploy(ethers.utils.parseEther((1000).toString()));
      await mesoToken.transfer(organizer.address, 500);
      console.log('organizer balance:'+ await mesoToken.balanceOf(organizer.address));
      const TableGame = await ethers.getContractFactory("TableGame");
      const table = await TableGame.deploy(owner.address);
      await table.deployed();
      console.log('TableGame deployed at:'+ table.address)
      expect((await table.getAccumulatedBalance()).toNumber()).to.equal(0);
    });
  });

  describe("- Regular In&Out", function () {
    it("test regular join and checkout.", async function () {
      const [owner, organizer, player1, player2] = await ethers.getSigners();
		  const mesoTokenFactory = (await ethers.getContractFactory("MesoToken"));
		  mesoToken = await mesoTokenFactory.deploy(ethers.utils.parseEther((1000).toString()));
      const TableGame = await ethers.getContractFactory("TableGame");
      const table = await TableGame.deploy(owner.address);
      await table.deployed();
      console.log('TableGame deployed at:'+ table.address)
      expect((await table.getAccumulatedBalance()).toNumber()).to.equal(0);
      await table.connect(organizer.address).joinTableWithDeposit(20, "dafsd");
    });
  });
});