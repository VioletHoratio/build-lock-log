import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, User, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MaterialTransfer {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  from: string;
  to: string;
  date: string;
  status: "locked" | "verified" | "pending";
  hash?: string;
}

interface MaterialCardProps {
  transfer: MaterialTransfer;
  onVerify?: (id: string) => void;
}

const MaterialCard = ({ transfer, onVerify }: MaterialCardProps) => {
  const isLocked = transfer.status === "locked" || transfer.status === "verified";
  
  return (
    <Card className="p-6 hover:shadow-[var(--shadow-elevated)] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            transfer.status === "verified" ? "bg-trust/10" : 
            transfer.status === "locked" ? "bg-accent/10" : 
            "bg-warning/10"
          }`}>
            <Package className={`h-5 w-5 ${
              transfer.status === "verified" ? "text-trust" : 
              transfer.status === "locked" ? "text-accent" : 
              "text-warning"
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">{transfer.material}</h3>
            <p className="text-sm text-muted-foreground">Transfer #{transfer.id}</p>
          </div>
        </div>
        
        <Badge variant={
          transfer.status === "verified" ? "default" : 
          transfer.status === "locked" ? "secondary" : 
          "outline"
        } className="gap-1">
          {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          {transfer.status === "verified" ? "Verified" : 
           transfer.status === "locked" ? "Locked" : 
           "Pending"}
        </Badge>
      </div>
      
      <div className={`p-4 rounded-lg mb-4 border ${
        isLocked ? "bg-muted/50 border-border" : "bg-background border-dashed border-muted-foreground"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Quantity</span>
          <span className="text-2xl font-bold text-foreground">
            {transfer.quantity} {transfer.unit}
          </span>
        </div>
        {isLocked && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono">
              Hash: {transfer.hash || "0x" + transfer.id.slice(0, 8) + "..."}
            </p>
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">From:</span>
          <span className="font-medium text-foreground">{transfer.from}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">To:</span>
          <span className="font-medium text-foreground">{transfer.to}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium text-foreground">{transfer.date}</span>
        </div>
      </div>
      
      {transfer.status === "pending" && onVerify && (
        <Button 
          onClick={() => onVerify(transfer.id)}
          className="w-full"
          variant="default"
        >
          Verify & Lock Transfer
        </Button>
      )}
    </Card>
  );
};

export default MaterialCard;
