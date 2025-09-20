import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
// Only import CheckCircle, XCircle, Loader2 once

export const IntegrationHub: React.FC = () => {
  const [files, setFiles] = useState<{ file_id: string; filename: string }[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [jiraStatus, setJiraStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [jiraMessage, setJiraMessage] = useState<string>('');
  const [jiraCount, setJiraCount] = useState<number | null>(null);

  useEffect(() => {
    apiService.getUploadedFiles()
      .then((data) => {
        setFiles(data);
      })
      .catch(() => {
        setFiles([]);
      });
  }, []);

  const handlePushToJira = async () => {
    if (!selectedFileId) return;
    setJiraStatus('loading');
    setJiraMessage('');
    setJiraCount(null);
    try {
      const result = await apiService.pushToJira(selectedFileId);
      setJiraStatus('success');
      setJiraCount(result.pushed_count || null);
      setJiraMessage(result.message || 'Successfully pushed test cases to Jira.');
    } catch (err: any) {
      setJiraStatus('error');
      setJiraMessage(err?.message || 'Failed to push test cases to Jira.');
    }
  };
  const [activeTab, setActiveTab] = useState('overview');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete'>('idle');

  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('complete');
    }, 3000);
  };

  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl shadow-md p-8 max-w-md mx-auto mt-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Push Test Cases to Jira</h2>
      <div className="w-full mb-4">
        <label htmlFor="jira-file-select" className="block text-sm font-medium text-slate-700 mb-2">Select Document</label>
        <select
          id="jira-file-select"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedFileId}
          onChange={e => setSelectedFileId(e.target.value)}
        >
          <option value="">-- Select Document --</option>
          {files.map(f => (
            <option key={f.file_id} value={f.file_id}>{f.filename}</option>
          ))}
        </select>
      </div>
      <button
        className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        disabled={!selectedFileId || jiraStatus === 'loading'}
        onClick={handlePushToJira}
      >
        {jiraStatus === 'loading' ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
        Push to Jira
      </button>
      <div className="mt-6 min-h-[32px] flex items-center justify-center w-full">
        {jiraStatus === 'idle' && (
          <span className="text-slate-500 text-sm">Select a document and click push to send test cases to Jira.</span>
        )}
        {jiraStatus === 'success' && (
          <span className="flex items-center text-green-600 text-sm"><CheckCircle className="mr-2 h-5 w-5" />Successfully pushed {jiraCount ?? ''} test cases to Jira.</span>
        )}
        {jiraStatus === 'error' && (
          <span className="flex items-center text-red-600 text-sm"><XCircle className="mr-2 h-5 w-5" />{jiraMessage}</span>
        )}
      </div>
    </div>
  );
}