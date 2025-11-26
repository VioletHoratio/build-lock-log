import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { BuildExpenseLedger } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("BuildExpenseLedgerSepolia", function () {
  let signers: Signers;
  let expenseLedgerContract: BuildExpenseLedger;
  let expenseLedgerContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const BuildExpenseLedgerDeployment = await deployments.get("BuildExpenseLedger");
      expenseLedgerContractAddress = BuildExpenseLedgerDeployment.address;
      expenseLedgerContract = await ethers.getContractAt("BuildExpenseLedger", BuildExpenseLedgerDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should add expense and verify encrypted total", async function () {
    steps = 10;

    this.timeout(4 * 40000);

    const clearAmount = 1000;
    const category = "materials";

    progress(`Encrypting amount ${clearAmount}...`);
    const encryptedAmount = await fhevm
      .createEncryptedInput(expenseLedgerContractAddress, signers.alice.address)
      .add32(clearAmount)
      .encrypt();

    progress(
      `Call addExpense(${clearAmount}, "${category}") BuildExpenseLedger=${expenseLedgerContractAddress} handle=${ethers.hexlify(encryptedAmount.handles[0])} signer=${signers.alice.address}...`,
    );
    const tx = await expenseLedgerContract
      .connect(signers.alice)
      .addExpense(encryptedAmount.handles[0], encryptedAmount.inputProof, category);
    await tx.wait();

    progress(`Call BuildExpenseLedger.getEncryptedMonthlyTotal()...`);
    const encryptedTotal = await expenseLedgerContract.getEncryptedMonthlyTotal(signers.alice.address);
    expect(encryptedTotal).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting BuildExpenseLedger.getEncryptedMonthlyTotal()=${encryptedTotal}...`);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      expenseLedgerContractAddress,
      signers.alice,
    );
    progress(`Clear BuildExpenseLedger.getEncryptedMonthlyTotal()=${clearTotal}`);

    expect(clearTotal).to.eq(clearAmount);

    progress(`Checking expense record count...`);
    const recordCount = await expenseLedgerContract.getExpenseRecordCount(signers.alice.address);
    expect(recordCount).to.eq(1);

    progress(`Getting expense record...`);
    const [timestamp, recordCategory] = await expenseLedgerContract.getExpenseRecord(signers.alice.address, 0);
    expect(recordCategory).to.eq(category);
    expect(timestamp).to.be.gt(0);
    progress(`Expense record: category=${recordCategory}, timestamp=${timestamp}`);
  });
});

