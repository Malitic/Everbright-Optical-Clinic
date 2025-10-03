import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { listRoleRequests, approveRoleRequest, rejectRoleRequest } from '@/services/roleRequestApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RoleRequest {
  id: number;
  user: { id: number; name: string; email: string; role: string };
  requested_role: 'staff' | 'optometrist';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  branch?: {
    id: number;
    name: string;
    address: string;
  };
}

const RoleRequestsDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['role-requests', 'pending'],
    queryFn: async () => {
      const res = await listRoleRequests('pending');
      return (res.data.data || []) as RoleRequest[];
    }
  });

  const approve = async (id: number) => {
    try {
      await approveRoleRequest(id);
      toast.success('Approved');
      queryClient.invalidateQueries({ queryKey: ['role-requests'] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to approve');
    }
  };

  const reject = async (id: number) => {
    try {
      await rejectRoleRequest(id);
      toast.success('Rejected');
      queryClient.invalidateQueries({ queryKey: ['role-requests'] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to reject');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pending Role Requests</CardTitle>
            <CardDescription>Approve or reject user role upgrades</CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Requested Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={6} className="text-red-500">Error: {error.message}</TableCell></TableRow>
            ) : (data?.length || 0) === 0 ? (
              <TableRow><TableCell colSpan={6}>No pending requests</TableCell></TableRow>
            ) : (
              data!.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.user?.name}</TableCell>
                  <TableCell>{item.user?.email}</TableCell>
                  <TableCell>{item.user?.role}</TableCell>
                  <TableCell>{item.requested_role}</TableCell>
                  <TableCell>
                    {item.branch ? (
                      <div>
                        <div className="font-medium">{item.branch.name}</div>
                        <div className="text-sm text-gray-500">{item.branch.address}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">No branch assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" onClick={() => approve(item.id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => reject(item.id)}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RoleRequestsDashboard;



