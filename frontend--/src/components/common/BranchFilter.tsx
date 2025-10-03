import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getActiveBranches, getBranches } from '@/services/branchApi';

interface BranchFilterProps {
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  showAllOption?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  useAdminData?: boolean; // Use admin branches (all branches) vs active branches
}

const BranchFilter: React.FC<BranchFilterProps> = ({
  selectedBranchId,
  onBranchChange,
  showAllOption = true,
  label = "Filter by Branch",
  placeholder = "All branches",
  className = "",
  useAdminData = false
}) => {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: useAdminData ? ['branches'] : ['activeBranches'],
    queryFn: useAdminData ? getBranches : getActiveBranches,
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="branch-filter" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        {label}
      </Label>
      <Select value={selectedBranchId} onValueChange={onBranchChange}>
        <SelectTrigger id="branch-filter" className="w-full">
          <SelectValue placeholder={isLoading ? "Loading branches..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-semibold">Global View (All Branches)</span>
              </div>
            </SelectItem>
          )}
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id.toString()}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{branch.name}</span>
                <span className="text-xs text-gray-500 ml-auto">{branch.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BranchFilter;
