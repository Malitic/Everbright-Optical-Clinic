import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Eye, Edit, Users, Building2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getScheduleChangeRequests, updateScheduleChangeRequest } from '@/services/scheduleApi';
import { getWeeklySchedule } from '@/services/availabilityApi';
import { getBranches } from '@/services/branchApi';
import { useQuery } from '@tanstack/react-query';

interface ScheduleChangeRequest {
  id: number;
  optometrist_id: number;
  day_of_week: number;
  branch_id: number | null;
  start_time: string;
  end_time: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  optometrist: {
    id: number;
    name: string;
    email: string;
  };
  branch: {
    id: number;
    name: string;
  } | null;
  reviewer: {
    id: number;
    name: string;
  } | null;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  branch_id: number;
  branch: {
    id: number;
    name: string;
  };
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

const AdminEmployeeSchedules = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Fetch schedule change requests
  const { data: scheduleData, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['weekly-schedule'],
    queryFn: getWeeklySchedule,
  });

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
    fetchBranches();
  }, []);

  const fetchEmployees = async () => {
    try {
      // This would be a new API endpoint to get all employees
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await getBranches();
      setBranches(response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await getScheduleChangeRequests();
      setRequests(response.requests as ScheduleChangeRequest[]);
    } catch (error) {
      console.error('Error fetching schedule change requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schedule change requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(true);
      await updateScheduleChangeRequest(requestId, status, adminNotes);
      
      toast({
        title: `Request ${status}`,
        description: `Schedule change request has been ${status}`,
      });

      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status, admin_notes: adminNotes }
            : req
        )
      );

      setSelectedRequest(null);
      setAdminNotes('');
      setShowRequestDialog(false);
      
      // Refresh schedule data
      refetchSchedule();
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update request",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRequestDialog = (request: ScheduleChangeRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setShowRequestDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-yellow-200 bg-yellow-50';
      case 'approved': return 'border-green-200 bg-green-50';
      case 'rejected': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek - 1] || 'Unknown';
  };

  // Filter requests based on selected filters
  const filteredRequests = requests.filter(req => {
    const branchMatch = selectedBranch === 'all' || req.branch?.id.toString() === selectedBranch;
    const employeeMatch = selectedEmployee === 'all' || req.optometrist_id.toString() === selectedEmployee;
    const roleMatch = selectedRole === 'all' || 'optometrist' === selectedRole; // For now, only optometrists have schedule requests
    return branchMatch && employeeMatch && roleMatch;
  });

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const approvedRequests = filteredRequests.filter(req => req.status === 'approved');
  const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected');

  // Filter employees based on selected branch and role
  const filteredEmployees = employees.filter(emp => {
    const branchMatch = selectedBranch === 'all' || emp.branch_id.toString() === selectedBranch;
    const roleMatch = selectedRole === 'all' || emp.role === selectedRole;
    return branchMatch && roleMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Schedule Management</h2>
          <p className="text-gray-600">Manage all employee schedules and change requests across all branches</p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filter Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="branch-filter">Branch</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="role-filter">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="optometrist">Optometrists</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="employee-filter">Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {filteredEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name} ({employee.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedBranch('all');
                setSelectedRole('all');
                setSelectedEmployee('all');
              }}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                <p className="text-gray-600">All schedule change requests have been processed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className={`border-l-4 ${getStatusColor(request.status)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.optometrist.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Optometrist
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getDayName(request.day_of_week)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{request.start_time} - {request.end_time}</span>
                          </div>
                          {request.branch && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{request.branch.name}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{request.optometrist.email}</span>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                          <p className="text-sm text-gray-600">{request.reason}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRequestDialog(request)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Requests</h3>
                <p className="text-gray-600">No schedule change requests have been approved yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.optometrist.name} - {getDayName(request.day_of_week)}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Optometrist
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {request.start_time} - {request.end_time} • {request.branch?.name || 'No Branch'}
                        </div>
                        {request.admin_notes && (
                          <div className="bg-green-100 p-2 rounded text-sm">
                            <strong>Admin Notes:</strong> {request.admin_notes}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Rejected Requests</h3>
                <p className="text-gray-600">No schedule change requests have been rejected</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.optometrist.name} - {getDayName(request.day_of_week)}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Optometrist
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {request.start_time} - {request.end_time} • {request.branch?.name || 'No Branch'}
                        </div>
                        {request.admin_notes && (
                          <div className="bg-red-100 p-2 rounded text-sm">
                            <strong>Admin Notes:</strong> {request.admin_notes}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Review Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Schedule Change Request</DialogTitle>
            <DialogDescription>
              Review and respond to the schedule change request from {selectedRequest?.optometrist.name} (Optometrist)
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Day</Label>
                  <p className="text-sm text-gray-600">{getDayName(selectedRequest.day_of_week)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Time</Label>
                  <p className="text-sm text-gray-600">{selectedRequest.start_time} - {selectedRequest.end_time}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Branch</Label>
                  <p className="text-sm text-gray-600">{selectedRequest.branch?.name || 'No Branch'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Employee</Label>
                  <p className="text-sm text-gray-600">{selectedRequest.optometrist.name} (Optometrist)</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Reason</Label>
                <div className="bg-gray-50 p-3 rounded-lg mt-1">
                  <p className="text-sm text-gray-600">{selectedRequest.reason}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="admin-notes" className="text-sm font-medium">
                  Admin Notes (Optional)
                </Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add your notes or reason for approval/rejection..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleApproveReject(selectedRequest!.id, 'rejected')}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleApproveReject(selectedRequest!.id, 'approved')}
              disabled={actionLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmployeeSchedules;
