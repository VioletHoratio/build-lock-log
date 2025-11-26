import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { BuildExpenseLedger, BuildExpenseLedger__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("BuildExpenseLedger")) as BuildExpenseLedger__factory;
  const expenseLedgerContract = (await factory.deploy()) as BuildExpenseLedger;
  const expenseLedgerContractAddress = await expenseLedgerContract.getAddress();

  return { expenseLedgerContract, expenseLedgerContractAddress };
}

describe("BuildExpenseLedger", function () {
  let signers: Signers;
  let expenseLedgerContract: BuildExpenseLedger;
  let expenseLedgerContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ expenseLedgerContract, expenseLedgerContractAddress } = await deployFixture());
  });

  it("encrypted monthly total should be uninitialized after deployment", async function () {
    const encryptedTotal = await expenseLedgerContract.getEncryptedMonthlyTotal(signers.alice.address);
    // Expect initial total to be bytes32(0) after deployment,
    // (meaning the encrypted total value is uninitialized)
    expect(encryptedTotal).to.eq(ethers.ZeroHash);
  });

  it("should add first expense and initialize ledger", async function () {
    const clearAmount = 1000; // 1000 units (e.g., dollars)
    const category = "materials";

    // Encrypt amount as a euint32
    const encryptedAmount = await fhevm
      .createEncryptedInput(expenseLedgerContractAddress, signers.alice.address)
      .add32(clearAmount)
      .encrypt();

    const tx = await expenseLedgerContract
      .connect(signers.alice)
      .addExpense(encryptedAmount.handles[0], encryptedAmount.inputProof, category);
    await tx.wait();

    // Check if initialized
    const hasInitialized = await expenseLedgerContract.hasInitialized(signers.alice.address);
    expect(hasInitialized).to.be.true;

    // Check encrypted total
    const encryptedTotal = await expenseLedgerContract.getEncryptedMonthlyTotal(signers.alice.address);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      expenseLedgerContractAddress,
      signers.alice,
    );

    expect(clearTotal).to.eq(clearAmount);

    // Check expense record count
    const recordCount = await expenseLedgerContract.getExpenseRecordCount(signers.alice.address);
    expect(recordCount).to.eq(1);

    // Check expense record
    const [timestamp, recordCategory] = await expenseLedgerContract.getExpenseRecord(signers.alice.address, 0);
    expect(recordCategory).to.eq(category);
    expect(timestamp).to.be.gt(0);
  });

  it("should add multiple expenses and accumulate total", async function () {
    const clearAmount1 = 500; // materials
    const clearAmount2 = 300; // labor
    const clearAmount3 = 200; // equipment

    // Add first expense
    const encryptedAmount1 = await fhevm
      .createEncryptedInput(expenseLedgerContractAddress, signers.alice.address)
      .add32(clearAmount1)
      .encrypt();

    let tx = await expenseLedgerContract
      .connect(signers.alice)
      .addExpense(encryptedAmount1.handles[0], encryptedAmount1.inputProof, "materials");
    await tx.wait();

    // Add second expense
    const encryptedAmount2 = await fhevm
      .createEncryptedInput(expenseLedgerContractAddress, signers.alice.address)
      .add32(clearAmount2)
      .encrypt();

    tx = await expenseLedgerContract
      .connect(signers.alice)
      .addExpense(encryptedAmount2.handles[0], encryptedAmount2.inputProof, "labor");
    await tx.wait();

    // Add third expense
    const encryptedAmount3 = await fhevm
      .createEncryptedInput(expenseLedgerContractAddress, signers.alice.address)
      .add32(clearAmount3)
      .encrypt();

    tx = await expenseLedgerContract
      .connect(signers.alice)
      .addExpense(encryptedAmount3.handles[0], encryptedAmount3.inputProof, "equipment");
    await tx.wait();

    // Check encrypted total
    const encryptedTotal = await expenseLedgerContract.getEncryptedMonthlyTotal(signers.alice.address);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      expenseLedgerContractAddress,
      signers.alice,
    );

    expect(clearTotal).to.eq(clearAmount1 + clearAmount2 + clearAmount3);

    // Check expense record count
    const recordCount = await expenseLedgerContract.getExpenseRecordCount(signers.alice.address);
    expect(recordCount).to.eq(3);
  });

  it("should allow different users to have separate ledgers", async function () {
    const aliceAmount = 1000;
    const bobAmount = 2000;

    // Alice adds expense
    const encryptedAliceAmount = await fhevm
      .createEncryptedInput(expenseLedgerContractAddress, signers.alice.address)
      .add32(aliceAmount)
      .encrypt();

    let tx = await expenseLedgerContract
      .connect(signers.alice)
      .addExpense(encryptedAliceAmount.handles[0], encryptedAliceAmount.inputProof, "materials");
    await tx.wait();

    // Bob adds expense
    const encryptedBobAmount = await fhevm
      .createEncryptedInput(expenseLedgerContractAddress, signers.bob.address)
      .add32(bobAmount)
      .encrypt();

    tx = await expenseLedgerContract
      .connect(signers.bob)
      .addExpense(encryptedBobAmount.handles[0], encryptedBobAmount.inputProof, "labor");
    await tx.wait();

    // Check Alice's total
    const aliceEncryptedTotal = await expenseLedgerContract.getEncryptedMonthlyTotal(signers.alice.address);
    const aliceClearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceEncryptedTotal,
      expenseLedgerContractAddress,
      signers.alice,
    );
    expect(aliceClearTotal).to.eq(aliceAmount);

    // Check Bob's total
    const bobEncryptedTotal = await expenseLedgerContract.getEncryptedMonthlyTotal(signers.bob.address);
    const bobClearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobEncryptedTotal,
      expenseLedgerContractAddress,
      signers.bob,
    );
    expect(bobClearTotal).to.eq(bobAmount);
  });
});

