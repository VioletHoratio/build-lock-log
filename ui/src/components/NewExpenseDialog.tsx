import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, category: string) => Promise<void>;
  isLoading?: boolean;
}

const expenseCategories = [
  "materials",
  "labor",
  "equipment",
  "transportation",
  "utilities",
  "other",
];

const NewExpenseDialog = ({ open, onOpenChange, onSubmit, isLoading = false }: NewExpenseDialogProps) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("materials");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!category) {
      setError("Please select a category");
      return;
    }

    try {
      await onSubmit(amountNum, category);
      setAmount("");
      setCategory("materials");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Enter the expense amount and category. The amount will be encrypted using FHE before being stored on-chain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setError(null);
                setAmount("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewExpenseDialog;

