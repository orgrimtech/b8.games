// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");
import Web3 from 'web3';

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
    it("test regular three players join and checkout.", async function () {
      const [owner, organizer, player1, player2] = await ethers.getSigners();
		  const mesoTokenFactory = (await ethers.getContractFactory("MesoToken"));
		  mesoToken = await mesoTokenFactory.deploy(ethers.utils.parseEther((1000).toString()));
      const TableGame = await ethers.getContractFactory("TableGame");
      const table = await TableGame.deploy(owner.address);
      await table.deployed();
      console.log('TableGame deployed at:'+ table.address)
      expect((await table.getAccumulatedBalance()).toNumber()).to.equal(0);
      const web3 = new Web3();
      let signature = await web3.eth.personal.sign(
          "" + table.address + organizer.address + "100" + "joinTableWithDeposit", organizer
      );
      await table.connect(organizer.address).joinTableWithDeposit(100, signature);
      signature = await web3.eth.personal.sign(
          "" + table.address + player1.address + "20" + "joinTableWithDeposit", player1
      );
      await table.connect(player1.address).joinTableWithDeposit(20, signature);
      signature = await web3.eth.personal.sign(
          "" + table.address + player2.address + "30" + "joinTableWithDeposit", player2
      );
      await table.connect(player2.address).joinTableWithDeposit(30, signature);
      expect((await table.getAccumulatedBalance()).toNumber()).to.equal(150);
      signature = await web3.eth.personal.sign(
          "" + table.address + player1.address + "15" + "checkOutWithSettlement", player1
      );
      await table.connect(player1.address).checkOutWithSettlement(15, signature);
      signature = await web3.eth.personal.sign(
          "" + table.address + player2.address + "20" + "checkOutWithSettlement", player2
      );
      await table.connect(player2.address).checkOutWithSettlement(20, signature);
      signature = await web3.eth.personal.sign(
          "" + table.address + organizer.address + "110" + "checkOutWithSettlement", organizer
      );
      await table.connect(organizer.address).checkOutWithSettlement(110, signature);
      expect((await mesoToken.balanceOf(owner.address)).toNumber()).to.equal(5);
      expect((await table.getAccumulatedBalance()).toNumber()).to.equal(0);
    });
  });
});