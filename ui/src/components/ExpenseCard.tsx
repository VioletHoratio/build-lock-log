import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";

export interface ExpenseRecord {
  timestamp: number;
  category: string;
  index: number;
}

interface ExpenseCardProps {
  record: ExpenseRecord;
  isEncrypted?: boolean;
}

const ExpenseCard = ({ record, isEncrypted = true }: ExpenseCardProps) => {
  const date = new Date(Number(record.timestamp) * 1000);
  
  return (
    <Card className="p-6 hover:shadow-[var(--shadow-elevated)] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isEncrypted ? "bg-accent/10" : "bg-trust/10"
          }`}>
            <DollarSign className={`h-5 w-5 ${
              isEncrypted ? "text-accent" : "text-trust"
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground capitalize">{record.category}</h3>
            <p className="text-sm text-muted-foreground">Expense #{record.index + 1}</p>
          </div>
        </div>
        
        <Badge variant={isEncrypted ? "secondary" : "default"} className="gap-1">
          {isEncrypted ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          {isEncrypted ? "Encrypted" : "Decrypted"}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>{format(date, "MMM dd, yyyy HH:mm")}</span>
      </div>
    </Card>
  );
};

export default ExpenseCard;

