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

async function genSigAmount(contractAddress, playerAddress, amount, action) {
  const [owner] = await ethers.getSigners();
  let message = contractAddress.toString().toLowerCase() + playerAddress.toString().toLowerCase() + amount.toString() + action;
  console.log("Generating Sig for " + message);
  console.log("Hashed message:" + ethers.utils.hashMessage(message));
  return await owner._signer._legacySignMessage(message);
}

async function genSigAmountProfit(contractAddress, playerAddress, amount, profit, action) {
  const [owner] = await ethers.getSigners();
  let message = contractAddress.toString().toLowerCase() + playerAddress.toString().toLowerCase() + amount.toString() + profit.toString() + action;
  console.log("Generating Sig for " + message);
  console.log("Hashed message:" + ethers.utils.hashMessage(message));
  return await owner._signer._legacySignMessage(message);
}

async function joinTableWithDepositAsPlayer(tableGame, player, amount) {
  let signature = await genSigAmount(tableGame.address, player.address, amount, "joinTableWithDeposit");
  return await tableGame.connect(player).joinTableWithDepositAsPlayer(amount, signature);
}

async function joinTableWithDepositAsHost(tableGame, host, amount) {
  let signature = await genSigAmount(tableGame.address, host.address, amount, "joinTableWithDeposit");
  return await tableGame.connect(host).joinTableWithDepositAsHost(amount, signature);
}

async function checkOutWithSettlementAsPlayer(tableGame, player, amount) {
  let signature = await genSigAmount(tableGame.address, player.address, amount, "checkOutWithSettlement");
  return await tableGame.connect(player).checkOutWithSettlementAsPlayer(amount, signature);
}

async function checkOutWithSettlementAsHost(tableGame, host, amount, profit) {
  let signature = await genSigAmountProfit(tableGame.address, host.address, amount, profit, "checkOutWithSettlement");
  return await tableGame.connect(host).checkOutWithSettlementAsHost(amount, profit, signature);
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

  async function deployFactoryContractUSDTOnBSC() {
    const game = await factoryContract.createTableGameUSDTOnBSC();
    const tx = await game.wait();
    console.log("TableGame USDTOnBSC created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  async function deployFactoryContractUSDTOnBSCTestnet() {
    const game = await factoryContract.createTableGameUSDTOnBSCTestnet();
    const tx = await game.wait();
    console.log("TableGame USDTOnBSCTestnet created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  before(async function () {
    factoryContract = await deployTableGameFactoryContract();
  });

  describe("- Deployment", function () {
    it("test initial value with USDT on ETH address.", async function () {
      const table = await deployFactoryContractUSDTOnETH();
      await verifyTableAmount(table, 0);
    });
    it("test initial value with USDC on Goerli address.", async function () {
      const table = await deployFactoryContractUSDCOnGoerli();
      await verifyTableAmount(table, 0);
    });
    it("test initial value with USDT on BSC address.", async function () {
      const table = await deployFactoryContractUSDTOnBSC();
      await verifyTableAmount(table, 0);
    });
    it("test initial value with USDT on BSC Testnet address.", async function () {
      const table = await deployFactoryContractUSDTOnBSCTestnet();
      await verifyTableAmount(table, 0);
    });
  });

  describe("- Regular In&Out", function () {
    it("test regular join and checkout, the happy path.", async function () {
      const [owner, host, player1, player2] = await ethers.getSigners();
      const meso = await deployMesoToken();
      await meso.transfer(host.address, 500);
      await meso.transfer(player1.address, 500);
      await meso.transfer(player2.address, 500);
      const table = await createTableGame(meso.address);
      await meso.connect(host).approve(table.address, 300);
      await meso.connect(player1).approve(table.address, 200);
      await meso.connect(player2).approve(table.address, 100);
      await verifyTableAmount(table, 0);
      await joinTableWithDepositAsHost(table, host, 100);
      await verifyTableAmount(table, 100);
      await joinTableWithDepositAsPlayer(table, player1, 200);
      await verifyTableAmount(table, 300);
      await expect(
        joinTableWithDepositAsPlayer(table, player2, 300)
      ).to.be.revertedWith("ERC20: insufficient allowance");
      await verifyTableAmount(table, 300);
      await joinTableWithDepositAsPlayer(table, player2, 100);
      await verifyTableAmount(table, 400);
      await checkOutWithSettlementAsPlayer(table, player1, 50);
      await verifyTableAmount(table, 350);
      await checkOutWithSettlementAsHost(table, host, 150, 50);
      await verifyTableAmount(table, 150);
      await expect(
        checkOutWithSettlementAsPlayer(table, player2, 150)
      ).to.emit(table, "TableClosed")
    });
  });
});