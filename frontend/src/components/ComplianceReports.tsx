import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, AlertTriangle, XCircle, TrendingUp, FileText, Shield } from 'lucide-react';
import { apiService } from '../services/api';

type FileOption = { file_id: string; filename: string };
type ComplianceMetrics = {
  file_id: string;
  total_test_cases: number;
  compliance_tags: string[];
  compliance_counts: Record<string, number>;
  risk_counts: Record<string, number>;
  test_cases: any[];
  last_updated: string | null;
};

const RISK_COLORS: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-400',
  Low: 'bg-green-500',
};

const RISK_BG: Record<string, string> = {
  Critical: 'bg-red-100',
  High: 'bg-orange-100',
  Medium: 'bg-yellow-100',
  Low: 'bg-green-100',
};

const RISK_TEXT: Record<string, string> = {
  Critical: 'text-red-700',
  High: 'text-orange-700',
  Medium: 'text-yellow-700',
  Low: 'text-green-700',
};

export const ComplianceReports: React.FC = () => {
  const [files, setFiles] = useState<FileOption[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [complianceFilter, setComplianceFilter] = useState<string[]>([]);
  const [period, setPeriod] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Fetch files for dropdown
  useEffect(() => {
    apiService.getUploadedFiles().then((data) => {
      setFiles(data);
      // Do not auto-select any file; let user choose
      setSelectedFile('');
    });
  }, []);

  // Fetch metrics when file or period changes
  useEffect(() => {
    if (!selectedFile) {
      setMetrics(null);
      return;
    }
    setLoading(true);
    apiService.getComplianceMetrics(selectedFile)
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => {
        setMetrics({
          file_id: selectedFile,
          total_test_cases: 0,
          compliance_tags: [],
          compliance_counts: {},
          risk_counts: {},
          test_cases: [],
          last_updated: null,
        });
        setLoading(false);
      });
  }, [selectedFile, period]);

  // Filter test cases by compliance tags
  const filteredTestCases = metrics?.test_cases?.filter(tc => {
    if (complianceFilter.length === 0) return true;
    return tc.compliance_tags.some((tag: string) => complianceFilter.includes(tag));
  }) || [];

  // Filter by time period (if last_updated available)
  const timeFilteredTestCases = filteredTestCases.filter(tc => {
    if (period === 'all' || !tc.created_at) return true;
    const now = new Date();
    const created = new Date(tc.created_at);
    if (period === '7days') return (now.getTime() - created.getTime())/(1000*60*60*24) <= 7;
    if (period === '30days') return (now.getTime() - created.getTime())/(1000*60*60*24) <= 30;
    if (period === '90days') return (now.getTime() - created.getTime())/(1000*60*60*24) <= 90;
    if (period === 'year') return (now.getTime() - created.getTime())/(1000*60*60*24) <= 365;
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (!metrics) return;
    const rows = timeFilteredTestCases.map(tc => [
      tc.tc_id, tc.tc_title, tc.risk, tc.compliance_tags.join(', '), tc.req_title, tc.tc_description, tc.expected_result, tc.input_data
    ]);
    let csv = 'TC ID,Title,Risk,Compliance,Requirement,Description,Expected Result,Input Data\n';
    csv += rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_report_${selectedFile}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF (simple table)
  const handleExportPDF = async () => {
    // Use browser print for now; for production use jsPDF or similar
    window.print();
  };

  // Toggle row expansion
  const toggleRow = (tc_id: string) => {
    setExpandedRows(prev => ({ ...prev, [tc_id]: !prev[tc_id] }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="h-10 bg-slate-200 rounded w-1/2 mt-8" />
        <div className="h-96 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  // Empty state
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FileText className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">No Documents Available</h2>
        <p className="text-slate-500 mb-4">No documents found. Please upload and process a document to view compliance metrics.</p>
      </div>
    );
  }

  // Empty state for no test cases
  if (!metrics || metrics.total_test_cases === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="mb-6">
          <label htmlFor="file-select" className="block text-lg font-semibold text-slate-700 mb-2">Select a Document</label>
          <select
            id="file-select"
            value={selectedFile}
            onChange={e => setSelectedFile(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Document --</option>
            {files.map(f => <option key={f.file_id} value={f.file_id}>{f.filename}</option>)}
          </select>
        </div>
        <FileText className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">No Test Cases Generated</h2>
        <p className="text-slate-500 mb-4">No test cases found for the selected document. Please upload and process a document, or select a file with generated test cases.</p>
      </div>
    );
  }

  // Compliance tag options
  const complianceOptions = metrics.compliance_tags;

  // Metrics cards
  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-900">Compliance Reporting Dashboard</h2>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Document Selector */}
          <select
            value={selectedFile}
            onChange={e => setSelectedFile(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {files.map(f => <option key={f.file_id} value={f.file_id}>{f.filename}</option>)}
          </select>
          {/* Compliance Filter */}
          <select
            multiple
            value={complianceFilter}
            onChange={e => {
              const opts = Array.from(e.target.selectedOptions).map(o => o.value);
              setComplianceFilter(opts);
            }}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            {complianceOptions.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          {/* Time Filter */}
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
          {/* Export Buttons */}
          <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Test Cases */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-blue-700">{metrics.total_test_cases}</span>
          <span className="text-slate-600 mt-2">Total Test Cases</span>
        </div>
        {/* Compliance Coverage Cards */}
        {complianceOptions.map(tag => {
          const count = metrics.compliance_counts[tag] || 0;
          const percent = metrics.total_test_cases ? Math.round((count / metrics.total_test_cases) * 100) : 0;
          return (
            <div key={tag} className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2">
                {/* Replace with official logo/icon if available */}
                <ShieldIcon tag={tag} />
                <span className="font-semibold text-slate-900">{tag}</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{count}</span>
              <span className="text-xs text-slate-500 mb-2">{percent}% coverage</span>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${percent}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(metrics.risk_counts).map(([level, count]) => {
          const percent = metrics.total_test_cases ? Math.round((count / metrics.total_test_cases) * 100) : 0;
          return (
            <div key={level} className={`p-6 rounded-xl border border-slate-200 flex flex-col items-center ${RISK_BG[level]}`}> 
              <span className={`text-lg font-bold ${RISK_TEXT[level]}`}>{level}</span>
              <span className="text-2xl font-bold text-slate-900">{count}</span>
              <span className="text-xs text-slate-500 mb-2">{percent}% of cases</span>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${RISK_COLORS[level]}`} style={{ width: `${percent}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table removed as requested */}
    </div>
  );
};

// Simple shield icon for compliance tags
function ShieldIcon({ tag }: { tag: string }) {
  // Map tag to icon/color if needed
  return <span className="inline-block mr-1"><Shield className="h-5 w-5 text-blue-500 inline" /></span>;
}