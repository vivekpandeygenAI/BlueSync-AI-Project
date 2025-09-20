import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface UploadedFile {
  file_id: string;
  filename: string;
  created_at: string;
}

interface Requirement {
  requirement_id: string;
  req_title_id: string;
  title: string;
  description: string;
  file_id: string;
}

interface TestCase {
  tc_id: string;
  tc_title: string;
  tc_description: string;
  expected_result: string;
  input_data: string;
  compliance_tags: string;
  risk: string;
  created_at: string;
}

interface GroupedRequirement {
  requirement_id: string;
  req_title_id: string;
  req_title: string;
  requirement_description: string;
  test_cases: TestCase[];
}

const COMPLIANCE_COLORS: Record<string, string> = {
  FDA: 'bg-blue-100 text-blue-800',
  'IEC 62304': 'bg-green-100 text-green-800',
  'ISO 9001': 'bg-yellow-100 text-yellow-800',
  'ISO 13485': 'bg-purple-100 text-purple-800',
  'ISO 27001': 'bg-pink-100 text-pink-800',
};

interface TestCaseCardProps {
  requirementTitle: string;
  requirementId: string;
  testCaseId: string;
  testTitle: string;
  testDescription: string;
  expectedResult: string;
  inputData: string; // JSON string
  complianceTags: string; // Pipe-separated string, e.g. "FDA|IEC 62304|ISO 13485"
  risk: string;
  onRegenerate: () => void;
}
const RISK_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
};

const TAG_COLORS: Record<string, string> = {
  FDA: 'bg-blue-100 text-blue-800',
  'IEC 62304': 'bg-green-100 text-green-800',
  'ISO 9001': 'bg-yellow-100 text-yellow-800',
  'ISO 13485': 'bg-purple-100 text-purple-800',
  'ISO 27001': 'bg-pink-100 text-pink-800',
  HIPAA: 'bg-cyan-100 text-cyan-800',
  GDPR: 'bg-gray-100 text-gray-800',
  Functional: 'bg-indigo-100 text-indigo-800',
  High: 'bg-red-100 text-red-800',
};

function formatDescription(desc: string): React.ReactNode {
  // Split into numbered steps if possible
  const steps = desc.split('\n').filter(line => line.trim());
  if (steps.length > 1) {
    return (
      <ol className="list-decimal ml-6 space-y-1">
        {steps.map((step, idx) => (
          <li key={idx} className="text-gray-700">{step}</li>
        ))}
      </ol>
    );
  }
  return <p className="text-gray-700">{desc}</p>;
}

function formatInputData(input: string): string {
  try {
    const obj = JSON.parse(input);
    return JSON.stringify(obj, null, 2);
  } catch {
    return input;
  }
}

// Move formatDescriptionSmart to top-level so it is accessible everywhere
function formatDescriptionSmart(desc: string): React.ReactNode {
  // Match numbered steps (e.g., "1. ... 2. ... 3. ...")
  // Remove leading numbering from each step
  const regex = /\d+\.\s([^\d]+)(?=(?:\d+\.|$))/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(desc)) !== null) {
    matches.push(match[1].trim());
  }
  if (matches.length > 0) {
    return (
      <ol className="list-decimal ml-6 space-y-1">
        {matches.map((step, idx) => (
          <li key={idx} className="text-gray-700">{step}</li>
        ))}
      </ol>
    );
  }
  // Fallback to line split
  return formatDescription(desc);
}

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  requirementTitle,
  requirementId,
  testCaseId,
  testTitle,
  testDescription,
  expectedResult,
  inputData,
  complianceTags,
  risk,
  onRegenerate,
}) => {
  const tags = complianceTags.split('|').map(tag => tag.trim()).filter(Boolean);

  return (
    <section
      className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.1)] border border-gray-200 rounded-xl p-6 w-full max-w-3xl mx-auto my-6"
      aria-label="Test Case Card"
    >
      {/* Header */}
      <header className="mb-2">
        <h2 className="text-xl font-semibold text-blue-900">{requirementTitle}</h2>
        <div className="text-sm font-medium text-slate-500 mt-1">
          {requirementId} <span className="mx-1">&rarr;</span> {testCaseId}
        </div>
        <h3 className="text-lg font-bold text-blue-700 mt-2">{testTitle}</h3>
      </header>

      {/* Test Description */}
      <section className="mt-4">
        <div className="text-sm font-semibold text-slate-600 mb-1">Test Description:</div>
        {formatDescriptionSmart(testDescription)}
      </section>

      {/* Expected Result */}
      <section className="mt-4">
        <div className="text-sm font-semibold text-slate-600 mb-1">Expected Result:</div>
        <div className="bg-blue-50 rounded px-4 py-2 text-blue-900 font-medium">
          {expectedResult}
        </div>
      </section>

      {/* Input Data (only if not null/empty) */}
      {inputData && inputData !== 'null' && inputData.trim() !== '' && (
        <section className="mt-4">
          <div className="text-sm font-semibold text-slate-600 mb-1">Input Data:</div>
          <div className="relative">
            <SyntaxHighlighter
              language="json"
              style={oneLight}
              customStyle={{
                background: '#F8FAFC',
                borderRadius: '8px',
                fontSize: '0.95rem',
                padding: '1rem',
                maxHeight: '200px',
                overflow: 'auto',
              }}
              showLineNumbers
            >
              {formatInputData(inputData)}
            </SyntaxHighlighter>
            {/* Copy to clipboard button */}
            <button
              type="button"
              aria-label="Copy input data"
              className="absolute top-2 right-2 bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 text-xs"
              onClick={() => navigator.clipboard.writeText(formatInputData(inputData))}
            >
              Copy
            </button>
          </div>
        </section>
      )}

      {/* Compliance Tags */}
      <section className="mt-4">
        <div className="text-sm font-semibold text-slate-600 mb-2">Compliance Tags:</div>
        <div
          className="flex flex-wrap gap-2"
          aria-label="Compliance Tags"
        >
          {tags.map(tag => (
            <span
              key={tag}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-800'} hover:scale-105 hover:shadow`}
              tabIndex={0}
              aria-label={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Risk Level */}
      <section className="mt-4">
        <div className="text-sm font-semibold text-slate-600 mb-2">Risk Level:</div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${RISK_COLORS[risk] || 'bg-gray-100 text-gray-800'}`}>
          {risk}
        </span>
      </section>

      {/* Action Button */}
      <div className="flex justify-center mt-8">
        <button
          type="button"
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          onClick={onRegenerate}
          aria-label="Improve Test Case"
        >
          Improve Test Case
        </button>
      </div>
    </section>
  );
};

const TestGeneration: React.FC = () => {
  // State management
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [groupedTestCases, setGroupedTestCases] = useState<GroupedRequirement[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingImprove, setLoadingImprove] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [generationOption, setGenerationOption] = useState<'file' | 'requirements'>('file');
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improveModalData, setImproveModalData] = useState<{
    file_id: string;
    requirement_id: string;
    tc_id: string;
    original_description: string;
  } | null>(null);
  const [improveInput, setImproveInput] = useState('');
  const [improvedDescription, setImprovedDescription] = useState('');

  // Fetch files on mount
  useEffect(() => {
    setLoadingFiles(true);
    apiService.getUploadedFiles()
      .then(data => setFiles(data))
      .catch(() => setError('Failed to fetch files'))
      .finally(() => setLoadingFiles(false));
  }, []);

  // Debounced fetch test cases when file changes
  useEffect(() => {
    if (!selectedFile) {
      setGroupedTestCases([]);
      setRequirements([]);
      setSelectedRequirements([]);
      return;
    }
    setLoadingTestCases(true);
    setError('');
    setSuccess('');
    apiService.getTestCasesByFile(selectedFile)
      .then((data: { requirements: GroupedRequirement[] }) => {
        if (data.requirements && data.requirements.length > 0) {
          setGroupedTestCases(data.requirements);
        } else {
          setGroupedTestCases([]);
        }
      })
      .catch(() => setError('Failed to fetch test cases'))
      .finally(() => setLoadingTestCases(false));
  }, [selectedFile]);

  // Fetch requirements for requirement-based generation
  const fetchRequirements = useCallback(() => {
    setLoadingTestCases(true);
    apiService.getRequirements(selectedFile)
      .then((data: Requirement[]) => setRequirements(data))
      .catch(() => setError('Failed to fetch requirements'))
      .finally(() => setLoadingTestCases(false));
  }, [selectedFile]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(e.target.value);
    setGroupedTestCases([]);
    setRequirements([]);
    setSelectedRequirements([]);
    setGenerationOption('file');
    setError('');
    setSuccess('');
  };

  // Handle generation option change
  const handleGenerationOptionChange = (option: 'file' | 'requirements') => {
    setGenerationOption(option);
    setSuccess('');
    setError('');
    setGroupedTestCases([]);
    if (option === 'requirements') {
      fetchRequirements();
    }
  };

  // Select all requirements
  const handleSelectAllRequirements = () => {
    if (selectedRequirements.length === requirements.length) {
      setSelectedRequirements([]);
    } else {
      setSelectedRequirements(requirements.map(r => r.requirement_id));
    }
  };

  // Toggle requirement selection
  const handleRequirementToggle = (id: string) => {
    setSelectedRequirements(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  // Generate test cases for whole file
  const handleGenerateForFile = async () => {
    setLoadingGenerate(true);
    setError('');
    setSuccess('');
    try {
      const result = await apiService.generateTestCasesForFile(selectedFile);
      setSuccess(result.message || 'Test cases generated successfully.');
      // Refresh test cases
      const data = await apiService.getTestCasesByFile(selectedFile);
      setGroupedTestCases(data.requirements || []);
    } catch {
      setError('Failed to generate test cases for file.');
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Generate test cases for selected requirements
  const handleGenerateForRequirements = async () => {
    if (selectedRequirements.length === 0) {
      setError('Please select at least one requirement.');
      return;
    }
    setLoadingGenerate(true);
    setError('');
    setSuccess('');
    try {
      for (const reqId of selectedRequirements) {
        await apiService.generateTestCasesForRequirement(reqId);
      }
      setSuccess('Test cases generated for selected requirements.');
      // Refresh test cases
      const data = await apiService.getTestCasesByFile(selectedFile);
      setGroupedTestCases(data.requirements || []);
    } catch {
      setError('Failed to generate test cases for selected requirements.');
    } finally {
      setLoadingGenerate(false);
    }
  };


  // Open improve modal
  const handleOpenImproveModal = (file_id: string, requirement_id: string, tc_id: string, original_description: string) => {
    setImproveModalData({ file_id, requirement_id, tc_id, original_description });
    setImproveInput('');
    setImprovedDescription('');
    setShowImproveModal(true);
  };

  // Submit improved test case
  const handleImproveSubmit = async () => {
    if (!improveModalData) return;
    setLoadingImprove(true);
    setError('');
    try {
      const result = await apiService.improveTestCase({
        file_id: improveModalData.file_id,
        requirement_id: improveModalData.requirement_id,
        tc_id: improveModalData.tc_id,
        original_description: improveModalData.original_description,
        user_input: improveInput,
      });
      setImprovedDescription(result.improved_description);
      setSuccess(result.message || 'Test case improved.');
      // Do not refresh test cases here; refresh after modal closes
    } catch {
      setError('Failed to improve test case.');
    } finally {
      setLoadingImprove(false);
    }
  };

  // Close improve modal and refresh test cases if improvement was made
  const handleCloseImproveModal = async () => {
    setShowImproveModal(false);
    if (improvedDescription) {
      setLoadingTestCases(true);
      try {
        const data = await apiService.getTestCasesByFile(selectedFile);
        setGroupedTestCases(data.requirements || []);
      } catch {
        setError('Failed to refresh test cases after improvement.');
      } finally {
        setLoadingTestCases(false);
      }
    }
  };

  // Utility: Format compliance tags
  const renderComplianceTags = (tags: string) => {
    if (!tags) return null;
    return tags.split(',').map(tag => {
      const trimmed = tag.trim();
      const color = COMPLIANCE_COLORS[trimmed] || 'bg-gray-100 text-gray-800';
      return (
        <span key={trimmed} className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-1 mb-1 ${color}`}>
          {trimmed}
        </span>
      );
    });
  };

  // Sort test cases by req_title_id and tc_id before rendering
  const sortedTestCases = groupedTestCases
    .slice()
    .sort((a, b) => {
      // Sort by req_title_id
      if (a.req_title_id < b.req_title_id) return -1;
      if (a.req_title_id > b.req_title_id) return 1;
      return 0;
    })
    .map(req => ({
      ...req,
      test_cases: req.test_cases.slice().sort((a, b) => {
        // Sort by tc_id
        if (a.tc_id < b.tc_id) return -1;
        if (a.tc_id > b.tc_id) return 1;
        return 0;
      })
    }));

  // Main render
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Test Case Generation
        </h2>

        {/* File Selection */}
        <div className="mb-6">
          <label htmlFor="file-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <select
            id="file-select"
            value={selectedFile}
            onChange={handleFileChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Select file for test case generation"
            disabled={loadingFiles}
          >
            <option value="">Choose a file...</option>
            {files.map(file => (
              <option key={file.file_id} value={file.file_id}>
                {file.filename}
              </option>
            ))}
          </select>
          {loadingFiles && (
            <div className="mt-2 flex items-center gap-2 text-blue-600">
              <span className="dot-loader" aria-hidden="true">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
              <span>Loading ...</span>
            </div>
          )}
        </div>

        {/* Generation Options */}
        {selectedFile && groupedTestCases.length === 0 && (
          <div className="mb-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">Test Case Generation Options</legend>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="generationOption"
                    value="file"
                    checked={generationOption === 'file'}
                    onChange={() => handleGenerationOptionChange('file')}
                    className="accent-blue-600"
                  />
                  <span>Generate for Whole File</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="generationOption"
                    value="requirements"
                    checked={generationOption === 'requirements'}
                    onChange={() => handleGenerationOptionChange('requirements')}
                    className="accent-blue-600"
                  />
                  <span>Generate for Specific Requirements</span>
                </label>
              </div>
            </fieldset>
          </div>
        )}

        {/* Requirement Checklist */}
        {generationOption === 'requirements' && requirements.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Requirements
              </label>
              <button
                type="button"
                className="text-blue-600 underline text-xs"
                onClick={handleSelectAllRequirements}
                aria-label={selectedRequirements.length === requirements.length ? 'Deselect all requirements' : 'Select all requirements'}
              >
                {selectedRequirements.length === requirements.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
              {requirements.map(req => (
                <label key={req.requirement_id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    value={req.requirement_id}
                    checked={selectedRequirements.includes(req.requirement_id)}
                    onChange={() => handleRequirementToggle(req.requirement_id)}
                    className="accent-blue-600"
                  />
                  <span className="font-mono text-xs">{req.req_title_id}</span>
                  <span className="font-medium text-gray-900">{req.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        {selectedFile && groupedTestCases.length === 0 && (
          <div className="mb-6">
            <button
              onClick={generationOption === 'file' ? handleGenerateForFile : handleGenerateForRequirements}
              disabled={loadingGenerate || (generationOption === 'requirements' && selectedRequirements.length === 0)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              aria-busy={loadingGenerate}
            >
              {loadingGenerate
                ? 'Generating Test Cases...'
                : generationOption === 'file'
                  ? 'Generate Test Cases for File'
                  : `Generate Test Cases (${selectedRequirements.length} selected)`}
            </button>
          </div>
        )}

        {/* Notifications */}
        {(error || success) && (
          <div className={`mt-4 p-4 rounded-md border ${error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={error ? 'text-red-600' : 'text-green-600'}>{error || success}</p>
          </div>
        )}

        {/* Loading Spinner */}
        {loadingTestCases && (
          <div className="flex items-center justify-center mt-4 gap-2 text-blue-600">
            <span className="dot-loader" aria-hidden="true">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </span>
            <span>Loading ...</span>
          </div>
        )}


      <style>{`
        .dot-loader {
          display: inline-flex;
          align-items: center;
          gap: 0.4em;
        }
        .dot-loader .dot {
          width: 0.8em;
          height: 0.8em;
          border-radius: 50%;
          background: #2563eb;
          opacity: 0.6;
          animation: dot-bounce 1.2s infinite ease-in-out;
          display: inline-block;
        }
        .dot-loader .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot-loader .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(1); opacity: 0.6; }
          40% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
      </div>

      {/* Test Cases Table (Replaced with Card Display) */}
      {sortedTestCases.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Existing Test Cases ({sortedTestCases.reduce((acc, req) => acc + req.test_cases.length, 0)})
            </h3>
            <button
              className="text-sm text-blue-600 underline"
              onClick={() => {
                setGroupedTestCases([]);
                setGenerationOption('file');
                setSuccess('');
                setError('');
              }}
              aria-label="Regenerate all test cases"
            >
              Regenerate All
            </button>
          </div>
          <div className="mb-4">
            <details className="mb-2" open>
              <summary className="font-semibold text-gray-700 cursor-pointer">Show/Hide Test Cases</summary>
              <div className="grid gap-6 grid-cols-1">
                {sortedTestCases.map(req => (
                  req.test_cases.map(tc => (
                    <TestCaseCard
                      key={tc.tc_id}
                      requirementTitle={req.req_title}
                      requirementId={req.req_title_id}
                      testCaseId={tc.tc_id}
                      testTitle={tc.tc_title}
                      testDescription={tc.tc_description}
                      expectedResult={tc.expected_result}
                      inputData={tc.input_data}
                      complianceTags={tc.compliance_tags.replace(/,/g, '|')}
                      risk={tc.risk}
                      onRegenerate={() => handleOpenImproveModal(selectedFile, req.requirement_id, tc.tc_id, tc.tc_description)}
                    />
                  ))
                ))}
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Improve Modal */}
      {showImproveModal && improveModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h4 className="text-lg font-bold text-gray-800 mb-2">Improve Test Case</h4>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Description</label>
              <div className="p-2 bg-gray-100 rounded text-sm">
                {formatDescriptionSmart(improveModalData.original_description)}
              </div>
            </div>
            <div className="mb-2">
              <label htmlFor="improve-input" className="block text-sm font-medium text-gray-700 mb-1">
                Your Suggestions
              </label>
              <textarea
                id="improve-input"
                value={improveInput}
                onChange={e => setImproveInput(e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded"
                aria-label="Suggestions to improve test case"
                disabled={loadingImprove}
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleImproveSubmit}
                disabled={loadingImprove || !improveInput}
                aria-busy={loadingImprove}
              >
                {loadingImprove ? 'Improving...' : 'Submit'}
              </button>
              <button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                onClick={handleCloseImproveModal}
                disabled={loadingImprove}
              >
                Cancel
              </button>
            </div>
            {improvedDescription && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <label className="block text-sm font-medium text-green-700 mb-1">Improved Description</label>
                <div className="text-sm">{improvedDescription}</div>
              </div>
            )}
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestGeneration;