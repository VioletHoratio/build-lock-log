# BuildLedger - Encrypted Construction Expense Ledger

A fully homomorphic encryption (FHE) enabled application for tracking construction expenses privately on-chain. Built with FHEVM by Zama, this MVP allows construction companies to record daily expenses (materials, labor, equipment, etc.) with encrypted amounts while maintaining privacy.

## Features

- **FHE Encryption**: All expense amounts are encrypted using FHE before being stored on-chain
- **Monthly Total Calculation**: Chain-side computation of encrypted monthly totals
- **Privacy-Preserving**: Expense amounts remain encrypted, only the owner can decrypt
- **RainbowKit Integration**: Easy wallet connection with RainbowKit
- **Modern UI**: Built with React, TypeScript, and shadcn-ui

## Project Structure

```
build-lock-log/
├── contracts/                    # Smart contract source files
│   └── BuildExpenseLedger.sol   # Main FHE expense ledger contract
├── deploy/                       # Deployment scripts
├── test/                         # Test files
│   ├── BuildExpenseLedger.ts    # Local network tests
│   └── BuildExpenseLedgerSepolia.ts  # Sepolia testnet tests
├── ui/                           # Frontend React application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/                # Custom hooks (useExpenseLedger)
│   │   ├── fhevm/                # FHEVM integration
│   │   └── pages/                # Page components
│   └── package.json
└── hardhat.config.ts             # Hardhat configuration
```

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager
- **Hardhat Node**: For local development with FHEVM support

## Installation

### 1. Install Backend Dependencies

```bash
npm install
```

### 2. Install Frontend Dependencies

```bash
cd ui
npm install
cd ..
```

### 3. Set up Environment Variables

```bash
# Set Hardhat variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY  # Optional

# Create frontend .env.local file
cd ui
echo "VITE_CONTRACT_ADDRESS=" > .env.local
echo "VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID" >> .env.local
cd ..
```

## Development

### 1. Start Local Hardhat Node (with FHEVM support)

In one terminal:

```bash
npx hardhat node
```

### 2. Deploy Contract to Local Network

In another terminal:

```bash
npx hardhat deploy --network localhost
```

Copy the deployed contract address and add it to `ui/.env.local`:

```
VITE_CONTRACT_ADDRESS=0x...
```

### 3. Start Frontend Development Server

```bash
cd ui
npm run dev
```

### 4. Test the Contract

```bash
# Run local tests
npm run test

# Run Sepolia tests (after deployment)
npm run test:sepolia
```

## Usage

1. **Connect Wallet**: Click the "Connect Wallet" button in the top right and connect using RainbowKit
2. **Add Expense**: Click "Add Expense" button, enter amount and select category (materials, labor, equipment, etc.)
3. **View Encrypted Total**: The monthly total is displayed as encrypted data
4. **Decrypt Total**: Click "Decrypt" to view the actual monthly total (only you can decrypt)
5. **View Records**: See all your expense records with timestamps and categories

## Contract Functions

### `addExpense(encryptedAmount, inputProof, category)`
- Adds an encrypted expense to the ledger
- Automatically accumulates to monthly total
- Stores expense record metadata (timestamp, category)

### `getEncryptedMonthlyTotal(user)`
- Returns the encrypted monthly total for a user
- Can be decrypted by the user using FHEVM

### `getExpenseRecordCount(user)`
- Returns the number of expense records for a user

### `getExpenseRecord(user, index)`
- Returns expense record metadata (timestamp, category) by index

## Testing

### Local Network Tests

```bash
npm run test
```

Tests include:
- Initialization check
- Adding single expense
- Adding multiple expenses and accumulation
- Multi-user ledger separation

### Sepolia Testnet Tests

```bash
# First deploy to Sepolia
npx hardhat deploy --network sepolia

# Then run tests
npm run test:sepolia
```

## Deployment

### Deploy to Sepolia Testnet

```bash
npx hardhat deploy --network sepolia
```

### Verify Contract

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Frontend Configuration

The frontend requires:
- `VITE_CONTRACT_ADDRESS`: The deployed contract address
- `VITE_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID (optional, for WalletConnect support)

## Available Scripts

### Backend

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

### Frontend

| Script        | Description                    |
| ------------- | ------------------------------ |
| `npm run dev` | Start development server        |
| `npm run build` | Build for production          |
| `npm run preview` | Preview production build      |

## Technology Stack

- **Smart Contracts**: Solidity 0.8.27, FHEVM
- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn-ui, Tailwind CSS
- **Wallet**: RainbowKit, wagmi, viem
- **Encryption**: FHEVM by Zama

## Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)

## License

This project is licensed under the BSD-3-Clause-Clear License.

---

**Built with ❤️ using FHEVM by Zama**
