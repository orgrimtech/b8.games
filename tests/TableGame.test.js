// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Globals:
/*
 Helpers for global funcs.
 */
async function deployContract(contractName) {
  const contract = await ethers.getContractFactory(contractName);
  const c = await contract.deploy();
  await c.deployed();
  console.log("Contract: '" + contractName + "' deployed at:" + c.address);
  return c;
}

async function deployContractWithParam(contractName, param) {
  const contract = await ethers.getContractFactory(contractName);
  const c = await contract.deploy(param);
  await c.deployed();
  console.log("Contract: '" + contractName + "' deployed at:" + c.address);
  return c;
}
async function deployMesoToken() {
  return deployContractWithParam("MesoToken", ethers.utils.parseEther((1000).toString()));
}
async function deployTableGame(address) {
  return deployContractWithParam("TableGame", address);
}
async function genSig(contractAddress, playerAddress, amount, action) {
  const [owner] = await ethers.getSigners();
  console.log("Generating Sig for " + contractAddress.toString().toLowerCase() + playerAddress.toString().toLowerCase() + amount.toString() + action);
  return await owner._signer._legacySignMessage(contractAddress.toString().toLowerCase() + playerAddress.toString().toLowerCase() + amount.toString() + action);
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
  describe("- Deployment", function () {
    it("test initial value with USDT address.", async function () {
      const table = await deployContract("TableGame_USDT_ETH");
      await verifyTableAmount(table, 0);
    });
    it("test initial value with USDC address.", async function () {
      const table = await deployContract("TableGame_USDC_ETH");
      await verifyTableAmount(table, 0);
    });
    it("test initial value with user input address.", async function () {
      const meso = await deployMesoToken();
      const table = await deployTableGame(meso.address);
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
      const table = await deployTableGame(meso.address)
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