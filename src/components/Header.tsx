import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import logo from "@/assets/buildledger-logo.png";

interface HeaderProps {
  onConnectWallet: () => void;
  walletConnected: boolean;
}

const Header = ({ onConnectWallet, walletConnected }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logo} alt="BuildLedger Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Secure BuildLedger</h1>
              <p className="text-xs text-muted-foreground">Build Trust with Every Transfer</p>
            </div>
          </div>
          
          <Button 
            onClick={onConnectWallet}
            variant={walletConnected ? "secondary" : "default"}
            className="gap-2"
          >
            <Wallet className="h-4 w-4" />
            {walletConnected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
