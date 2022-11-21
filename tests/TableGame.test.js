// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Globals:
/*
 Helpers for global funcs.
 */
async function deployTableGameFactoryContract() {
  const contractFactory = await ethers.getContractFactory("TableGameFactory");
  const contract = await contractFactory.deploy();
  await contract.deployed();
  console.log("Contract: 'TableGameFactory' deployed at:" + contract.address);
  return contract;
}

async function deployMesoToken() {
  const mesoContract = await ethers.getContractFactory("MesoToken");
  const contract = await mesoContract.deploy(ethers.utils.parseEther((1000).toString()));
  await contract.deployed();
  console.log("Contract: 'MesoToken' deployed at:" + contract.address);
  return contract;
}

async function genSig(contractAddress, playerAddress, amount, action) {
  const [owner] = await ethers.getSigners();
  let message = contractAddress.toString().toLowerCase() + playerAddress.toString().toLowerCase() + amount.toString() + action;
  console.log("Generating Sig for " + message);
  console.log("Hashed message:" + ethers.utils.hashMessage(message));
  return await owner._signer._legacySignMessage(message);
}

async function joinTableWithDeposit(tableGame, player, amount) {
  let signature = await genSig(tableGame.address, player.address, amount, "joinTableWithDeposit");
  return await tableGame.connect(player).joinTableWithDeposit(amount, signature);
}

async function checkOutWithSettlement(tableGame, player, amount) {
  let signature = await genSig(tableGame.address, player.address, amount, "checkOutWithSettlement");
  return await tableGame.connect(player).checkOutWithSettlement(amount, signature);
}

async function verifyTableAmount(tableGame, amount) {
  console.log("Expecting table balance to be " + amount);
  expect((await tableGame.getAccumulatedBalance()).toNumber()).to.equal(amount);
}


/*
 Body of UTs.
 */
describe("TableGame", function () {
  let factoryContract;

  async function createTableGame(tokenAddress) {
    const game = await factoryContract.createTableGame(tokenAddress);
    const tx = await game.wait();
    console.log("TableGame created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  async function deployFactoryContractUSDTOnETH() {
    const game = await factoryContract.createTableGameUSDTOnETH();
    const tx = await game.wait();
    console.log("TableGame USDTOnETH created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  async function deployFactoryContractUSDCOnGoerli() {
    const game = await factoryContract.createTableGameUSDCOnGoerli();
    const tx = await game.wait();
    console.log("TableGame USDCOnGoerli created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  before(async function () {
    factoryContract = await deployTableGameFactoryContract();
  });

  describe("- Deployment", function () {
    it("test initial value with USDT address.", async function () {
      const table = await deployFactoryContractUSDTOnETH();
      await verifyTableAmount(table, 0);
    });
    it("test initial value with USDC address.", async function () {
      const table = await deployFactoryContractUSDCOnGoerli();
      await verifyTableAmount(table, 0);
    });
  });

  describe("- Regular In&Out", function () {
    it("test regular join and checkout.", async function () {
      const [owner, organizer, player1, player2] = await ethers.getSigners();
      const meso = await deployMesoToken();
      await meso.transfer(organizer.address, 500);
      await meso.transfer(player1.address, 500);
      await meso.transfer(player2.address, 500);
      const table = await createTableGame(meso.address);
      await meso.connect(organizer).approve(table.address, 300);
      await meso.connect(player1).approve(table.address, 200);
      await meso.connect(player2).approve(table.address, 100);
      await verifyTableAmount(table, 0);
      await joinTableWithDeposit(table, organizer, 100);
      await verifyTableAmount(table, 100);
      await joinTableWithDeposit(table, player1, 200);
      await verifyTableAmount(table, 300);
      await expect(
        joinTableWithDeposit(table, player2, 300)
      ).to.be.revertedWith("ERC20: insufficient allowance");
      await checkOutWithSettlement(table, player1, 250);
      await verifyTableAmount(table, 50);
    });
  });
});