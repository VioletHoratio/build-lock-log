import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Header from "@/components/Header";
import ExpenseCard from "@/components/ExpenseCard";
import NewExpenseDialog from "@/components/NewExpenseDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExpenseLedger } from "@/hooks/useExpenseLedger";
import { toast } from "sonner";
import { Plus, Lock, Unlock, RefreshCw, DollarSign } from "lucide-react";

// Get contract address from environment variable or use default for localhost
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const Index = () => {
  const { isConnected } = useAccount();
  const {
    encryptedTotal,
    decryptedTotal,
    expenseRecords,
    isLoading,
    message,
    addExpense,
    decryptTotal,
    loadEncryptedTotal,
  } = useExpenseLedger(CONTRACT_ADDRESS);

  const [showNewExpense, setShowNewExpense] = useState(false);

  useEffect(() => {
    if (message) {
      if (message.includes("Error") || message.includes("failed")) {
        toast.error(message);
      } else if (message.includes("successfully")) {
        toast.success(message);
      } else {
        toast.info(message);
      }
    }
  }, [message]);

  const handleAddExpense = async (amount: number, category: string) => {
    try {
      await addExpense(amount, category);
      toast.success("Expense added successfully!", {
        description: "Your expense has been encrypted and stored on-chain.",
      });
    } catch (error: any) {
      toast.error("Failed to add expense", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleDecryptTotal = async () => {
    try {
      await decryptTotal();
      toast.success("Monthly total decrypted!", {
        description: `Total: ${decryptedTotal}`,
      });
    } catch (error: any) {
      toast.error("Failed to decrypt total", {
        description: error.message || "Please try again.",
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground">
              Please connect your wallet using the button in the top right corner to start using BuildLedger.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Contract Not Configured
            </h2>
            <p className="text-muted-foreground">
              Please set VITE_CONTRACT_ADDRESS in your .env.local file.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Monthly Total Section */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Monthly Total</h2>
              <p className="text-muted-foreground">
                Your encrypted monthly expense total
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadEncryptedTotal}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {encryptedTotal && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDecryptTotal}
                  disabled={isLoading || decryptedTotal !== undefined}
                >
                  {decryptedTotal !== undefined ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Decrypted
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Decrypt
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              {decryptedTotal !== undefined ? (
                <>
                  <p className="text-sm text-muted-foreground">Decrypted Total</p>
                  <p className="text-3xl font-bold text-foreground">
                    {decryptedTotal.toLocaleString()}
                  </p>
                </>
              ) : encryptedTotal ? (
                <>
                  <p className="text-sm text-muted-foreground">Encrypted Total</p>
                  <p className="text-lg font-mono text-muted-foreground">
                    {encryptedTotal.slice(0, 20)}...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Decrypt" to view the actual amount
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">No expenses yet</p>
                  <p className="text-lg text-muted-foreground">
                    Add your first expense to get started
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Actions Section */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Expense Records</h2>
            <p className="text-muted-foreground">
              View and manage your encrypted construction expenses
            </p>
          </div>
          <Button onClick={() => setShowNewExpense(true)} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
        
        {/* Expense Records Grid */}
        {expenseRecords.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {expenseRecords.map((record) => (
              <ExpenseCard
                key={record.index}
                record={record}
                isEncrypted={true}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No expenses recorded yet</p>
            <Button onClick={() => setShowNewExpense(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first expense
            </Button>
          </Card>
        )}
      </main>

      <NewExpenseDialog
        open={showNewExpense}
        onOpenChange={setShowNewExpense}
        onSubmit={handleAddExpense}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Index;
