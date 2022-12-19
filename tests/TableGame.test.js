// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

function timeout(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

describe("TableGame", function () {
  let _factoryContract;
  let _meso;
  let _table;
  let _owner;
  let _beneficiary;
  let _host;
  let _player1;
  let _player2;
  let _userNonces;
  let _defaultHoursToCloseGame;

  /*
  Helpers for global funcs.
   */
  async function deployTableGameFactoryContract() {
    const contractFactory = await ethers.getContractFactory("TableGameFactory");
    const contract = await contractFactory.deploy(_beneficiary.address);
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
    const nonce = _userNonces.get(playerAddress);
    _userNonces.set(playerAddress, nonce + 1);
    let message = contractAddress.toString().toLowerCase() + playerAddress.toString().toLowerCase() + amount.toString() + action + nonce.toString();
    console.log("Generating Sig for " + message);
    console.log("Hashed message:" + ethers.utils.hashMessage(message));
    return await _owner._signer._legacySignMessage(message);
  }

  async function genSigAmountProfit(contractAddress, playerAddress, amount, profit, action) {
    const nonce = _userNonces.get(playerAddress);
    _userNonces.set(playerAddress, nonce + 1);
    let message = contractAddress.toString().toLowerCase() + playerAddress.toString().toLowerCase() + amount.toString() + profit.toString() + action + nonce.toString();
    console.log("Generating Sig for " + message);
    console.log("Hashed message:" + ethers.utils.hashMessage(message));
    return await _owner._signer._legacySignMessage(message);
  }

  async function reduceSomeonesNonce(someone) {
    _userNonces.set(someone.address, _userNonces.get(someone.address) - 1);
  }

  async function joinTableWithDepositAsPlayer(player, amount) {
    let signature = await genSigAmount(_table.address, player.address, amount, "joinTableWithDeposit");
    return await _table.connect(player).joinTableWithDepositAsPlayer(amount, signature);
  }

  async function joinTableWithDepositAsHost(host, amount) {
    let signature = await genSigAmount(_table.address, host.address, amount, "joinTableWithDeposit");
    return await _table.connect(host).joinTableWithDepositAsHost(amount, signature);
  }

  async function checkOutWithSettlementAsPlayer(player, amount) {
    let signature = await genSigAmount(_table.address, player.address, amount, "checkOutWithSettlement");
    return await _table.connect(player).checkOutWithSettlementAsPlayer(amount, signature);
  }

  async function checkOutWithSettlementAsHost(host, amount, profit) {
    let signature = await genSigAmountProfit(_table.address, host.address, amount, profit, "checkOutWithSettlement");
    return await _table.connect(host).checkOutWithSettlementAsHost(amount, profit, signature);
  }

  async function verifyTableAmount(amount) {
    console.log("Expecting table balance to be " + amount);
    expect((await _table.getAccumulatedBalance()).toNumber()).to.equal(amount);
  }

  async function verifyTokenAmount(someone, amount) {
    console.log("Expecting token balance of " + someone.address + " to be " + amount);
    expect((await _meso.connect(someone).balanceOf(someone.address)).toNumber()).to.equal(amount);
  }

  async function createTableGame(tokenAddress) {
    const game = await _factoryContract.createTableGame(tokenAddress, _defaultHoursToCloseGame);
    const tx = await game.wait();
    console.log("TableGame created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  async function deployFactoryContractUSDTOnETH() {
    const game = await _factoryContract.createTableGameUSDTOnETH(_defaultHoursToCloseGame);
    const tx = await game.wait();
    console.log("TableGame USDTOnETH created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  async function deployFactoryContractUSDCOnGoerli() {
    const game = await _factoryContract.createTableGameUSDCOnGoerli(_defaultHoursToCloseGame);
    const tx = await game.wait();
    console.log("TableGame USDCOnGoerli created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  async function deployFactoryContractUSDTOnBSC() {
    const game = await _factoryContract.createTableGameUSDTOnBSC(_defaultHoursToCloseGame);
    const tx = await game.wait();
    console.log("TableGame USDTOnBSC created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  async function deployFactoryContractUSDTOnBSCTestnet() {
    const game = await _factoryContract.createTableGameUSDTOnBSCTestnet(_defaultHoursToCloseGame);
    const tx = await game.wait();
    console.log("TableGame USDTOnBSCTestnet created at:" + tx.events[0].args[0]);
    return await ethers.getContractAt("TableGame", tx.events[0].args[0]);
  }

  before(async function () {
    const [owner, beneficiary, host, player1, player2] = await ethers.getSigners();
    _owner = owner;
    _beneficiary = beneficiary;
    _host = host;
    _player1 = player1;
    _player2 = player2;
    _userNonces = new Map();
    _defaultHoursToCloseGame = 4;
  });

  /*
    Body of UTs.
   */
  describe("- Deployment", function () {
    beforeEach(async function () {
      _factoryContract = await deployTableGameFactoryContract();
    });

    it("Test: initial value with USDT on ETH address.", async function () {
      _table = await deployFactoryContractUSDTOnETH();
      await verifyTableAmount(0);
    });
    it("Test: initial value with USDC on Goerli address.", async function () {
      _table = await deployFactoryContractUSDCOnGoerli();
      await verifyTableAmount(0);
    });
    it("Test: initial value with USDT on BSC address.", async function () {
      _table = await deployFactoryContractUSDTOnBSC();
      await verifyTableAmount(0);
    });
    it("Test: initial value with USDT on BSC Testnet address.", async function () {
      _table = await deployFactoryContractUSDTOnBSCTestnet();
      await verifyTableAmount(0);
    });
  });

  describe("- Regular In&Out", function () {
    beforeEach(async function () {
      _userNonces.clear();
      _userNonces.set(_host.address, 0);
      _userNonces.set(_player1.address, 0);
      _userNonces.set(_player2.address, 0);
      _factoryContract = await deployTableGameFactoryContract();
      _meso = await deployMesoToken();
      _table = await createTableGame(_meso.address);
      await _meso.transfer(_host.address, 500);
      await _meso.transfer(_player1.address, 500);
      await _meso.transfer(_player2.address, 500);
      await _meso.connect(_host).approve(_table.address, 300);
      await _meso.connect(_player1).approve(_table.address, 200);
      await _meso.connect(_player2).approve(_table.address, 100);
    });

    it("Test: regular join and checkout, the happy path.", async function () {
      await verifyTableAmount(0);
      await joinTableWithDepositAsHost(_host, 100);
      await verifyTableAmount(100);
      await joinTableWithDepositAsPlayer(_player1, 200);
      await verifyTableAmount(300);
      await joinTableWithDepositAsPlayer(_player2, 100);
      await verifyTableAmount(400);
      await checkOutWithSettlementAsPlayer(_player1, 50);
      await verifyTableAmount(350);
      await checkOutWithSettlementAsHost(_host, 150, 50);
      await verifyTokenAmount(_beneficiary, 50);
      await verifyTableAmount(150);
      await expect(
        checkOutWithSettlementAsPlayer(_player2, 150)
      ).to.emit(_table, "TableClosed");
      await reduceSomeonesNonce(_player2);
    });

    it("Test: join table with insufficient allowance.", async function () {
      await verifyTableAmount(0);
      await joinTableWithDepositAsHost(_host, 200);
      await verifyTableAmount(200);
      await expect(
        joinTableWithDepositAsPlayer(_player1, 300)
      ).to.be.revertedWith("ERC20: insufficient allowance");
      await reduceSomeonesNonce(_player1);
      await verifyTableAmount(200);
      await joinTableWithDepositAsPlayer(_player1, 100);
      await verifyTableAmount(300);
      await _meso.connect(_player1).approve(_table.address, 200);
      await joinTableWithDepositAsPlayer(_player1, 100);
      await verifyTableAmount(400);
      await joinTableWithDepositAsPlayer(_player1, 100);
      await verifyTableAmount(500);
      await expect(
        joinTableWithDepositAsPlayer(_player1, 300)
      ).to.be.revertedWith("ERC20: insufficient allowance");
      await reduceSomeonesNonce(_player1);
      await verifyTableAmount(500);
    });

    it("Test: checkout with insufficient remaining or profit.", async function () {
      await verifyTableAmount(0);
      await joinTableWithDepositAsHost(_host, 200);
      await verifyTableAmount(200);
      await joinTableWithDepositAsPlayer(_player1, 100);
      await verifyTableAmount(300);
      await expect(
        checkOutWithSettlementAsPlayer(_player1, 555)
      ).to.be.revertedWith("revert table balance is not suffcient");
      await reduceSomeonesNonce(_player1);
      await verifyTableAmount(300);
      await checkOutWithSettlementAsPlayer(_player1, 200);
      await verifyTableAmount(100);
      await expect(
        checkOutWithSettlementAsPlayer(_player1, 200)
      ).to.be.revertedWith("revert Player: caller is not on table.");
      await verifyTableAmount(100);
      await expect(
        checkOutWithSettlementAsHost(_host, 50, 150)
      ).to.be.revertedWith("revert table balance is not suffcient");
      await reduceSomeonesNonce(_host);
      await expect(
        checkOutWithSettlementAsHost(_host, 50, 50)
      ).to.emit(_table, "TableClosed");
    });

    it("Test: disallow to join table for some reason.", async function () {
      _defaultHoursToCloseGame = 0;
      _table = await createTableGame(_meso.address);
      await _meso.transfer(_host.address, 500);
      await _meso.transfer(_player1.address, 500);
      await _meso.transfer(_player2.address, 500);
      await _meso.connect(_host).approve(_table.address, 300);
      await _meso.connect(_player1).approve(_table.address, 200);
      await _meso.connect(_player2).approve(_table.address, 100);
      await verifyTableAmount(0);
      await expect(
        joinTableWithDepositAsPlayer(_player1, 100)
      ).to.be.revertedWith("revert Game: game is already closed or not opened yet.");
      await reduceSomeonesNonce(_player1);
      await timeout(12);
      await joinTableWithDepositAsHost(_host, 200);
      await verifyTableAmount(200);
      await expect(
        joinTableWithDepositAsHost(_player1, 100)
      ).to.be.revertedWith("revert Host: caller is not the host or a potential host.");
      await reduceSomeonesNonce(_player1);
      await verifyTableAmount(200);
      await joinTableWithDepositAsPlayer(_player1, 100);
      await verifyTableAmount(300);
      await timeout(12);
      await expect(
        joinTableWithDepositAsPlayer(_player1, 200)
      ).to.be.revertedWith("revert Game: game is already closed or not opened yet.");
      await reduceSomeonesNonce(_player1);
      await expect(
        joinTableWithDepositAsPlayer(_player2, 100)
      ).to.be.revertedWith("revert Game: game is already closed or not opened yet.");
      await reduceSomeonesNonce(_player2);
      await checkOutWithSettlementAsPlayer(_player1, 100);
      await expect(
        checkOutWithSettlementAsHost(_host, 50, 50)
      ).to.emit(_table, "TableClosed");
    });
  });
});