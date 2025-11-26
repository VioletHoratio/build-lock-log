// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title BuildExpenseLedger - Encrypted Construction Expense Ledger
/// @notice Allows users to record encrypted daily expenses (materials, labor, etc.)
/// @dev Uses FHE to store and accumulate encrypted expenses on-chain
contract BuildExpenseLedger is SepoliaConfig {
    // Structure to store expense record metadata (non-encrypted)
    struct ExpenseRecord {
        uint256 timestamp;
        string category; // "materials", "labor", etc.
        bool exists;
    }

    // Mapping from user address to their encrypted monthly total expense
    mapping(address => euint32) private _encryptedMonthlyTotals;
    
    // Mapping from user address to array of expense records
    mapping(address => ExpenseRecord[]) private _expenseRecords;
    
    // Mapping to track if user has initialized their ledger
    mapping(address => bool) private _hasInitialized;

    event ExpenseAdded(address indexed user, uint256 timestamp, string category);
    event MonthlyTotalUpdated(address indexed user, uint256 timestamp);

    /// @notice Add an expense to the ledger
    /// @param encryptedAmount The encrypted expense amount
    /// @param inputProof The FHE input proof
    /// @param category The expense category (e.g., "materials", "labor")
    function addExpense(
        externalEuint32 encryptedAmount,
        bytes calldata inputProof,
        string calldata category
    ) external {
        euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
        
        // Initialize if first time
        if (!_hasInitialized[msg.sender]) {
            _encryptedMonthlyTotals[msg.sender] = amount;
            _hasInitialized[msg.sender] = true;
        } else {
            // Add to existing monthly total
            _encryptedMonthlyTotals[msg.sender] = FHE.add(
                _encryptedMonthlyTotals[msg.sender],
                amount
            );
        }

        // Store expense record metadata
        _expenseRecords[msg.sender].push(ExpenseRecord({
            timestamp: block.timestamp,
            category: category,
            exists: true
        }));

        // Grant decryption permissions to the user
        FHE.allowThis(_encryptedMonthlyTotals[msg.sender]);
        FHE.allow(_encryptedMonthlyTotals[msg.sender], msg.sender);

        emit ExpenseAdded(msg.sender, block.timestamp, category);
        emit MonthlyTotalUpdated(msg.sender, block.timestamp);
    }

    /// @notice Get the encrypted monthly total expense for a user
    /// @param user The user address
    /// @return encryptedTotal The encrypted monthly total expense
    function getEncryptedMonthlyTotal(address user) external view returns (euint32 encryptedTotal) {
        return _encryptedMonthlyTotals[user];
    }

    /// @notice Get the number of expense records for a user
    /// @param user The user address
    /// @return count The number of expense records
    function getExpenseRecordCount(address user) external view returns (uint256 count) {
        return _expenseRecords[user].length;
    }

    /// @notice Get expense record metadata by index
    /// @param user The user address
    /// @param index The record index
    /// @return timestamp The timestamp of the expense
    /// @return category The expense category
    function getExpenseRecord(address user, uint256 index) external view returns (
        uint256 timestamp,
        string memory category
    ) {
        require(index < _expenseRecords[user].length, "Record index out of bounds");
        ExpenseRecord memory record = _expenseRecords[user][index];
        return (record.timestamp, record.category);
    }

    /// @notice Check if a user has initialized their ledger
    /// @param user The user address
    /// @return Whether the user has initialized
    function hasInitialized(address user) external view returns (bool) {
        return _hasInitialized[user];
    }
}

