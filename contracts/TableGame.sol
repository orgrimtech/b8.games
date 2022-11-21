// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


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
    using ECDSA for bytes32;
    address private _owner;
    address private constant USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955;
    address private constant USDC_ADDRESS=0x07865c6E87B9F70255377e024ace6630C1Eaa37F;
    address private constant TOKEN = USDC_ADDRESS;
    uint playerTotal = 0;
    uint256 tableBalance = 0;
    mapping(address => uint) private usersDeposits;

    /**
     * @dev Throws if caller is not on table.
     */
    modifier onlyOnTable() {
        require(usersDeposits[msg.sender] > 0, "not on table.");
        _;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
       require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    /// @dev This event is fired when a player joined table with certain amount of money.
    event PlayerJoined(address indexed player, uint256 amount);

    /// @dev This event is fired when a player checked out and settled with certain amount of money.
    event PlayerCheckedOut(address indexed player, uint256 amount);

    /// @dev This event is fired when all players checked out and certain amount of money settled to owner.
    event TableClosed(address indexed table, address indexed owner, uint256 amount);

    /// @dev This event is fired when there is a failure of validation for server hash.
    event ServerHashValidationFailure(
        address indexed table,
        address indexed player,
        uint256 amount,
        string action,
        bytes serverHash
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _owner = msg.sender;
    }

    /**
     * @dev Player join table with some deposit.
     */
    function joinTableWithDeposit(uint256 _amount, bytes memory _signature) public {
        verifyServerHash(_amount, "joinTableWithDeposit", _signature);
        IERC20(TOKEN).transferFrom(msg.sender, address(this), _amount);
        if (usersDeposits[msg.sender] == 0) {
            playerTotal ++;
        }
        usersDeposits[msg.sender] += _amount;
        tableBalance += _amount;
        emit PlayerJoined(msg.sender, _amount);
    }

    /**
     * @dev Player checkout with final settlement.
     */
    function checkOutWithSettlement(uint256 _amount, bytes memory _signature) public onlyOnTable {
        verifyServerHash(_amount, "checkOutWithSettlement", _signature);
        require(tableBalance >= _amount, "table balance is not suffcient.");
        usersDeposits[msg.sender] = 0;
        tableBalance -= _amount;
        playerTotal --;
        IERC20(TOKEN).transfer(msg.sender, _amount);
        emit PlayerCheckedOut(msg.sender, _amount);
        if (tableBalance > 0 && playerTotal == 0) {
            uint256 toTransfer = tableBalance;
            tableBalance = 0;
            IERC20(TOKEN).transfer(_owner, toTransfer);
            selfdestruct(payable(_owner));
            emit TableClosed(address(this), _owner, toTransfer);
        }
    }

    /**
     * @dev Return the accumulated balance of the contract.
     */
    function getAccumulatedBalance() public onlyOwner view returns(uint256) {
        return tableBalance;
    }

    /**
     * @dev Return the balance of the contract.
     */
    function getContractBalance() public onlyOwner view returns(uint256) {
        return IERC20(TOKEN).balanceOf(address(this));
    }

    /**
     * @dev Verify that the server hash is valid.
     */
    function verifyServerHash(uint _amount, string memory _action, bytes memory _signature) internal {
        // Validates the hash data was actually signed from 'server' side.
        bytes32 hash = keccak256(
            abi.encodePacked(
                address(this),
                msg.sender,
                _amount,
                _action
            )
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        address signer = messageHash.recover(_signature);
        if (signer != _owner) {
            emit ServerHashValidationFailure(
                address(this),
                msg.sender,
                _amount,
                _action,
                _signature
            );
            revert("invalid signature from 'server' side.");
        }
    }
}