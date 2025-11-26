import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "./useInMemoryStorage";

// Contract ABI
const BuildExpenseLedgerABI = [
  "function addExpense(bytes32 encryptedAmount, bytes calldata inputProof, string calldata category) external",
  "function getEncryptedMonthlyTotal(address user) external view returns (bytes32)",
  "function hasInitialized(address user) external view returns (bool)",
  "function getExpenseRecordCount(address user) external view returns (uint256)",
  "function getExpenseRecord(address user, uint256 index) external view returns (uint256 timestamp, string memory category)",
  "event ExpenseAdded(address indexed user, uint256 timestamp, string category)",
  "event MonthlyTotalUpdated(address indexed user, uint256 timestamp)",
];

export interface ExpenseRecord {
  timestamp: number;
  category: string;
  index: number;
}

interface UseExpenseLedgerState {
  contractAddress: string | undefined;
  encryptedTotal: string | undefined;
  decryptedTotal: number | undefined;
  expenseRecords: ExpenseRecord[];
  isLoading: boolean;
  message: string | undefined;
  addExpense: (amount: number, category: string) => Promise<void>;
  decryptTotal: () => Promise<void>;
  loadEncryptedTotal: () => Promise<void>;
  loadExpenseRecords: () => Promise<void>;
}

export function useExpenseLedger(contractAddress: string | undefined): UseExpenseLedgerState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  const [encryptedTotal, setEncryptedTotal] = useState<string | undefined>(undefined);
  const [decryptedTotal, setDecryptedTotal] = useState<number | undefined>(undefined);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);

  // Get EIP1193 provider
  const eip1193Provider = useCallback(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // Initialize FHEVM
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider(),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!contractAddress,
  });

  // Convert walletClient to ethers signer
  useEffect(() => {
    if (!walletClient || !chainId) {
      setEthersSigner(undefined);
      setEthersProvider(undefined);
      return;
    }

    const setupEthers = async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        setEthersProvider(provider as any);
        setEthersSigner(signer);
      } catch (error) {
        console.error("Error setting up ethers:", error);
        setEthersSigner(undefined);
        setEthersProvider(undefined);
      }
    };

    setupEthers();
  }, [walletClient, chainId]);

  const addExpense = useCallback(
    async (amount: number, category: string) => {
      console.log("[useExpenseLedger] addExpense called", {
        amount,
        category,
        contractAddress,
        hasEthersSigner: !!ethersSigner,
        hasFhevmInstance: !!fhevmInstance,
        address,
        hasEthersProvider: !!ethersProvider,
      });

      if (!contractAddress) {
        const error = new Error("Contract address not configured. Please set VITE_CONTRACT_ADDRESS in .env.local");
        setMessage(error.message);
        console.error("[useExpenseLedger] Missing contract address");
        throw error;
      }

      if (!ethersSigner) {
        const error = new Error("Wallet signer not available. Please ensure your wallet is connected.");
        setMessage(error.message);
        console.error("[useExpenseLedger] Missing ethers signer");
        throw error;
      }

      if (!fhevmInstance) {
        const error = new Error("FHEVM instance not initialized. Please wait for initialization.");
        setMessage(error.message);
        console.error("[useExpenseLedger] Missing FHEVM instance");
        throw error;
      }

      if (!address) {
        const error = new Error("Wallet address not available. Please connect your wallet.");
        setMessage(error.message);
        console.error("[useExpenseLedger] Missing address");
        throw error;
      }

      if (!ethersProvider) {
        const error = new Error("Ethers provider not available.");
        setMessage(error.message);
        console.error("[useExpenseLedger] Missing ethers provider");
        throw error;
      }

      if (amount <= 0) {
        const error = new Error("Expense amount must be greater than 0");
        setMessage(error.message);
        throw error;
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting expense amount...");
        console.log("[useExpenseLedger] Starting encryption...");

        // Encrypt amount using FHEVM
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedInput.add32(amount);
        const encrypted = await encryptedInput.encrypt();
        console.log("[useExpenseLedger] Encryption complete", {
          hasHandles: !!encrypted.handles && encrypted.handles.length > 0,
          hasInputProof: !!encrypted.inputProof && encrypted.inputProof.length > 0,
        });

        setMessage("Submitting to blockchain...");

        // Verify contract is deployed
        const contractCode = await ethersProvider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode.length <= 2) {
          throw new Error(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        }

        const contract = new ethers.Contract(contractAddress, BuildExpenseLedgerABI, ethersSigner);

        const encryptedAmountHandle = encrypted.handles[0];
        if (!encryptedAmountHandle || !encrypted.inputProof || encrypted.inputProof.length === 0) {
          throw new Error("Encryption failed - missing handle or proof");
        }

        console.log("[useExpenseLedger] Submitting transaction...");
        const tx = await contract.addExpense(
          encryptedAmountHandle,
          encrypted.inputProof,
          category,
          {
            gasLimit: 5000000,
          }
        );
        console.log("[useExpenseLedger] Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("[useExpenseLedger] Transaction confirmed, block:", receipt.blockNumber);

        setMessage("Expense added successfully. Refreshing data...");
        
        // Wait a bit for the state to be fully updated and permissions to be set
        console.log("[useExpenseLedger] Waiting for state update and permissions...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reload encrypted total and records after successful addition
        if (contractAddress && ethersProvider && address) {
          try {
            const contractCode = await ethersProvider.getCode(contractAddress);
            if (contractCode && contractCode.length > 2) {
              const contract = new ethers.Contract(contractAddress, BuildExpenseLedgerABI, ethersProvider);
              const hasInit = await contract.hasInitialized(address);
              if (hasInit) {
                const encrypted = await contract.getEncryptedMonthlyTotal(address);
                const handle = typeof encrypted === "string" ? encrypted : ethers.hexlify(encrypted);
                const normalizedHandle = handle.toLowerCase();
                console.log("[useExpenseLedger] New encrypted total handle:", normalizedHandle);
                setEncryptedTotal(normalizedHandle);
                
                // Reload expense records
                await loadExpenseRecords();
                
                setMessage("Expense added successfully! Wait a moment, then you can decrypt your total.");
              } else {
                console.warn("[useExpenseLedger] User not initialized after adding expense");
                setMessage("Expense added, but initialization check failed. Please try refreshing.");
              }
            }
          } catch (err) {
            console.error("[useExpenseLedger] Error reloading data:", err);
            setMessage("Expense added, but failed to refresh data. Please refresh manually.");
          }
        }
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useExpenseLedger] Error adding expense:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const decryptTotal = useCallback(
    async () => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for decryption");
        return;
      }

      try {
        setMessage("Checking permissions and fetching latest encrypted total...");

        const contract = new ethers.Contract(contractAddress, BuildExpenseLedgerABI, ethersProvider);
        const hasInit = await contract.hasInitialized(address);
        
        if (!hasInit) {
          throw new Error("You haven't added any expenses yet. Please add expenses first before decrypting.");
        }

        const latestEncryptedTotal = await contract.getEncryptedMonthlyTotal(address);
        let handle = typeof latestEncryptedTotal === "string" ? latestEncryptedTotal : ethers.hexlify(latestEncryptedTotal);

        if (handle && handle.startsWith("0x")) {
          handle = handle.toLowerCase();
        }

        if (!handle || handle === "0x" || handle.length !== 66) {
          throw new Error(`Invalid handle format: ${handle}. Expected 66 characters (0x + 64 hex chars)`);
        }

        console.log("[useExpenseLedger] ===== Decryption Debug Info =====");
        console.log("[useExpenseLedger] Handle from contract:", handle);
        console.log("[useExpenseLedger] Contract address:", contractAddress);
        console.log("[useExpenseLedger] User address:", address);

        setEncryptedTotal(handle);
        setMessage("Decrypting monthly total...");

        const handleContractPairs = [
          { handle, contractAddress: contractAddress as `0x${string}` },
        ];

        let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
        } else {
          keypair = {
            publicKey: new Uint8Array(32).fill(0),
            privateKey: new Uint8Array(32).fill(0),
          };
        }

        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
        } else {
          eip712 = {
            domain: {
              name: "FHEVM",
              version: "1",
              chainId: chainId,
              verifyingContract: contractAddresses[0],
            },
            types: {
              UserDecryptRequestVerification: [
                { name: "publicKey", type: "bytes" },
                { name: "contractAddresses", type: "address[]" },
                { name: "startTimestamp", type: "string" },
                { name: "durationDays", type: "string" },
              ],
            },
            message: {
              publicKey: ethers.hexlify(keypair.publicKey),
              contractAddresses,
              startTimestamp,
              durationDays,
            },
          };
        }

        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        const signatureForDecrypt = chainId === 31337 
          ? signature.replace("0x", "") 
          : signature;

        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        const decrypted = Number(decryptedResult[handle] || 0);
        console.log("[useExpenseLedger] Decryption successful:", decrypted);
        setDecryptedTotal(decrypted);
        setMessage(`Decrypted monthly total: ${decrypted}`);
      } catch (error: any) {
        console.error("[useExpenseLedger] Error decrypting total:", error);
        const errorMessage = error.message || String(error);
        
        if (errorMessage.includes("not authorized") || errorMessage.includes("authorized")) {
          setMessage(`Decryption failed: You don't have permission to decrypt this handle. Please try adding an expense again or wait a few seconds.`);
        } else {
          setMessage(`Error decrypting: ${errorMessage}`);
        }
        throw error;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId]
  );

  const loadExpenseRecords = useCallback(async () => {
    if (!contractAddress || !ethersProvider || !address) {
      return;
    }

    try {
      const contract = new ethers.Contract(contractAddress, BuildExpenseLedgerABI, ethersProvider);
      const recordCount = await contract.getExpenseRecordCount(address);
      const count = Number(recordCount);

      const records: ExpenseRecord[] = [];
      for (let i = 0; i < count; i++) {
        const [timestamp, category] = await contract.getExpenseRecord(address, i);
        records.push({
          timestamp: Number(timestamp),
          category,
          index: i,
        });
      }

      setExpenseRecords(records);
    } catch (error: any) {
      console.error("[useExpenseLedger] Error loading expense records:", error);
    }
  }, [contractAddress, ethersProvider, address]);

  const loadEncryptedTotal = useCallback(async () => {
    if (!contractAddress || !ethersProvider || !address) {
      return;
    }

    try {
      setIsLoading(true);

      try {
        await ethersProvider.getBlockNumber();
      } catch (providerError: any) {
        if (chainId === 31337) {
          const errorMsg = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
          setMessage(errorMsg);
          console.error("[useExpenseLedger] Hardhat node not accessible:", providerError);
          return;
        } else {
          throw providerError;
        }
      }

      const contractCode = await ethersProvider.getCode(contractAddress);
      if (contractCode === "0x" || contractCode.length <= 2) {
        setMessage(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        setEncryptedTotal(undefined);
        return;
      }

      const contract = new ethers.Contract(contractAddress, BuildExpenseLedgerABI, ethersProvider);
      const hasInit = await contract.hasInitialized(address);
      
      if (!hasInit) {
        setEncryptedTotal(undefined);
        setDecryptedTotal(undefined);
        return;
      }

      const encrypted = await contract.getEncryptedMonthlyTotal(address);
      setEncryptedTotal(encrypted);
      
      // Also load expense records
      await loadExpenseRecords();
    } catch (error: any) {
      console.error("[useExpenseLedger] Error loading encrypted total:", error);
      
      let errorMessage = error.message || String(error);
      
      if (error.code === "UNKNOWN_ERROR" || error.code === -32603) {
        if (chainId === 31337) {
          errorMessage = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
        } else {
          errorMessage = `Network error: ${error.message || "Failed to connect to blockchain"}`;
        }
      } else if (error.message?.includes("Failed to fetch")) {
        if (chainId === 31337) {
          errorMessage = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
        } else {
          errorMessage = "Network connection failed. Please check your internet connection and try again.";
        }
      }
      
      setMessage(`Error loading total: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, ethersProvider, address, chainId, loadExpenseRecords]);

  useEffect(() => {
    if (contractAddress && ethersProvider && address) {
      loadEncryptedTotal();
    }
  }, [contractAddress, ethersProvider, address, loadEncryptedTotal]);

  return {
    contractAddress,
    encryptedTotal,
    decryptedTotal,
    expenseRecords,
    isLoading,
    message,
    addExpense,
    decryptTotal,
    loadEncryptedTotal,
    loadExpenseRecords,
  };
}

