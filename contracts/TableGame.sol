// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


/**
 * @dev Address library helper to call low level functions.
 *      Copied from: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.8/contracts/utils/Address.sol
 */
library Address {
    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }

    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                // only check isContract if the call was successful and the return data is empty
                // otherwise we already know that it was a contract
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 *      Copied from: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.8/contracts/token/ERC20/IERC20.sol
 */
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

/**
 * @dev SafeERC20 library that keep token transfer in safe mode.
 *      Copied from: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.8/contracts/token/ERC20/utils/SafeERC20.sol
 */
library SafeERC20 {
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        if (returndata.length > 0) {
            // Return data is optional
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}

/**
 * @dev Standard math utilities missing in the Solidity language.
 *      Copied from: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.8/contracts/utils/math/Math.sol
 */
library Math {
    enum Rounding {
        Down, // Toward negative infinity
        Up, // Toward infinity
        Zero // Toward zero
    }

    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10**64) {
                value /= 10**64;
                result += 64;
            }
            if (value >= 10**32) {
                value /= 10**32;
                result += 32;
            }
            if (value >= 10**16) {
                value /= 10**16;
                result += 16;
            }
            if (value >= 10**8) {
                value /= 10**8;
                result += 8;
            }
            if (value >= 10**4) {
                value /= 10**4;
                result += 4;
            }
            if (value >= 10**2) {
                value /= 10**2;
                result += 2;
            }
            if (value >= 10**1) {
                result += 1;
            }
        }
        return result;
    }

    function log10(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log10(value);
            return result + (rounding == Rounding.Up && 10**result < value ? 1 : 0);
        }
    }
}


/**
 * @dev String operations.
 *      Copied from: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.8/contracts/utils/Strings.sol
 */
library Strings {
    bytes16 private constant _SYMBOLS = "0123456789abcdef";
    uint8 private constant _ADDRESS_LENGTH = 20;

    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), _SYMBOLS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
    }
}


/**
 * @dev Elliptic Curve Digital Signature Algorithm (ECDSA) operations.
 *      Copied from: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.8/contracts/utils/cryptography/ECDSA.sol
 *
 * These functions can be used to verify that a message was signed by the holder
 * of the private keys of a given address.
 */
library ECDSA {
    enum RecoverError {
        NoError,
        InvalidSignature,
        InvalidSignatureLength,
        InvalidSignatureS,
        InvalidSignatureV // Deprecated in v4.8
    }

    function _throwError(RecoverError error) private pure {
        if (error == RecoverError.NoError) {
            return; // no error: do nothing
        } else if (error == RecoverError.InvalidSignature) {
            revert("ECDSA: invalid signature");
        } else if (error == RecoverError.InvalidSignatureLength) {
            revert("ECDSA: invalid signature length");
        } else if (error == RecoverError.InvalidSignatureS) {
            revert("ECDSA: invalid signature 's' value");
        }
    }

    function tryRecover(bytes32 hash, bytes memory signature) internal pure returns (address, RecoverError) {
        if (signature.length == 65) {
            bytes32 r;
            bytes32 s;
            uint8 v;
            // ecrecover takes the signature parameters, and the only way to get them
            // currently is to use assembly.
            /// @solidity memory-safe-assembly
            assembly {
                r := mload(add(signature, 0x20))
                s := mload(add(signature, 0x40))
                v := byte(0, mload(add(signature, 0x60)))
            }
            return tryRecover(hash, v, r, s);
        } else {
            return (address(0), RecoverError.InvalidSignatureLength);
        }
    }

    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        (address recovered, RecoverError error) = tryRecover(hash, signature);
        _throwError(error);
        return recovered;
    }

    function tryRecover(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address, RecoverError) {
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return (address(0), RecoverError.InvalidSignatureS);
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) {
            return (address(0), RecoverError.InvalidSignature);
        }

        return (signer, RecoverError.NoError);
    }

    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function toEthSignedMessageHash(bytes memory s) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", Strings.toString(s.length), s));
    }

    function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}


/**
 * @title TableGame
 * @dev For table oriented games.
 * @author sumer
 */
contract TableGame {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    address private _token;
    address private _owner;
    address private _beneficiary;
    address private _host = address(0);
    uint private _timeToCloseGame = 0;
    uint private _hoursToCloseGame = 0;
    uint private _playerTotal = 0;
    uint256 private _tableBalance = 0;
    mapping(address => uint256) private _usersNonces;
    mapping(address => uint256) private _usersDeposits;

    /**
     * @dev Throws if table is already closed.
     */
    modifier onlyGameIsOn() {
        require(_timeToCloseGame > block.timestamp, "Game: game is already closed or not opened yet.");
        _;
    }

    /**
     * @dev Throws if caller is not on table.
     */
    modifier onlyOnTable() {
        require(_usersDeposits[msg.sender] > 0, "Player: caller is not on table.");
        _;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
       require(_owner == msg.sender, "Ownable: caller is not the owner.");
        _;
    }

    /**
     * @dev Throws if called by any account other than the table host or a potential host.
     */
    modifier onlyHost() {
       require(_host == address(0) || _host == msg.sender, "Host: caller is not the host or a potential host.");
        _;
    }

    /**
     * @dev Throws if called by any account other than the potential player.
     */
    modifier onlyPlayer() {
       require(_host != msg.sender, "Player: caller is the host, not a player.");
        _;
    }

    /// @dev Emitted when a user state (joins or checkout) change.
    event NonceChange(string func, address indexed table, address indexed addr, uint256 amount, bytes _signature);

    /// @dev This event is fired when all players checked out and certain amount of money settled to owner.
    event TableClosed(address indexed table, address indexed owner, uint256 amount);

    /**
     * @dev Initializes with a token address and contract owner.
     */
    constructor(address tokenAddress, address owner, address beneficiary, uint hoursToCloseGame) {
        _token = tokenAddress;
        _owner = owner;
        _beneficiary = beneficiary;
        _hoursToCloseGame = hoursToCloseGame;
    }

    /**
     * @dev Someone joins table with some deposit.
     */
    function _joinTableWithDeposit(uint256 _amount, bytes memory _signature) private onlyGameIsOn {
        verifyServerHashAmount(_amount, "joinTableWithDeposit", _signature);
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        if (_usersDeposits[msg.sender] == 0) {
            _playerTotal ++;
        }
        _usersDeposits[msg.sender] += _amount;
        _tableBalance += _amount;
    }

    /**
     * @dev Player joins the table with some deposit.
     */
    function joinTableWithDepositAsPlayer(uint256 _amount, bytes memory _signature) public onlyPlayer {
        _joinTableWithDeposit(_amount, _signature);
        emit NonceChange("joinPlayer", address(this), msg.sender, _amount, _signature);
    }

    /**
     * @dev Host joins the table with some deposit.
     */
    function joinTableWithDepositAsHost(uint256 _amount, bytes memory _signature) public onlyHost {
        _host = msg.sender;
        if (_timeToCloseGame == 0) {
            _timeToCloseGame = block.timestamp + _hoursToCloseGame * 1 hours + 10 seconds;
        }
        _joinTableWithDeposit(_amount, _signature);
        emit NonceChange("joinHost", address(this), msg.sender, _amount, _signature);
    }

    /**
     * @dev Someone checkout with final settlement.
     */
    function _closeTableIfNessary() private {
        if (_playerTotal == 0) { // Table closing nessary.
            uint256 remaining = _tableBalance; // Remaining settlements.
            if (_tableBalance > 0) {
                _tableBalance = 0;
                IERC20(_token).safeTransfer(_beneficiary, remaining);
            }
            emit TableClosed(address(this), _owner, remaining);
            selfdestruct(payable(_beneficiary)); // Destory contract to close table completely.
        }
    }

    /**
     * @dev Someone checkout with final settlement.
     */
    function _checkOutWithSettlement(uint256 _amount) private {
        require(_tableBalance >= _amount, "table balance is not suffcient for settlement.");
        _usersDeposits[msg.sender] = 0;
        _tableBalance -= _amount;
        _playerTotal--;
        IERC20(_token).safeTransfer(msg.sender, _amount);
        _closeTableIfNessary();
    }

    /**
     * @dev Settlement to owner.
     */
    function _checkOutWithSettlementandProfit(uint256 _amount, uint256 _profit) private {
        require(_tableBalance >= _amount + _profit, "table balance is not suffcient for settlement + profit.");
        _usersDeposits[msg.sender] = 0;
        _tableBalance -= _amount + _profit;
        _playerTotal--;
        IERC20(_token).safeTransfer(_beneficiary, _profit);
        IERC20(_token).safeTransfer(msg.sender, _amount);
        _closeTableIfNessary();
    }

    /**
     * @dev Player checkout with final settlement.
     */
    function checkOutWithSettlementAsPlayer(uint256 _amount, bytes memory _signature) public onlyOnTable onlyPlayer {
        verifyServerHashAmount(_amount, "checkOutWithSettlement", _signature);
        _checkOutWithSettlement(_amount);
        emit NonceChange("outPlayer", address(this), msg.sender, _amount, _signature);
    }

    /**
     * @dev Host checkout with final settlement.
     */
    function checkOutWithSettlementAsHost(uint256 _amount, uint _profit, bytes memory _signature) public onlyOnTable onlyHost {
        verifyServerHashAmountProfit(_amount, _profit, "checkOutWithSettlement", _signature);
        _checkOutWithSettlementandProfit(_amount, _profit);
        emit NonceChange("outHost", address(this), msg.sender, _amount, _signature);
    }

    /**
     * @dev Returns the accumulated balance of the contract.
     */
    function getAccumulatedBalance() public view returns(uint256) {
        return _tableBalance;
    }

    /**
     * @dev Returns the balance of the contract.
     */
    function getContractBalance() public view returns(uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    /**
     * @dev Returns if the table has host and some balance.
     */
    function isTableReady() public view returns(bool) {
        return _tableBalance > 0 && _host != address(0);
    }

    /**
     * @dev Generates the message hash for player + amount.
     */
    function _genPlayerAmountHashMessage(uint256 _amount, string memory _action) internal returns (bytes32) {
        uint256 nonce = _usersNonces[msg.sender];
        _usersNonces[msg.sender] = nonce + 1;
        bytes memory encodedMessage = bytes(string(abi.encodePacked(
            Strings.toHexString(address(this)),
            Strings.toHexString(msg.sender),
            Strings.toString(_amount),
            _action,
            Strings.toString(nonce)
        )));
        return ECDSA.toEthSignedMessageHash(encodedMessage);
    }

    /**
     * @dev Generates the message hash for host + amount + profit.
     */
    function _genHostAmountProfitHashMessage(uint256 _amount, uint256 _profit, string memory _action) internal returns (bytes32) {
        uint256 nonce = _usersNonces[msg.sender];
        _usersNonces[msg.sender] = nonce + 1;
        bytes memory encodedMessage = bytes(string(abi.encodePacked(
            Strings.toHexString(address(this)),
            Strings.toHexString(msg.sender),
            Strings.toString(_amount),
            Strings.toString(_profit),
            _action,
            Strings.toString(nonce)
        )));
        return ECDSA.toEthSignedMessageHash(encodedMessage);
    }

    /**
     * @dev Verifies that the server hash is valid with certain amount.
     */
    function verifyServerHashAmount(uint256 _amount, string memory _action, bytes memory _signature) internal {
        bytes32 messageHash = _genPlayerAmountHashMessage(_amount, _action);
        address signer = messageHash.recover(_signature);
        if (signer != _owner) {
            revert("invalid signature from 'server' side with certain amount.");
        }
    }

    /**
     * @dev Verifies that the server hash is valid with certain amount and profit.
     */
    function verifyServerHashAmountProfit(uint256 _amount, uint256 _profit, string memory _action, bytes memory _signature) internal {
        bytes32 messageHash = _genHostAmountProfitHashMessage(_amount, _profit, _action);
        address signer = messageHash.recover(_signature);
        if (signer != _owner) {
            revert("invalid signature from 'server' side with certain amount and profit.");
        }
    }
}


contract TableGameFactory{
    address private _owner;
    address private _beneficiary;

    /// @dev This event is fired when a new game is created.
    event TableGameCreated(address tableAddress, address creatorAddress);

    /**
     * @dev Initializes the factory contract with a input owner or the deployer as owner.
     */
    constructor(address beneficiary) {
        _owner = msg.sender;
        _beneficiary = beneficiary;
    }

    /**
     * @dev Creates a new table game instance with a tokenaddress.
     */
    function createTableGame(address tokenAddress, uint hoursToCloseGame) public returns(address) {
        TableGame game = new TableGame(tokenAddress, _owner, _beneficiary, hoursToCloseGame);
        emit TableGameCreated(address(game), msg.sender);
        return address(game);
    }

    /**
     * @dev Creates a new table game instance with USDT token on ETH.
     */
    function createTableGameUSDTOnETH(uint hoursToCloseGame) public returns(address) {
        address USDT_On_ETH = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
        return createTableGame(USDT_On_ETH, hoursToCloseGame);
    }
  
    /**
     * @dev Creates a new table game instance with USDC token on Goerli.
     */
    function createTableGameUSDCOnGoerli(uint hoursToCloseGame) public returns(address) {
        address USDC_On_Goerli = 0x07865c6E87B9F70255377e024ace6630C1Eaa37F;
        return createTableGame(USDC_On_Goerli, hoursToCloseGame);
    }

    /**
     * @dev Creates a new table game instance with USDT token on BSC.
     */
    function createTableGameUSDTOnBSC(uint hoursToCloseGame) public returns(address) {
        address USDT_On_BSC = 0x55d398326f99059fF775485246999027B3197955;
        return createTableGame(USDT_On_BSC, hoursToCloseGame);
    }

    /**
     * @dev Creates a new table game instance with USDT token on BSC Testnet.
     */
    function createTableGameUSDTOnBSCTestnet(uint hoursToCloseGame) public returns(address) {
        address USDT_On_BSC_Testnet = 0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684;
        return createTableGame(USDT_On_BSC_Testnet, hoursToCloseGame);
    }
}