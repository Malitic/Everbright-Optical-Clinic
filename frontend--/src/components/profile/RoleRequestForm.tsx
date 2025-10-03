import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { submitRoleRequest } from '@/services/roleRequestApi';
import { toast } from 'sonner';

const RoleRequestForm: React.FC = () => {
  const [role, setRole] = useState<'staff' | 'optometrist' | ''>('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!role) return toast.error('Please select a role');
    setLoading(true);
    try {
      await submitRoleRequest(role);
      toast.success('Request submitted');
      setRole('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Role Upgrade</CardTitle>
        <CardDescription>Choose a role and submit for admin approval</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={role} onValueChange={(v) => setRole(v as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="optometrist">Optometrist</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={submit} disabled={loading || !role} className="w-full">
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RoleRequestForm;



