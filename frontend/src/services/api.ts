export interface ProcessingStatus {
  stage: string;
  progress: number;
  message: string;
}

export interface RequirementExtraction {
  id: string;
  requirement_id: string;
  req_title_id: string;
  title: string;
  description: string;
  compliance?: string[];
  type?: string;
  source?: string;
  category?: string;
  priority?: string;
}

const BASE_URL = 'localhost:8000'; // Adjust as needed

export const apiService = {
  // Push test cases to Jira for a file
  pushToJira: async (fileId: string): Promise<{ requirements_pushed?: number; message?: string }> => {
    const response = await fetch(`${BASE_URL}/api/v1/jira/push/${fileId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      let errorMsg = 'Failed to push test cases to Jira.';
      try {
        const errData = await response.json();
        errorMsg = errData.detail || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return await response.json();
  },
  /**
   * Uploads multiple requirement and input files to the backend.
   * @param requirementFiles Array of requirement File objects
   * @param inputFiles Array of input File objects
   * @returns Response from backend (file_ids, filenames, message)
   */
  uploadDocument: async (
    requirementFiles: File[],
    inputFiles: File[]
  ) => {
    const formData = new FormData();
    requirementFiles.forEach((file) => {
      formData.append('requirement_files', file);
    });
    inputFiles.forEach((file) => {
      formData.append('input_files', file);
    });

  const response = await fetch(`${BASE_URL}/api/v1/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      const error = new Error(`Upload failed: ${response.statusText}`);
      (error as any).response = { data: errorData };
      throw error;
    }

    const data = await response.json();
    return data;
  },
  
  getProcessingStatus: async (fileId: string): Promise<ProcessingStatus> => {
    // For now, return completed status since the upload endpoint processes immediately
    return {
      stage: 'complete',
      progress: 100,
      message: 'Processing complete'
    };
  },
  
  extractFeatures: async (fileId: string) => {
    const response = await fetch(`${BASE_URL}/api/v1/requirements/${fileId}/extract`, {
      method: 'POST',
    });
    console.log(response , "response from feature extraction");
    
    if (!response.ok) {
      throw new Error(`Feature extraction failed: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  getExtractedRequirements: async (fileId: string): Promise<RequirementExtraction[]> => {
  const data = await apiService.extractFeatures(fileId);
  return data.requirements || [];
},

  
  generateTestCases: async (requirements: string[], config: any) => {
    // Mock implementation for now
    return { jobId: `job_${Date.now()}` };
  },
  
  getGeneratedTestCases: async (jobId: string) => {
    // Mock implementation for now
    return [];
  },
  
  getUploadedFiles: async () => {
  const response = await fetch(`${BASE_URL}/api/v1/files/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }
    return await response.json();
  },
  
  getRequirements: async (fileId?: string) => {
    const url = fileId ? `${BASE_URL}/api/v1/requirements/?file_id=${fileId}` : `${BASE_URL}/api/v1/requirements/`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch requirements: ${response.statusText}`);
    }
    return await response.json();
  },
  
  generateTestCasesForRequirement: async (requirementId: string) => {
  const response = await fetch(`${BASE_URL}/api/v1/test-cases/generate/requirement/${requirementId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to generate test cases: ${response.statusText}`);
    }
    return await response.json();
  },

  getTestCases: async () => {
  const response = await fetch(`${BASE_URL}/api/v1/test-cases`);
    if (!response.ok) {
      throw new Error(`Failed to fetch test cases: ${response.statusText}`);
    }
    return await response.json();
  },

  // Get test cases grouped by requirement for a file
  getTestCasesByFile: async (fileId: string) => {
  const response = await fetch(`${BASE_URL}/api/v1/test-cases/file/${fileId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch test cases for file: ${response.statusText}`);
    }
    return await response.json();
  },

  // Generate test cases for a whole file
  generateTestCasesForFile: async (fileId: string) => {
  const response = await fetch(`${BASE_URL}/api/v1/test-cases/generate/file/${fileId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to generate test cases for file: ${response.statusText}`);
    }
    return await response.json();
  },

  // Improve a test case
  improveTestCase: async (payload: { file_id: string; requirement_id: string; tc_id: string; original_description: string; user_input: string }): Promise<{ improved_description: string; message: string; [key: string]: any }> => {
  const response = await fetch(`${BASE_URL}/api/v1/test-cases/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to improve test case');
    }
    return response.json();
  },

    // Fetch compliance metrics for dashboard
    getComplianceMetrics: async (fileId: string) => {
  const response = await fetch(`${BASE_URL}/api/v1/jira/compliance-metrics/${fileId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch compliance metrics: ${response.statusText}`);
      }
      return await response.json();
    },
};