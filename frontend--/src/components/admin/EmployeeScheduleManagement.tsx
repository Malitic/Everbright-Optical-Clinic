import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Eye, Edit, Users, Building, Filter, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  getStaffMembers,
  getBranches,
  getAllStaffSchedules,
  getBranchStaffSchedules,
  getStaffSchedule,
  createOrUpdateSchedule,
  deleteSchedule,
  getChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  type Employee,
  type Schedule,
  type ScheduleChangeRequest,
  type Branch
} from '@/services/staffScheduleApi';

const EmployeeScheduleManagement = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    staff_id: '',
    staff_role: 'optometrist',
    branch_id: '',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_active: true
  });

  // Fetch data
  useEffect(() => {
    fetchEmployees();
    fetchBranches();
    fetchSchedules();
    fetchRequests();
  }, [selectedBranch, selectedRole, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const data = await getStaffMembers({
        role: selectedRole !== 'all' ? selectedRole : undefined,
        branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
      });
      
      setEmployees(data.staff_members || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      if (selectedBranch !== 'all') {
        // Fetch schedules for specific branch
        const data = await getBranchStaffSchedules(parseInt(selectedBranch));
        setSchedules(data.staff_schedules || []);
      } else {
        // Fetch all schedules across all branches
        const data = await getAllStaffSchedules();
        setSchedules(data.staff_schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schedules",
        variant: "destructive",
      });
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await getChangeRequests({
        status: undefined, // Get all statuses
        staff_role: selectedRole !== 'all' ? selectedRole : undefined,
        branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
      });
      
      setRequests(data.change_requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
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
      
      if (status === 'approved') {
        await approveChangeRequest(requestId, adminNotes);
      } else {
        await rejectChangeRequest(requestId, adminNotes);
      }

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
      
      // Refresh data
      fetchSchedules();
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      await createOrUpdateSchedule({
        staff_id: parseInt(newSchedule.staff_id),
        staff_role: newSchedule.staff_role,
        branch_id: parseInt(newSchedule.branch_id),
        day_of_week: newSchedule.day_of_week,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        is_active: newSchedule.is_active
      });

      toast({
        title: "Schedule Created",
        description: "Employee schedule has been created successfully",
      });

      setShowScheduleDialog(false);
      setNewSchedule({
        staff_id: '',
        staff_role: 'optometrist',
        branch_id: '',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_active: true
      });
      
      fetchSchedules();
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      await deleteSchedule(scheduleId);

      toast({
        title: "Schedule Deleted",
        description: "Employee schedule has been deleted successfully",
      });
      
      fetchSchedules();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
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

  // Filter schedules based on selected filters
  const filteredSchedules = schedules.filter(schedule => {
    const branchMatch = selectedBranch === 'all' || schedule.branch?.id.toString() === selectedBranch;
    const employeeMatch = selectedEmployee === 'all' || schedule.staff_id.toString() === selectedEmployee;
    const roleMatch = selectedRole === 'all' || schedule.staff_role === selectedRole;
    return branchMatch && employeeMatch && roleMatch;
  });

  // Filter requests based on selected filters
  const filteredRequests = requests.filter(req => {
    const branchMatch = selectedBranch === 'all' || req.branch?.id.toString() === selectedBranch;
    const employeeMatch = selectedEmployee === 'all' || req.staff_id.toString() === selectedEmployee;
    const roleMatch = selectedRole === 'all' || req.staff_role === selectedRole;
    return branchMatch && employeeMatch && roleMatch;
  });

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const approvedRequests = filteredRequests.filter(req => req.status === 'approved');
  const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected');

  // Filter employees based on selected branch and role
  const filteredEmployees = employees.filter(emp => {
    const branchMatch = selectedBranch === 'all' || emp.branch?.id.toString() === selectedBranch;
    const roleMatch = selectedRole === 'all' || emp.role === selectedRole;
    return branchMatch && roleMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Schedule Management</h2>
          <p className="text-gray-600">Manage schedules for all employees (optometrists and staff) across all branches</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchSchedules} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowScheduleDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
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

      <Tabs defaultValue="schedules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedules">
            Schedules ({filteredSchedules.length})
          </TabsTrigger>
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

        <TabsContent value="schedules" className="space-y-4">
          {filteredSchedules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedules Found</h3>
                <p className="text-gray-600">No employee schedules match your current filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSchedules.map((schedule) => (
                <Card key={schedule.id} className="border-l-4 border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {schedule.staff.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {schedule.staff_role}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getDayName(schedule.day_of_week)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{schedule.start_time} - {schedule.end_time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{schedule.branch.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{schedule.staff.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSchedule(schedule)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

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
                            {request.staff.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {request.staff_role}
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
                            <span>{request.staff.email}</span>
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
                            {request.staff.name} - {getDayName(request.day_of_week)}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {request.staff_role}
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
                            {request.staff.name} - {getDayName(request.day_of_week)}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {request.staff_role}
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
              Review and respond to the schedule change request from {selectedRequest?.staff.name} ({selectedRequest?.staff_role})
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
                  <p className="text-sm text-gray-600">{selectedRequest.staff.name} ({selectedRequest.staff_role})</p>
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

      {/* Create/Edit Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Create a new schedule for an employee
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staff-select">Employee</Label>
                <Select value={newSchedule.staff_id} onValueChange={(value) => setNewSchedule({...newSchedule, staff_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role-select">Role</Label>
                <Select value={newSchedule.staff_role} onValueChange={(value) => setNewSchedule({...newSchedule, staff_role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="optometrist">Optometrist</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch-select">Branch</Label>
                <Select value={newSchedule.branch_id} onValueChange={(value) => setNewSchedule({...newSchedule, branch_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="day-select">Day of Week</Label>
                <Select value={newSchedule.day_of_week.toString()} onValueChange={(value) => setNewSchedule({...newSchedule, day_of_week: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="7">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSchedule}
              disabled={!newSchedule.staff_id || !newSchedule.branch_id}
            >
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeScheduleManagement;