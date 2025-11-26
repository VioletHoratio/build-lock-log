import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface NewTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (transfer: {
    material: string;
    quantity: number;
    unit: string;
    from: string;
    to: string;
  }) => void;
}

const NewTransferDialog = ({ open, onOpenChange, onSubmit }: NewTransferDialogProps) => {
  const [formData, setFormData] = useState({
    material: "",
    quantity: "",
    unit: "tons",
    from: "",
    to: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: parseFloat(formData.quantity),
    });
    setFormData({
      material: "",
      quantity: "",
      unit: "tons",
      from: "",
      to: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Material Transfer</DialogTitle>
          <DialogDescription>
            Record a new material handover. This will create an encrypted log on the blockchain.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="material">Material Type</Label>
            <Input
              id="material"
              placeholder="e.g., Steel Beams, Concrete Mix, Lumber"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                placeholder="tons, m³, units"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="from">From (Sender)</Label>
            <Input
              id="from"
              placeholder="Company or contractor name"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="to">To (Receiver)</Label>
            <Input
              id="to"
              placeholder="Company or contractor name"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTransferDialog;
