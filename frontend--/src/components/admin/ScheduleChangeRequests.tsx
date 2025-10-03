import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getScheduleChangeRequests, 
  updateScheduleChangeRequest,
  ScheduleChangeRequest 
} from '@/services/scheduleApi';
import { formatDistanceToNow } from 'date-fns';

const ScheduleChangeRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await getScheduleChangeRequests();
      setRequests(response.requests);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-green-600 bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-yellow-200 bg-yellow-50';
      case 'approved': return 'border-green-200 bg-green-50';
      case 'rejected': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');
  const rejectedRequests = requests.filter(req => req.status === 'rejected');

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedule change requests...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule Change Requests</h1>
        <p className="text-gray-600">Review and approve optometrist schedule change requests</p>
      </div>

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
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Optometrist Request</span>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{dayNames[request.day_of_week - 1]}</span>
                            </div>
                            
                            {request.branch_id ? (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">Branch ID: {request.branch_id}</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <XCircle className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">Not Available</span>
                              </div>
                            )}
                            
                            {request.start_time && request.end_time && (
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                  {request.start_time} - {request.end_time}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Reason</Label>
                              <p className="text-sm text-gray-700 mt-1">{request.reason}</p>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Requested</Label>
                              <p className="text-sm text-gray-700 mt-1">
                                {formatDistanceToNow(new Date(request.created_at || ''), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Review Request</DialogTitle>
                              <DialogDescription>
                                Review the schedule change request details
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Day</Label>
                                <p className="text-sm">{dayNames[request.day_of_week - 1]}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Availability</Label>
                                <p className="text-sm">
                                  {request.branch_id ? 'Available' : 'Not Available'}
                                </p>
                              </div>
                              
                              {request.branch_id && (
                                <div className="space-y-2">
                                  <Label>Branch</Label>
                                  <p className="text-sm">Branch ID: {request.branch_id}</p>
                                </div>
                              )}
                              
                              {request.start_time && request.end_time && (
                                <div className="space-y-2">
                                  <Label>Time</Label>
                                  <p className="text-sm">
                                    {request.start_time} - {request.end_time}
                                  </p>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <Label>Reason</Label>
                                <p className="text-sm">{request.reason}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                                <Textarea
                                  id="admin-notes"
                                  placeholder="Add notes about your decision..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(null);
                                    setAdminNotes('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    handleApproveReject(request.id!, 'rejected');
                                  }}
                                  disabled={actionLoading}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    handleApproveReject(request.id!, 'approved');
                                  }}
                                  disabled={actionLoading}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{dayNames[request.day_of_week - 1]}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                        {request.admin_notes && (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                            <p className="text-sm text-gray-600">{request.admin_notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(request.updated_at || ''), { addSuffix: true })}
                        </p>
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
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{dayNames[request.day_of_week - 1]}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                        {request.admin_notes && (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                            <p className="text-sm text-gray-600">{request.admin_notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(request.updated_at || ''), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleChangeRequests;
