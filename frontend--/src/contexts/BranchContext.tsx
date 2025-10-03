import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BranchContextType {
  selectedBranchId: string;
  setSelectedBranchId: (branchId: string) => void;
  userBranch: Branch | null;
  isMultiBranch: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Set user's branch as default if they have one
  useEffect(() => {
    if (user?.branch) {
      setSelectedBranchId(user.branch.id.toString());
    } else {
      setSelectedBranchId('all');
    }
  }, [user]);

  const userBranch = user?.branch || null;
  const isMultiBranch = user?.role === 'admin'; // Only admins can see all branches

  return (
    <BranchContext.Provider value={{
      selectedBranchId,
      setSelectedBranchId,
      userBranch,
      isMultiBranch
    }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
