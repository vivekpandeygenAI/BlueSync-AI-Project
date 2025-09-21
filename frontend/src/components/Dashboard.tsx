import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { apiService } from '../services/api';

type FileOption = { file_id: string; filename: string; status?: string; uploaded_at?: string };

export const Dashboard: React.FC = () => {
  const [totalFiles, setTotalFiles] = useState('0');
  const [totalRequirements, setTotalRequirements] = useState('0');
  const [totalTestCases, setTotalTestCases] = useState('0');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const files = await apiService.getUploadedFiles();
        setTotalFiles(files.length.toLocaleString());

        // Efficiently fetch requirements and test cases in parallel
        const [requirementsResults, testCasesResults] = await Promise.all([
          Promise.all(files.map((file: FileOption) => apiService.getRequirements(file.file_id))),
          Promise.all(files.map((file: FileOption) => apiService.getTestCasesByFile(file.file_id)))
        ]);

        const requirementsCount = requirementsResults.reduce((sum, reqs) => sum + (Array.isArray(reqs) ? reqs.length : 0), 0);
        const testCasesCount = testCasesResults.reduce((sum, tcRes) => {
          if (tcRes && tcRes.requirements) {
            return sum + tcRes.requirements.reduce((tcSum: number, req: any) => {
              if (req.test_cases && Array.isArray(req.test_cases)) {
                return tcSum + req.test_cases.filter((tc: any) => tc.tc_id).length;
              }
              return tcSum;
            }, 0);
          }
          return sum;
        }, 0);

        setTotalRequirements(requirementsCount.toLocaleString());
        setTotalTestCases(testCasesCount.toLocaleString());

        // Efficient Recent Activity: only use file metadata, no extra API calls
        const activities = files.map((file: any) => ({
          action: file.filename,
          project: file.status || '',
          time: file.uploaded_at || '',
          status: file.status || 'info'
        }));
        setRecentActivities(activities);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      label: 'Files Uploaded',
      value: totalFiles,
      change: '+5%',
      trend: 'up',
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Requirements',
      value: totalRequirements,
      change: '+12%',
      trend: 'up',
      icon: Activity,
      color: 'green'
    },
    {
      label: 'Generated Test Cases',
      value: totalTestCases,
      change: '+8.2%',
      trend: 'up',
      icon: Zap,
      color: 'teal'
    }
    // Compliance Score card removed
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Generate New Tests
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-4 w-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                <span>{stat.change}</span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              <p className="text-slate-600 text-sm mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 mb-1">
                  {activity.project}
                </span>
                <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { level: 'High Risk', count: 3, color: 'red', icon: AlertTriangle },
            { level: 'Medium Risk', count: 12, color: 'yellow', icon: Clock },
            { level: 'Low Risk', count: 89, color: 'green', icon: CheckCircle },
          ].map((risk, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 rounded-lg bg-slate-50">
              <div className={`p-2 rounded-lg bg-${risk.color}-100`}>
                <risk.icon className={`h-5 w-5 text-${risk.color}-600`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{risk.count}</p>
                <p className="text-sm text-slate-600">{risk.level}</p>
              </div>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};