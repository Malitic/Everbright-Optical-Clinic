import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Wrench, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { getEyewearConditionReports, EyewearConditionReport, EyewearConditionNotification } from '@/services/eyewearConditionApi';
import { useToast } from '@/hooks/use-toast';

const EyewearConditionReports: React.FC = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<EyewearConditionReport>({
    totalAssessments: 0,
    conditionBreakdown: {
      good: 0,
      needs_fix: 0,
      needs_replacement: 0,
      bad: 0
    },
    urgentAlerts: 0,
    overdueChecks: 0,
    recentAssessments: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportData = await getEyewearConditionReports();
      setReports(reportData);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast({
        title: "Error",
        description: "Failed to load eyewear condition reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_fix': return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'needs_replacement': return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'bad': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs_fix': return 'bg-yellow-100 text-yellow-800';
      case 'needs_replacement': return 'bg-orange-100 text-orange-800';
      case 'bad': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportReports = () => {
    // Create CSV data
    const csvData = [
      ['Eyewear Condition Reports'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Summary'],
      ['Total Assessments', reports.totalAssessments],
      ['Urgent Alerts', reports.urgentAlerts],
      ['Overdue Checks', reports.overdueChecks],
      [''],
      ['Condition Breakdown'],
      ['Good Condition', reports.conditionBreakdown.good],
      ['Needs Fix', reports.conditionBreakdown.needs_fix],
      ['Needs Replacement', reports.conditionBreakdown.needs_replacement],
      ['Poor Condition', reports.conditionBreakdown.bad],
      [''],
      ['Recent Assessments'],
      ['Date', 'Customer', 'Eyewear', 'Condition', 'Priority', 'Assessed By']
    ];

    reports.recentAssessments.forEach(assessment => {
      csvData.push([
        format(new Date(assessment.assessment_date), 'yyyy-MM-dd'),
        'Customer', // Would need customer name from API
        assessment.eyewear_label,
        assessment.condition,
        assessment.priority,
        assessment.assessed_by
      ]);
    });

    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Download file
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eyewear-condition-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Reports exported successfully",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eyewear Condition Reports</h1>
          <p className="text-gray-600">Analytics and insights for eyewear condition assessments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadReports}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReports}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Condition Breakdown</TabsTrigger>
          <TabsTrigger value="recent">Recent Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                    <p className="text-2xl font-bold">{reports.totalAssessments}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Urgent Alerts</p>
                    <p className="text-2xl font-bold text-red-600">{reports.urgentAlerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue Checks</p>
                    <p className="text-2xl font-bold text-orange-600">{reports.overdueChecks}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Good Condition</p>
                    <p className="text-2xl font-bold text-green-600">{reports.conditionBreakdown.good}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Condition Distribution</CardTitle>
                <CardDescription>Breakdown of eyewear conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(reports.conditionBreakdown).map(([condition, count]) => {
                    const percentage = reports.totalAssessments > 0 
                      ? Math.round((count / reports.totalAssessments) * 100) 
                      : 0;
                    
                    return (
                      <div key={condition} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getConditionIcon(condition)}
                          <span className="capitalize">{condition.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getConditionColor(condition).split(' ')[0]}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Alerts</CardTitle>
                <CardDescription>Current priority status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Urgent</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      {reports.urgentAlerts} alerts
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Overdue Checks</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">
                      {reports.overdueChecks} overdue
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Good Condition</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {reports.conditionBreakdown.good} items
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Condition Breakdown</CardTitle>
              <CardDescription>Comprehensive analysis of eyewear conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(reports.conditionBreakdown).map(([condition, count]) => (
                  <div key={condition} className="text-center p-4 border rounded-lg">
                    <div className="flex justify-center mb-2">
                      {getConditionIcon(condition)}
                    </div>
                    <h3 className="font-semibold capitalize mb-1">
                      {condition.replace('_', ' ')}
                    </h3>
                    <p className="text-2xl font-bold mb-1">{count}</p>
                    <p className="text-sm text-gray-600">
                      {reports.totalAssessments > 0 
                        ? Math.round((count / reports.totalAssessments) * 100) 
                        : 0}% of total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Latest eyewear condition assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.recentAssessments.length > 0 ? (
                  reports.recentAssessments.map((assessment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getConditionIcon(assessment.condition)}
                        <div>
                          <p className="font-medium">{assessment.eyewear_label}</p>
                          <p className="text-sm text-gray-600">
                            Assessed by {assessment.assessed_by} • {format(new Date(assessment.assessment_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getConditionColor(assessment.condition)}>
                          {assessment.condition.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(assessment.priority)}>
                          {assessment.priority}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent assessments found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EyewearConditionReports;
