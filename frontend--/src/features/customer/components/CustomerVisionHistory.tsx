import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, User, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

interface VisionRecord {
  id: string;
  date: string;
  type: 'comprehensive-exam' | 'contact-lens' | 'follow-up';
  optometrist: string;
  findings: string[];
  prescription?: {
    sphere: string;
    cylinder: string;
    axis: string;
    add?: string;
  };
  nextExam: string;
  notes: string;
}

const CustomerVisionHistory: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const visionHistory: VisionRecord[] = [
    {
      id: '1',
      date: '2024-10-15',
      type: 'comprehensive-exam',
      optometrist: 'Dr. Sarah Johnson',
      findings: [
        'Mild myopia detected',
        'No signs of retinal issues',
        'Recommend annual check-ups'
      ],
      prescription: {
        sphere: '-1.50',
        cylinder: '-0.75',
        axis: '180',
        add: '+2.00'
      },
      nextExam: '2025-10-15',
      notes: 'Patient reports occasional eye strain during computer work. Prescribed new lenses with anti-reflective coating.'
    },
    {
      id: '2',
      date: '2024-04-20',
      type: 'follow-up',
      optometrist: 'Dr. Michael Chen',
      findings: [
        'Vision stable',
        'No changes in prescription needed',
        'Continue current lens care routine'
      ],
      nextExam: '2024-10-15',
      notes: 'Routine follow-up. Patient satisfied with current prescription.'
    },
    {
      id: '3',
      date: '2023-10-10',
      type: 'comprehensive-exam',
      optometrist: 'Dr. Emily Davis',
      findings: [
        'First prescription for reading glasses',
        'Mild presbyopia detected',
        'No other issues noted'
      ],
      prescription: {
        sphere: '0.00',
        cylinder: '0.00',
        axis: '0',
        add: '+1.50'
      },
      nextExam: '2024-04-20',
      notes: 'Initial prescription for reading glasses. Patient adapting well.'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'comprehensive-exam': return 'bg-purple-100 text-purple-800';
      case 'contact-lens': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comprehensive-exam': return 'Comprehensive Exam';
      case 'contact-lens': return 'Contact Lens';
      case 'follow-up': return 'Follow-up';
      default: return type;
    }
  };

  // Prepare radar chart data based on progress across vision history (earliest vs latest prescription)
  const radarData = useMemo(() => {
    const withRx = visionHistory
      .filter(v => !!v.prescription)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (withRx.length === 0) return null;

    const earliest = withRx[0].prescription!;
    const latest = withRx[withRx.length - 1].prescription!;

    const parseNum = (val?: string) => {
      if (!val) return 0;
      const cleaned = val.replace('+', '');
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const normalizeAxis = (val?: string) => {
      const n = Math.min(180, Math.abs(parseNum(val)));
      return n / 60; // normalize 0-3 range
    };

    return [
      {
        metric: 'Sphere',
        earliest: Math.abs(parseNum(earliest.sphere)),
        latest: Math.abs(parseNum(latest.sphere)),
      },
      {
        metric: 'Cylinder',
        earliest: Math.abs(parseNum(earliest.cylinder)),
        latest: Math.abs(parseNum(latest.cylinder)),
      },
      {
        metric: 'Axis',
        earliest: normalizeAxis(earliest.axis),
        latest: normalizeAxis(latest.axis),
      },
      {
        metric: 'Add',
        earliest: Math.abs(parseNum(earliest.add)),
        latest: Math.abs(parseNum(latest.add)),
      },
    ];
  }, [visionHistory]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vision History</h1>
        <p className="text-gray-600 mt-2">Track your eye health journey over time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Examination History</CardTitle>
              <CardDescription>Your complete vision care timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {visionHistory.map(record => (
                  <Card key={record.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold">
                              {format(new Date(record.date), 'MMMM d, yyyy')}
                            </span>
                          </div>
                          <Badge className={getTypeColor(record.type)}>
                            {getTypeLabel(record.type)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
                        >
                          {selectedRecord === record.id ? 'Hide' : 'View'} Details
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{record.optometrist}</span>
                        </div>

                        {selectedRecord === record.id && (
                          <div className="mt-4 space-y-3 pt-3 border-t">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Findings:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                {record.findings.map((finding, index) => (
                                  <li key={index}>{finding}</li>
                                ))}
                              </ul>
                            </div>

                            {record.prescription && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Prescription:</h4>
                                <div className="bg-gray-50 p-3 rounded-md text-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="font-medium">Sphere:</span> {record.prescription.sphere}
                                    </div>
                                    <div>
                                      <span className="font-medium">Cylinder:</span> {record.prescription.cylinder}
                                    </div>
                                    <div>
                                      <span className="font-medium">Axis:</span> {record.prescription.axis}°
                                    </div>
                                    {record.prescription.add && (
                                      <div>
                                        <span className="font-medium">Add:</span> {record.prescription.add}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="font-medium text-sm mb-1">Next Exam:</h4>
                              <p className="text-sm text-gray-600">
                                {format(new Date(record.nextExam), 'MMMM d, yyyy')}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm mb-1">Notes:</h4>
                              <p className="text-sm text-gray-600">{record.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Left Eye Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {radarData ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                      <Radar name="Earliest" dataKey="earliest" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
                      <Radar name="Latest" dataKey="latest" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.45} />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No prescription data available yet.</p>
              )}
              <p className="mt-2 text-xs text-gray-500">Based on earliest vs latest records.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Right Eye Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {radarData ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                      <Radar name="Earliest" dataKey="earliest" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
                      <Radar name="Latest" dataKey="latest" stroke="#10b981" fill="#10b981" fillOpacity={0.45} />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No prescription data available yet.</p>
              )}
              <p className="mt-2 text-xs text-gray-500">Based on earliest vs latest records.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vision Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Exams</span>
                  <Badge variant="secondary">{visionHistory.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Exam</span>
                  <span className="text-sm font-medium">
                    {format(new Date(visionHistory[0]?.date || new Date()), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Due</span>
                  <span className="text-sm font-medium">
                    {format(new Date(visionHistory[0]?.nextExam || new Date()), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" variant="default">
            Download History Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerVisionHistory;
