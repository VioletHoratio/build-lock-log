import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MaterialCard, { MaterialTransfer } from "@/components/MaterialCard";
import NewTransferDialog from "@/components/NewTransferDialog";
import { toast } from "sonner";

const Index = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [transfers, setTransfers] = useState<MaterialTransfer[]>([
    {
      id: "TXN001",
      material: "Steel Beams I-Sections",
      quantity: 24.5,
      unit: "tons",
      from: "Metro Steel Supply Co.",
      to: "BuildRight Construction Ltd.",
      date: "2024-11-12",
      status: "verified",
      hash: "0x7a8f3c2e..."
    },
    {
      id: "TXN002",
      material: "Concrete Mix Grade 30",
      quantity: 120,
      unit: "m³",
      from: "BuildRight Construction Ltd.",
      to: "Foundation Pro Services",
      date: "2024-11-13",
      status: "locked",
      hash: "0x9b4d1a5f..."
    },
    {
      id: "TXN003",
      material: "Lumber 2x4 Douglas Fir",
      quantity: 500,
      unit: "units",
      from: "Timber Traders Inc.",
      to: "BuildRight Construction Ltd.",
      date: "2024-11-14",
      status: "pending"
    }
  ]);

  const handleConnectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      toast.info("Wallet disconnected");
    } else {
      // Simulate wallet connection
      setTimeout(() => {
        setWalletConnected(true);
        toast.success("Wallet connected successfully", {
          description: "Address: 0x742d...5f8a"
        });
      }, 1000);
    }
  };

  const handleNewTransfer = (transferData: {
    material: string;
    quantity: number;
    unit: string;
    from: string;
    to: string;
  }) => {
    if (!walletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const newTransfer: MaterialTransfer = {
      id: `TXN${String(transfers.length + 1).padStart(3, '0')}`,
      ...transferData,
      date: new Date().toISOString().split('T')[0],
      status: "pending"
    };

    setTransfers([newTransfer, ...transfers]);
    toast.success("Transfer created successfully", {
      description: "Awaiting verification from receiver"
    });
  };

  const handleVerifyTransfer = (id: string) => {
    if (!walletConnected) {
      toast.error("Please connect your wallet to verify");
      return;
    }

    setTransfers(transfers.map(t => 
      t.id === id 
        ? { 
            ...t, 
            status: "verified" as const,
            hash: "0x" + Math.random().toString(16).substr(2, 8) + "..."
          }
        : t
    ));
    
    toast.success("Transfer verified and locked", {
      description: "Encrypted receipt generated on blockchain"
    });
  };

  const handleViewHistory = () => {
    const historySection = document.getElementById('transfer-history');
    if (historySection) {
      historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onConnectWallet={handleConnectWallet}
        walletConnected={walletConnected}
      />
      
      <HeroSection 
        onNewTransfer={() => setShowNewTransfer(true)}
        onViewHistory={handleViewHistory}
      />
      
      <main id="transfer-history" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Material Transfers</h2>
          <p className="text-muted-foreground">
            View and manage your blockchain-secured material handover logs
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {transfers.map((transfer) => (
            <MaterialCard
              key={transfer.id}
              transfer={transfer}
              onVerify={handleVerifyTransfer}
            />
          ))}
        </div>

        {transfers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No transfers recorded yet</p>
            <button
              onClick={() => setShowNewTransfer(true)}
              className="text-primary hover:underline"
            >
              Create your first transfer
            </button>
          </div>
        )}
      </main>

      <NewTransferDialog
        open={showNewTransfer}
        onOpenChange={setShowNewTransfer}
        onSubmit={handleNewTransfer}
      />
    </div>
  );
};

export default Index;
