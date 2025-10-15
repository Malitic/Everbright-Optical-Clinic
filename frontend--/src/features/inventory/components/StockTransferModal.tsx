import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { inventoryApiService } from '@/services/inventoryApi';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  branches: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  currentBranchId?: string;
  onTransferRequested: () => void;
}

const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  product,
  branches,
  currentBranchId,
  onTransferRequested
}) => {
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFromBranchId('');
      setToBranchId('');
      setQuantity('');
      setReason('');
      setError(null);
      setAvailableQuantity(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (fromBranchId && product.id) {
      loadAvailableQuantity();
    }
  }, [fromBranchId, product.id]);

  const loadAvailableQuantity = async () => {
    try {
      const data = await inventoryApiService.getProductAvailability(product.id);
      const branchStock = data.availability.find(
        (item) => item.branch.id === fromBranchId
      );
      setAvailableQuantity(branchStock?.available_quantity || 0);
    } catch (err) {
      console.error('Error loading available quantity:', err);
      setAvailableQuantity(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromBranchId || !toBranchId || !quantity || !reason.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (fromBranchId === toBranchId) {
      setError('Source and destination branches must be different');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    if (availableQuantity !== null && quantityNum > availableQuantity) {
      setError(`Insufficient stock. Only ${availableQuantity} units available`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await inventoryApiService.requestStockTransfer({
        product_id: product.id,
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        quantity: quantityNum,
        reason: reason.trim()
      });

      onTransferRequested();
      onClose();
    } catch (err: any) {
      console.error('Error requesting transfer:', err);
      setError(err.response?.data?.message || 'Failed to request stock transfer');
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(branch => branch.id !== toBranchId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Request Stock Transfer
          </DialogTitle>
          <DialogDescription>
            Transfer stock for <strong>{product.name}</strong> ({product.sku}) between branches
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-branch">From Branch *</Label>
              <Select value={fromBranchId} onValueChange={setFromBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source branch" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBranches.filter(b => b.id && String(b.id).trim() !== '').map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name} ({branch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableQuantity !== null && (
                <p className="text-xs text-gray-500">
                  Available: {availableQuantity} units
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-branch">To Branch *</Label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.filter(branch => branch.id !== fromBranchId && branch.id && String(branch.id).trim() !== '').map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name} ({branch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={availableQuantity || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity to transfer"
              required
            />
            {availableQuantity !== null && (
              <p className="text-xs text-gray-500">
                Maximum: {availableQuantity} units
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Transfer *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this transfer is needed..."
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Requesting...' : 'Request Transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockTransferModal;



